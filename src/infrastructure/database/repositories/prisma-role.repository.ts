import { Role, UserRole } from '@domain/entities';
import { RoleRepository } from '@domain/interfaces';
import { Inject, Injectable } from '@nestjs/common';
import { RolePrismaMapper } from '@infrastructure/database/mappers/role-prisma.mapper';
import { UserRolePrismaMapper } from '@infrastructure/database/mappers/user-role-prisma.mapper';
import type { PrismaClientLike } from '@infrastructure/database/prisma-client.type';
import { PrismaService } from '@infrastructure/database/prisma.service';

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClientLike) {}

  async findByCode(
    code: string,
    workspaceId: string | null = null,
  ): Promise<Role | null> {
    const role = await this.prisma.role.findFirst({
      where: {
        workspaceId,
        code,
      },
    });

    return role ? RolePrismaMapper.toDomain(role) : null;
  }

  async save(role: Role): Promise<void> {
    const persistence = RolePrismaMapper.toPersistence(role);

    await this.prisma.role.upsert({
      where: { id: persistence.id },
      create: persistence,
      update: {
        workspaceId: persistence.workspaceId,
        code: persistence.code,
        name: persistence.name,
        description: persistence.description,
      },
    });
  }

  async assignToUser(userRole: UserRole): Promise<void> {
    const persistence = UserRolePrismaMapper.toPersistence(userRole);

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId_workspaceId: {
          userId: persistence.userId,
          roleId: persistence.roleId,
          workspaceId: persistence.workspaceId,
        },
      },
      create: persistence,
      update: {},
    });
  }
}
