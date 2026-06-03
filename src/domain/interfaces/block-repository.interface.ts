import { Block } from '@domain/entities';

export const BLOCK_REPOSITORY = Symbol('BLOCK_REPOSITORY');

export interface BlockRepository {
  findById(id: string): Promise<Block | null>;

  getMaxOrderIndex(pageId: string): Promise<number>;

  save(block: Block): Promise<Block>;

  updateContent(
    blockId: string,
    content: Record<string, unknown>,
  ): Promise<Block>;
}
