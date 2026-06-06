import { Block, BlockType, Page } from '@domain/entities';
import { BlockContent } from '@domain/value-objects/block-content.value-object';
import {
  PageChildrenByParentQueryParams,
  PageChildrenItem,
  PageChildrenQueryParams,
  PageRepository,
} from '@domain/interfaces';
import { PagePrismaMapper } from '@infrastructure/database/mappers/page-prisma.mapper';
import type { PrismaClientLike } from '@infrastructure/database/prisma-client.type';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

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

  async findRootPages(
    params: PageChildrenQueryParams,
  ): Promise<PageChildrenItem[]> {
    return this.findPageChildren({
      workspaceId: params.workspaceId,
      parentId: null,
      limit: params.limit,
      cursor: params.cursor,
    });
  }

  async findChildren(
    params: PageChildrenByParentQueryParams,
  ): Promise<PageChildrenItem[]> {
    return this.findPageChildren(params);
  }

  async findBlocksByPageId(pageId: string): Promise<Block[]> {
    const blocks = await this.prisma.block.findMany({
      where: { pageId },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'asc' }],
    });

    return blocks.map((block) =>
      Block.restore({
        id: block.id,
        pageId: block.pageId,
        type: block.type as BlockType,
        content: BlockContent.create(block.content as Record<string, unknown>),
        orderIndex: block.orderIndex,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
      }),
    );
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

  private async findPageChildren(params: {
    workspaceId: string;
    parentId: string | null;
    limit: number;
    cursor?: string;
  }): Promise<PageChildrenItem[]> {
    const cursorPage = params.cursor
      ? await this.prisma.page.findFirst({
          where: {
            id: params.cursor,
            workspaceId: params.workspaceId,
            parentId: params.parentId,
            isDeleted: false,
          },
          select: {
            id: true,
            orderIndex: true,
          },
        })
      : null;

    const cursorWhere: Prisma.PageWhereInput | undefined = cursorPage
      ? {
          OR: [
            { orderIndex: { gt: cursorPage.orderIndex } },
            {
              orderIndex: cursorPage.orderIndex,
              id: { gt: cursorPage.id },
            },
          ],
        }
      : undefined;

    const pages = await this.prisma.page.findMany({
      where: {
        workspaceId: params.workspaceId,
        parentId: params.parentId,
        isDeleted: false,
        ...(cursorWhere ? cursorWhere : {}),
      },
      orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
      take: params.limit,
      select: {
        id: true,
        title: true,
        icon: true,
        parentId: true,
        orderIndex: true,
        updatedAt: true,
      },
    });

    if (pages.length === 0) {
      return [];
    }

    const pageIds = pages.map((page) => page.id);
    const parentsWithChildren = await this.prisma.page.groupBy({
      by: ['parentId'],
      where: {
        workspaceId: params.workspaceId,
        parentId: {
          in: pageIds,
        },
        isDeleted: false,
      },
    });
    const parentIdSet = new Set(
      parentsWithChildren
        .map((parent) => parent.parentId)
        .filter((parentId): parentId is string => Boolean(parentId)),
    );

    return pages.map((page) => ({
      ...page,
      hasChildren: parentIdSet.has(page.id),
    }));
  }
}
