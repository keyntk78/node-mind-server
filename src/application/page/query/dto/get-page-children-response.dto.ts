import { PageChildrenItem } from '@domain/interfaces';

export type GetPageChildrenResponse = {
  data: PageChildrenItem[];
  meta: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
};
