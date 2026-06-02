import { ProfileRepository } from '@domain/interfaces';
import { Inject, Injectable } from '@nestjs/common';
import { ProfilePrismaMapper } from '@infrastructure/database/mappers/profile-prisma.mapper';
import type { PrismaClientLike } from '@infrastructure/database/prisma-client.type';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class PrismaProfileRepository implements ProfileRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClientLike) {}

  async findByUserId(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    return profile ? ProfilePrismaMapper.toDomain(profile) : null;
  }
}
