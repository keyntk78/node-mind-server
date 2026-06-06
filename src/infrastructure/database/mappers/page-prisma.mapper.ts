import { Page } from '@domain/entities';

type PrismaPageRecord = {
  id: string;
  workspaceId: string;
  parentId: string | null;
  title: string;
  icon: string | null;
  coverUrl: string | null;
  orderIndex: number;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdById: string;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class PagePrismaMapper {
  static toDomain(record: PrismaPageRecord): Page {
    return Page.restore(record);
  }

  static toPersistence(page: Page): PrismaPageRecord {
    return page.toPrimitives();
  }
}
