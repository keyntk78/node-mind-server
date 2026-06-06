import { Block, Page } from '@domain/entities';

export const PAGE_REPOSITORY = Symbol('PAGE_REPOSITORY');

export type PageChildrenQueryParams = {
  workspaceId: string;
  limit: number;
  cursor?: string;
};

export type PageChildrenByParentQueryParams = PageChildrenQueryParams & {
  parentId: string;
};

export type PageChildrenItem = {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
  hasChildren: boolean;
  orderIndex: number;
  updatedAt: Date;
};

export interface PageRepository {
  findById(id: string): Promise<Page | null>;

  findByIdInWorkspace(id: string, workspaceId: string): Promise<Page | null>;

  findByWorkspaceId(workspaceId: string): Promise<Page[]>;

  findRootPages(params: PageChildrenQueryParams): Promise<PageChildrenItem[]>;

  findChildren(
    params: PageChildrenByParentQueryParams,
  ): Promise<PageChildrenItem[]>;

  findBlocksByPageId(pageId: string): Promise<Block[]>;

  getMaxOrderIndex(
    workspaceId: string,
    parentId: string | null,
  ): Promise<number | null>;

  exists(id: string): Promise<boolean>;

  save(page: Page): Promise<Page>;

  update(page: Page): Promise<void>;

  delete(id: string): Promise<void>;
}
