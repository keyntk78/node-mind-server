import {
  LOGIN_CONTEXT_QUERY,
  type LoginContextQuery,
} from '@application/ports/login-context-query.port';
import {
  REFRESH_TOKEN_LOCK_STORE,
  type RefreshTokenLockStore,
} from '@application/ports/refresh-token-lock-store.port';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '@application/ports/token-service.port';
import {
  AccountNotReadyException,
  InvalidRefreshTokenException,
  WorkspaceRequiredException,
} from '@domain/exceptions';
import {
  SESSION_REPOSITORY,
  USER_REPOSITORY,
  type SessionRepository,
  type UserRepository,
} from '@domain/interfaces';
import { HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomUUID } from 'node:crypto';
import { RefreshTokenCommand } from '../refresh-token.command';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  private readonly logger = new Logger(RefreshTokenHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(LOGIN_CONTEXT_QUERY)
    private readonly loginContextQuery: LoginContextQuery,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
    @Inject(REFRESH_TOKEN_LOCK_STORE)
    private readonly refreshTokenLockStore: RefreshTokenLockStore,
  ) {}

  async execute(command: RefreshTokenCommand) {
    // Step 1: Receive the refresh request from the controller.
    this.logger.log('[CQRS] RefreshTokenHandler: refreshing token');

    // Step 2: Verify the refresh JWT signature, expiration, and payload shape.
    const payload = await this.verifyRefreshToken(command.refreshToken);

    // Step 3: Hash the raw refresh token because only token hashes are stored.
    const refreshTokenHash = this.tokenService.hashToken(command.refreshToken);

    // Step 4: Find the persisted session that owns this refresh token hash.
    const session =
      await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);

    // Step 5: Reject missing, mismatched, or expired sessions.
    if (!session || session.userId !== payload.sub || session.isExpired()) {
      throw new InvalidRefreshTokenException();
    }

    // Step 6: Acquire a short Redis lock to prevent parallel refresh rotation.
    const lockAcquired = await this.refreshTokenLockStore.acquire(payload.sub);
    if (!lockAcquired) {
      throw new HttpException(
        'Refresh token request in progress.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    try {
      // Step 7: Reload the user so current account status is enforced.
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new InvalidRefreshTokenException();
      }

      // Step 8: Block inactive or unverified accounts from receiving new tokens.
      if (!user.isActive || !user.isVerified) {
        throw new AccountNotReadyException();
      }

      // Step 9: Resolve the workspace context used in the new access token.
      const workspace =
        await this.loginContextQuery.findDefaultWorkspaceForUser(user.id);
      if (!workspace) {
        throw new WorkspaceRequiredException();
      }

      // Step 10: Load workspace-scoped roles for the new access token claims.
      const roles = await this.loginContextQuery.findRoleCodes(
        user.id,
        workspace.id,
      );

      // Step 11: Generate a new access token scoped to the current workspace.
      const accessToken = await this.tokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
        workspaceId: workspace.id,
        roles,
      });

      // Step 12: Generate a new refresh token with a new jti for rotation.
      const newRefreshToken = await this.tokenService.generateRefreshToken({
        userId: user.id,
        jti: randomUUID(),
      });
      const newRefreshTokenHash = this.tokenService.hashToken(newRefreshToken);

      // Step 13: Persist the new refresh token hash so the old token is invalid.
      await this.sessionRepository.rotateRefreshToken(
        session.id,
        newRefreshTokenHash,
        this.tokenService.getRefreshTokenExpiresAt(),
      );

      // Step 14: Return only the new token pair and access token TTL.
      return {
        accessToken,
        refreshToken: newRefreshToken,
        tokenType: 'Bearer',
        expiresIn: this.tokenService.getAccessTokenExpiresInSeconds(),
      };
    } finally {
      // Step 15: Always release the refresh lock after rotation attempt.
      await this.refreshTokenLockStore.release(payload.sub);
    }
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new InvalidRefreshTokenException();
    }
  }
}
