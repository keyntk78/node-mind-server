import { Inject, Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { Profile, User } from '@domain/entities';
import { UserRepository } from '@domain/interfaces';
import { ProfilePrismaMapper } from '@infrastructure/database/mappers/profile-prisma.mapper';
import { UserPrismaMapper } from '@infrastructure/database/mappers/user-prisma.mapper';
import type { PrismaClientLike } from '@infrastructure/database/prisma-client.type';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClientLike) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    return user ? UserPrismaMapper.toDomain(user) : null;
  }

  async save(user: User): Promise<void> {
    const persistence = UserPrismaMapper.toPersistence(user);

    await this.prisma.user.upsert({
      where: { id: persistence.id },
      create: persistence,
      update: {
        email: persistence.email,
        passwordHash: persistence.passwordHash,
        isActive: persistence.isActive,
        isVerified: persistence.isVerified,
        mfaEnabled: persistence.mfaEnabled,
        mfaSecretEncrypted: persistence.mfaSecretEncrypted,
        lastLoginAt: persistence.lastLoginAt,
        updatedAt: persistence.updatedAt,
      },
    });
  }

  async saveWithProfile(user: User, profile: Profile): Promise<void> {
    const userPersistence = UserPrismaMapper.toPersistence(user);
    const profilePersistence = ProfilePrismaMapper.toPersistence(profile);

    if (typeof (this.prisma as PrismaService).$transaction === 'function') {
      const prisma = this.prisma as PrismaService;

      await prisma.$transaction([
        prisma.user.create({
          data: userPersistence,
        }),
        prisma.profile.create({
          data: profilePersistence,
        }),
      ]);
      return;
    }

    const transactionClient = this.prisma as Prisma.TransactionClient;

    await transactionClient.user.create({
      data: userPersistence,
    });
    await transactionClient.profile.create({
      data: profilePersistence,
    });
  }
}
