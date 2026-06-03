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

  async findById(id: string): Promise<Block | null> {
    const block = await this.prisma.block.findUnique({
      where: { id },
    });

    return block ? this.toDomain(block) : null;
  }

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

    return this.toDomain(created);
  }

  async updateContent(
    blockId: string,
    content: Record<string, unknown>,
  ): Promise<Block> {
    const updated = await this.prisma.block.update({
      where: { id: blockId },
      data: {
        content: content as Prisma.InputJsonValue,
      },
    });

    return this.toDomain(updated);
  }

  private toDomain(block: {
    id: string;
    pageId: string;
    type: string;
    content: Prisma.JsonValue;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
  }): Block {
    return Block.restore({
      id: block.id,
      pageId: block.pageId,
      type: block.type as BlockType,
      content: BlockContent.create(block.content as Record<string, unknown>),
      orderIndex: block.orderIndex,
      createdAt: block.createdAt,
      updatedAt: block.updatedAt,
    });
  }
}
