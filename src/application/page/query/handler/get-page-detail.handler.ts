import { GetPageDetailResponse } from '@application/page/query/dto/get-page-detail-response.dto';
import { GetPageDetailQuery } from '@application/page/query/get-page-detail.query';
import { WorkspaceAccessDeniedException } from '@domain/exceptions';
import type { PageRepository, WorkspaceRepository } from '@domain/interfaces';
import { PAGE_REPOSITORY, WORKSPACE_REPOSITORY } from '@domain/interfaces';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetPageDetailQuery)
export class GetPageDetailHandler implements IQueryHandler<
  GetPageDetailQuery,
  GetPageDetailResponse
> {
  private readonly logger = new Logger(GetPageDetailHandler.name);

  constructor(
    @Inject(PAGE_REPOSITORY)
    private readonly pageRepository: PageRepository,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(query: GetPageDetailQuery): Promise<GetPageDetailResponse> {
    this.logger.log('[CQRS] GetPageDetailHandler: retrieving page detail');

    // Fetch the page by ID
    const page = await this.pageRepository.findById(query.pageId);

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    // Check if the user has access to the workspace
    const hasWorkspaceAccess = await this.workspaceRepository.isMember(
      query.userId,
      page.workspaceId,
    );

    if (!hasWorkspaceAccess) {
      throw new WorkspaceAccessDeniedException();
    }

    // Fetch blocks associated with the page
    const blocks = await this.pageRepository.findBlocksByPageId(query.pageId);

    // Convert the page and blocks to primitives for the response
    const pagePrimitives = page.toPrimitives();

    return {
      id: pagePrimitives.id,
      workspaceId: pagePrimitives.workspaceId,
      parentId: pagePrimitives.parentId,
      title: pagePrimitives.title,
      icon: pagePrimitives.icon,
      coverUrl: pagePrimitives.coverUrl,
      orderIndex: pagePrimitives.orderIndex,
      isArchived: pagePrimitives.isArchived,
      isDeleted: pagePrimitives.isDeleted,
      createdAt: pagePrimitives.createdAt,
      updatedAt: pagePrimitives.updatedAt,
      blocks: blocks.map((block) => block.toPrimitives()),
    };
  }
}
