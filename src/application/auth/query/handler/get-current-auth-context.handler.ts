import {
  LOGIN_CONTEXT_QUERY,
  type LoginContextQuery,
} from '@application/ports/login-context-query.port';
import {
  AccountNotReadyException,
  WorkspaceRequiredException,
} from '@domain/exceptions';
import { USER_REPOSITORY, type UserRepository } from '@domain/interfaces';
import { Inject, Logger, UnauthorizedException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetCurrentAuthContextQuery } from '../get-current-auth-context.query';

@QueryHandler(GetCurrentAuthContextQuery)
export class GetCurrentAuthContextHandler
  implements IQueryHandler<GetCurrentAuthContextQuery>
{
  private readonly logger = new Logger(GetCurrentAuthContextHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(LOGIN_CONTEXT_QUERY)
    private readonly loginContextQuery: LoginContextQuery,
  ) {}

  async execute(query: GetCurrentAuthContextQuery) {
    this.logger.log(`[CQRS] GetCurrentAuthContextHandler: ${query.userId}`);

    const user = await this.userRepository.findById(query.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid authenticated user.');
    }

    if (!user.isActive || !user.isVerified) {
      throw new AccountNotReadyException();
    }

    const workspace = await this.loginContextQuery.findWorkspaceForUser(
      user.id,
      query.workspaceId,
    );
    if (!workspace) {
      throw new WorkspaceRequiredException();
    }

    const roles = await this.loginContextQuery.findRoleCodes(
      user.id,
      workspace.id,
    );

    return {
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
