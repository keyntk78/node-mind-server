import { Injectable } from '@nestjs/common';
import { User } from '@domain/entities';
import { UserRepository } from '@domain/interfaces';
import { UserPrismaMapper } from '@infrastructure/database/mappers/user-prisma.mapper';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

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
}
