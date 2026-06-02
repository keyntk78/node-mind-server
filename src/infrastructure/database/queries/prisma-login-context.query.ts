import {
  LOGIN_CONTEXT_QUERY,
  type LoginContextQuery,
  type LoginWorkspaceContext,
} from '@application/ports/login-context-query.port';
import { WorkspaceMembership } from '@domain/entities';
import type { PrismaClientLike } from '@infrastructure/database/prisma-client.type';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PrismaLoginContextQuery implements LoginContextQuery {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaClientLike) {}

  async findDefaultWorkspaceForUser(
    userId: string,
  ): Promise<LoginWorkspaceContext | null> {
    const membership = await this.prisma.userWorkspace.findFirst({
      where: {
        userId,
        workspace: {
          isActive: true,
        },
      },
      include: {
        workspace: true,
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    if (!membership) {
      return null;
    }

    return {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      membership: membership.membership as WorkspaceMembership,
    };
  }

  async findRoleCodes(userId: string, workspaceId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        workspaceId,
      },
      include: {
        role: true,
      },
      orderBy: {
        role: {
          code: 'asc',
        },
      },
    });

    return userRoles.map((userRole) => userRole.role.code);
  }
}

export const PrismaLoginContextQueryProvider = {
  provide: LOGIN_CONTEXT_QUERY,
  useClass: PrismaLoginContextQuery,
};
