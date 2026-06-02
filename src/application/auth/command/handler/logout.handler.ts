import {
  TOKEN_SERVICE,
  type TokenService,
} from '@application/ports/token-service.port';
import { InvalidRefreshTokenException } from '@domain/exceptions';
import { SESSION_REPOSITORY, type SessionRepository } from '@domain/interfaces';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LogoutCommand } from '../logout.command';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  private readonly logger = new Logger(LogoutHandler.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async execute(command: LogoutCommand) {
    this.logger.log('[CQRS] LogoutHandler: logging out session');

    const payload = await this.verifyRefreshToken(command.refreshToken);
    const refreshTokenHash = this.tokenService.hashToken(command.refreshToken);

    const session =
      await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);

    if (
      !session ||
      session.userId !== payload.sub ||
      session.userId !== command.currentUserId ||
      session.isExpired()
    ) {
      throw new InvalidRefreshTokenException();
    }

    await this.sessionRepository.deleteById(session.id);

    return {
      loggedOut: true,
    };
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new InvalidRefreshTokenException();
    }
  }
}
