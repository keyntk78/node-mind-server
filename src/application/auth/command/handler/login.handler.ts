import {
  LOGIN_CONTEXT_QUERY,
  type LoginContextQuery,
} from '@application/ports/login-context-query.port';
import { AUTH_DUMMY_PASSWORD_HASH } from '@common/constants/env.constants';
import { SESSION_REPOSITORY, type SessionRepository } from '@domain/interfaces';
import {
  TOKEN_SERVICE,
  type TokenService,
} from '@application/ports/token-service.port';
import { UserSession } from '@domain/entities';
import {
  AccountNotReadyException,
  InvalidCredentialsException,
  WorkspaceRequiredException,
} from '@domain/exceptions';
import { USER_REPOSITORY, type UserRepository } from '@domain/interfaces';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { compare } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { LoginCommand } from '../login.command';

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  private readonly logger = new Logger(LoginHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(LOGIN_CONTEXT_QUERY)
    private readonly loginContextQuery: LoginContextQuery,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LoginCommand) {
    // Step 1: Receive validated input from the API layer and normalize email.
    const normalizedEmail = command.email.trim().toLowerCase();

    this.logger.log(`[CQRS] LoginHandler: logging in ${normalizedEmail}`);

    // Step 2: Find user by normalized email.
    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user) {
      // Step 3: Run a dummy bcrypt compare to reduce timing differences for unknown emails.
      await compare(command.password, AUTH_DUMMY_PASSWORD_HASH);
      throw new InvalidCredentialsException();
    }

    // Step 4: Reject users without a local password hash, such as OAuth-only accounts.
    if (!user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    // Step 5: Compare the submitted password with the stored bcrypt hash.
    const passwordMatches = await compare(command.password, user.passwordHash);
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    // Step 6: Only active and verified users can log in.
    if (!user.isActive || !user.isVerified) {
      throw new AccountNotReadyException();
    }

    // Step 7: Load the default workspace context for the access token.
    const workspace =
      await this.loginContextQuery.findDefaultWorkspaceForUser(user.id);
    if (!workspace) {
      throw new WorkspaceRequiredException();
    }

    // Step 8: Load workspace-scoped role codes for token claims and response.
    const roles = await this.loginContextQuery.findRoleCodes(
      user.id,
      workspace.id,
    );

    // Step 9: Record the successful login timestamp.
    user.recordLogin();
    await this.userRepository.save(user);

    // Step 10: Generate an access token scoped to the selected workspace.
    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.id,
      email: user.email,
      workspaceId: workspace.id,
      roles,
    });

    // Step 11: Generate refresh token and persist only its hash in user_sessions.
    const refreshTokenId = randomUUID();
    const refreshToken = await this.tokenService.generateRefreshToken({
      userId: user.id,
      jti: refreshTokenId,
    });
    const session = UserSession.create({
      userId: user.id,
      refreshTokenHash: this.tokenService.hashToken(refreshToken),
      deviceInfo: command.deviceInfo,
      ipAddress: command.ipAddress,
      expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
    });
    await this.sessionRepository.save(session);

    // Step 12: Return login payload without exposing internal session state.
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.tokenService.getAccessTokenExpiresInSeconds(),
      user: {
        id: user.id,
        email: user.email,
        isVerified: user.isVerified,
        mfaEnabled: user.mfaEnabled,
      },
      workspace,
      roles,
    };
  }
}
