import { UserWorkspace, Workspace } from '@domain/entities';
import { WorkspaceRepository } from '@domain/interfaces';
import { UserWorkspacePrismaMapper } from '@infrastructure/database/mappers/user-workspace-prisma.mapper';
import { WorkspacePrismaMapper } from '@infrastructure/database/mappers/workspace-prisma.mapper';
import type { PrismaClientLike } from '@infrastructure/database/prisma-client.type';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PrismaWorkspaceRepository implements WorkspaceRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClientLike) {}

  async findBySlug(slug: string): Promise<Workspace | null> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
    });

    return workspace ? WorkspacePrismaMapper.toDomain(workspace) : null;
  }

  async save(workspace: Workspace): Promise<void> {
    const persistence = WorkspacePrismaMapper.toPersistence(workspace);

    await this.prisma.workspace.upsert({
      where: { id: persistence.id },
      create: persistence,
      update: {
        name: persistence.name,
        slug: persistence.slug,
        description: persistence.description,
        logoUrl: persistence.logoUrl,
        isActive: persistence.isActive,
        updatedAt: persistence.updatedAt,
      },
    });
  }

  async addMember(userWorkspace: UserWorkspace): Promise<void> {
    const persistence =
      UserWorkspacePrismaMapper.toPersistence(userWorkspace);

    await this.prisma.userWorkspace.upsert({
      where: {
        userId_workspaceId: {
          userId: persistence.userId,
          workspaceId: persistence.workspaceId,
        },
      },
      create: persistence,
      update: {
        membership: persistence.membership,
        joinedAt: persistence.joinedAt,
      },
    });
  }
}
