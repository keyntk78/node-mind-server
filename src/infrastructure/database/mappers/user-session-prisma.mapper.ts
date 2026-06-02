import { UserSession } from '@domain/entities';

type PrismaUserSessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
};

export class UserSessionPrismaMapper {
  static toPersistence(session: UserSession): PrismaUserSessionRecord {
    return session.toPrimitives();
  }
}
