import { UserSession } from '@domain/entities';
import { SessionRepository } from '@domain/interfaces';
import { Inject, Injectable } from '@nestjs/common';
import { UserSessionPrismaMapper } from '@infrastructure/database/mappers/user-session-prisma.mapper';
import type { PrismaClientLike } from '@infrastructure/database/prisma-client.type';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClientLike) {}

  async save(session: UserSession): Promise<void> {
    const persistence = UserSessionPrismaMapper.toPersistence(session);

    await this.prisma.userSession.create({
      data: persistence,
    });
  }

  async findByRefreshTokenHash(hash: string): Promise<UserSession | null> {
    const session = await this.prisma.userSession.findFirst({
      where: {
        refreshTokenHash: hash,
      },
    });

    return session ? UserSessionPrismaMapper.toDomain(session) : null;
  }

  async rotateRefreshToken(
    sessionId: string,
    refreshTokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    await this.prisma.userSession.update({
      where: {
        id: sessionId,
      },
      data: {
        refreshTokenHash,
        expiresAt,
      },
    });
  }

  async deleteById(sessionId: string): Promise<void> {
    await this.prisma.userSession.delete({
      where: {
        id: sessionId,
      },
    });
  }
}
