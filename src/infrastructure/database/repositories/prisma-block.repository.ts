import { Block, BlockType } from '@domain/entities';
import { BlockRepository } from '@domain/interfaces';
import { BlockContent } from '@domain/value-objects/block-content.value-object';
import type { PrismaClientLike } from '@infrastructure/database/prisma-client.type';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaBlockRepository implements BlockRepository {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaClientLike,
  ) {}

  async getMaxOrderIndex(pageId: string): Promise<number> {
    const result = await this.prisma.block.aggregate({
      where: { pageId },
      _max: {
        orderIndex: true,
      },
    });

    return result._max.orderIndex ?? -1;
  }

  async save(block: Block): Promise<Block> {
    const primitives = block.toPrimitives();
    const created = await this.prisma.block.create({
      data: {
        id: primitives.id,
        pageId: primitives.pageId,
        type: primitives.type,
        content: primitives.content as Prisma.InputJsonValue,
        orderIndex: primitives.orderIndex,
        createdAt: primitives.createdAt,
        updatedAt: primitives.updatedAt,
      },
    });

    return Block.restore({
      id: created.id,
      pageId: created.pageId,
      type: created.type as BlockType,
      content: BlockContent.create(created.content as Record<string, unknown>),
      orderIndex: created.orderIndex,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  }
}
