import {
  type AuthVerificationTransaction,
  type AuthVerificationUnitOfWork,
} from '@application/ports/auth-verification-unit-of-work.port';
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaProfileRepository } from './repositories/prisma-profile.repository';
import { PrismaRoleRepository } from './repositories/prisma-role.repository';
import { PrismaSessionRepository } from './repositories/prisma-session.repository';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaWorkspaceRepository } from './repositories/prisma-workspace.repository';

@Injectable()
export class PrismaAuthVerificationUnitOfWork implements AuthVerificationUnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  async run<T>(
    work: (transaction: AuthVerificationTransaction) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(
      async (tx) =>
        work({
          userRepository: new PrismaUserRepository(tx),
          profileRepository: new PrismaProfileRepository(tx),
          workspaceRepository: new PrismaWorkspaceRepository(tx),
          roleRepository: new PrismaRoleRepository(tx),
          sessionRepository: new PrismaSessionRepository(tx),
        }),
      {
        maxWait: 10_000,
        timeout: 30_000,
      },
    );
  }
}
