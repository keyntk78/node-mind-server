import { Page } from '@domain/entities';

export const PAGE_REPOSITORY = Symbol('PAGE_REPOSITORY');

export interface PageRepository {
  findById(id: string): Promise<Page | null>;

  findByIdInWorkspace(id: string, workspaceId: string): Promise<Page | null>;

  findByWorkspaceId(workspaceId: string): Promise<Page[]>;

  findChildren(parentId: string): Promise<Page[]>;

  getMaxOrderIndex(
    workspaceId: string,
    parentId: string | null,
  ): Promise<number | null>;

  exists(id: string): Promise<boolean>;

  save(page: Page): Promise<Page>;

  update(page: Page): Promise<void>;

  delete(id: string): Promise<void>;
}
