import { GetPageChildrenResponse } from '@application/page/query/dto/get-page-children-response.dto';
import { GetPageChildrenQuery } from '@application/page/query/get-page-children.query';
import { WorkspaceAccessDeniedException } from '@domain/exceptions';
import type { PageRepository, WorkspaceRepository } from '@domain/interfaces';
import { PAGE_REPOSITORY, WORKSPACE_REPOSITORY } from '@domain/interfaces';
import { Inject, Logger } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetPageChildrenQuery)
export class GetPageChildrenHandler implements IQueryHandler<
  GetPageChildrenQuery,
  GetPageChildrenResponse
> {
  private readonly logger = new Logger(GetPageChildrenHandler.name);

  constructor(
    @Inject(PAGE_REPOSITORY)
    private readonly pageRepository: PageRepository,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(query: GetPageChildrenQuery): Promise<GetPageChildrenResponse> {
    this.logger.log('[CQRS] GetPageChildrenHandler: retrieving page children');

    const hasWorkspaceAccess = await this.workspaceRepository.isMember(
      query.userId,
      query.workspaceId,
    );

    if (!hasWorkspaceAccess) {
      throw new WorkspaceAccessDeniedException();
    }

    const fetchLimit = query.limit + 1;
    const pages =
      query.parentId === 'root'
        ? await this.pageRepository.findRootPages({
            workspaceId: query.workspaceId,
            limit: fetchLimit,
            cursor: query.cursor,
          })
        : await this.pageRepository.findChildren({
            workspaceId: query.workspaceId,
            parentId: query.parentId,
            limit: fetchLimit,
            cursor: query.cursor,
          });

    const hasMore = pages.length > query.limit;
    const data = pages.slice(0, query.limit);
    const nextCursor = hasMore ? (data[data.length - 1]?.id ?? null) : null;

    return {
      data,
      meta: {
        limit: query.limit,
        hasMore,
        nextCursor,
      },
    };
  }
}
