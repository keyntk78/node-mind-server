import { Module } from '@nestjs/common';
import {
  BLOCK_REPOSITORY,
  PAGE_REPOSITORY,
  PROFILE_REPOSITORY,
  ROLE_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
  WORKSPACE_REPOSITORY,
} from '@domain/interfaces';
import { AUTH_VERIFICATION_UNIT_OF_WORK } from '@application/ports/auth-verification-unit-of-work.port';
import { LOGIN_CONTEXT_QUERY } from '@application/ports/login-context-query.port';
import { PrismaAuthVerificationUnitOfWork } from './prisma-auth-verification-unit-of-work';
import { PrismaService } from './prisma.service';
import { PrismaLoginContextQueryProvider } from './queries/prisma-login-context.query';
import { PrismaBlockRepository } from './repositories/prisma-block.repository';
import { PrismaPageRepository } from './repositories/prisma-page.repositoty';
import { PrismaProfileRepository } from './repositories/prisma-profile.repository';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { PrismaSessionRepository } from './repositories/prisma-session.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaWorkspaceRepository } from './repositories/prisma-workspace.repository';

@Module({
  providers: [
    PrismaService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: PROFILE_REPOSITORY,
      useClass: PrismaProfileRepository,
    },
    {
      provide: WORKSPACE_REPOSITORY,
      useClass: PrismaWorkspaceRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: PrismaRoleRepository,
    },
    {
      provide: SESSION_REPOSITORY,
      useClass: PrismaSessionRepository,
    },
    {
      provide: PAGE_REPOSITORY,
      useClass: PrismaPageRepository,
    },
    {
      provide: BLOCK_REPOSITORY,
      useClass: PrismaBlockRepository,
    },
    {
      provide: AUTH_VERIFICATION_UNIT_OF_WORK,
      useClass: PrismaAuthVerificationUnitOfWork,
    },
    PrismaLoginContextQueryProvider,
  ],
  exports: [
    PrismaService,
    USER_REPOSITORY,
    PROFILE_REPOSITORY,
    WORKSPACE_REPOSITORY,
    ROLE_REPOSITORY,
    SESSION_REPOSITORY,
    PAGE_REPOSITORY,
    BLOCK_REPOSITORY,
    AUTH_VERIFICATION_UNIT_OF_WORK,
    LOGIN_CONTEXT_QUERY,
  ],
})
export class PrismaModule {}
