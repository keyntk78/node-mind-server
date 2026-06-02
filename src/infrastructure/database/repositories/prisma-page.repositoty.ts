import { Page } from '@domain/entities';
import { PageRepository } from '@domain/interfaces';
import { PagePrismaMapper } from '@infrastructure/database/mappers/page-prisma.mapper';
import type { PrismaClientLike } from '@infrastructure/database/prisma-client.type';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PrismaPageRepository implements PageRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaClientLike,
  ) {}

  async findById(id: string): Promise<Page | null> {
    const page = await this.prisma.page.findUnique({
      where: { id },
    });

    return page ? PagePrismaMapper.toDomain(page) : null;
  }

  async findByIdInWorkspace(
    id: string,
    workspaceId: string,
  ): Promise<Page | null> {
    const page = await this.prisma.page.findFirst({
      where: {
        id,
        workspaceId,
        isDeleted: false,
      },
    });

    return page ? PagePrismaMapper.toDomain(page) : null;
  }

  async findByWorkspaceId(workspaceId: string): Promise<Page[]> {
    const pages = await this.prisma.page.findMany({
      where: {
        workspaceId,
        isDeleted: false,
      },
      orderBy: [{ parentId: 'asc' }, { orderIndex: 'asc' }],
    });

    return pages.map(PagePrismaMapper.toDomain);
  }

  async findChildren(parentId: string): Promise<Page[]> {
    const pages = await this.prisma.page.findMany({
      where: {
        parentId,
        isDeleted: false,
      },
      orderBy: {
        orderIndex: 'asc',
      },
    });

    return pages.map(PagePrismaMapper.toDomain);
  }

  async getMaxOrderIndex(
    workspaceId: string,
    parentId: string | null,
  ): Promise<number | null> {
    const result = await this.prisma.page.aggregate({
      where: {
        workspaceId,
        parentId,
        isDeleted: false,
      },
      _max: {
        orderIndex: true,
      },
    });

    return result._max.orderIndex;
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.page.count({
      where: { id },
    });

    return count > 0;
  }

  async save(page: Page): Promise<Page> {
    const persistence = PagePrismaMapper.toPersistence(page);

    const created = await this.prisma.page.create({
      data: persistence,
    });

    return PagePrismaMapper.toDomain(created);
  }

  async update(page: Page): Promise<void> {
    const persistence = PagePrismaMapper.toPersistence(page);

    await this.prisma.page.update({
      where: { id: persistence.id },
      data: {
        workspaceId: persistence.workspaceId,
        parentId: persistence.parentId,
        title: persistence.title,
        icon: persistence.icon,
        coverUrl: persistence.coverUrl,
        orderIndex: persistence.orderIndex,
        isFavorite: persistence.isFavorite,
        isArchived: persistence.isArchived,
        isDeleted: persistence.isDeleted,
        deletedAt: persistence.deletedAt,
        createdById: persistence.createdById,
        updatedById: persistence.updatedById,
        updatedAt: persistence.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.page.delete({
      where: { id },
    });
  }
}
