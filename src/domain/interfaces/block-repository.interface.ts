import { Block } from '@domain/entities';

export const BLOCK_REPOSITORY = Symbol('BLOCK_REPOSITORY');

export interface BlockRepository {
  getMaxOrderIndex(pageId: string): Promise<number>;

  save(block: Block): Promise<Block>;
}
