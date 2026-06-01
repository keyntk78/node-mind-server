import { User } from '@domain/entities';

type PrismaUserRecord = {
  id: string;
  email: string;
  passwordHash: string | null;
  isActive: boolean;
  isVerified: boolean;
  mfaEnabled: boolean;
  mfaSecretEncrypted: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Keeps Prisma field mapping outside the domain entity.
 * Domain stays persistence-agnostic; infrastructure owns database shapes.
 */
export class UserPrismaMapper {
  static toDomain(record: PrismaUserRecord): User {
    return User.restore({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      isActive: record.isActive,
      isVerified: record.isVerified,
      mfaEnabled: record.mfaEnabled,
      mfaSecretEncrypted: record.mfaSecretEncrypted,
      lastLoginAt: record.lastLoginAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(user: User): PrismaUserRecord {
    const props = user.toPrimitives();

    return {
      id: props.id,
      email: props.email,
      passwordHash: props.passwordHash,
      isActive: props.isActive,
      isVerified: props.isVerified,
      mfaEnabled: props.mfaEnabled,
      mfaSecretEncrypted: props.mfaSecretEncrypted,
      lastLoginAt: props.lastLoginAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
