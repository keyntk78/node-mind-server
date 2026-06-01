import { Profile } from '@domain/entities';

type PrismaProfileRecord = {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  bio: string | null;
  updatedAt: Date;
};

/**
 * Keeps Profile persistence mapping inside infrastructure.
 */
export class ProfilePrismaMapper {
  static toDomain(record: PrismaProfileRecord): Profile {
    return Profile.restore({
      id: record.id,
      userId: record.userId,
      firstName: record.firstName,
      lastName: record.lastName,
      avatarUrl: record.avatarUrl,
      phoneNumber: record.phoneNumber,
      bio: record.bio,
      updatedAt: record.updatedAt,
    });
  }

  static toPersistence(profile: Profile): PrismaProfileRecord {
    const props = profile.toPrimitives();

    return {
      id: props.id,
      userId: props.userId,
      firstName: props.firstName,
      lastName: props.lastName,
      avatarUrl: props.avatarUrl,
      phoneNumber: props.phoneNumber,
      bio: props.bio,
      updatedAt: props.updatedAt,
    };
  }
}
