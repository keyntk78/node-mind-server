import { ReorderBlocksCommand } from '@application/block/command/reorder-blocks.command';
import {
  PageNotFoundException,
  WorkspaceAccessDeniedException,
} from '@domain/exceptions';
import type {
  BlockRepository,
  PageRepository,
  WorkspaceRepository,
} from '@domain/interfaces';
import {
  BLOCK_REPOSITORY,
  PAGE_REPOSITORY,
  WORKSPACE_REPOSITORY,
} from '@domain/interfaces';
import { BadRequestException, Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(ReorderBlocksCommand)
export class ReorderBlocksHandler
  implements ICommandHandler<ReorderBlocksCommand>
{
  private readonly logger = new Logger(ReorderBlocksHandler.name);

  constructor(
    @Inject(BLOCK_REPOSITORY)
    private readonly blockRepository: BlockRepository,
    @Inject(PAGE_REPOSITORY)
    private readonly pageRepository: PageRepository,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(command: ReorderBlocksCommand) {
    this.logger.log('[CQRS] ReorderBlocksHandler: reordering blocks');

    const page = await this.pageRepository.findById(command.pageId);

    if (!page || page.isDeleted) {
      throw new PageNotFoundException('Page not found.');
    }

    const hasWorkspaceAccess = await this.workspaceRepository.isMember(
      command.userId,
      page.workspaceId,
    );

    if (!hasWorkspaceAccess) {
      throw new WorkspaceAccessDeniedException();
    }

    const blockIds = command.blocks.map((block) => block.id);
    const uniqueBlockIds = new Set(blockIds);

    if (uniqueBlockIds.size !== blockIds.length) {
      throw new BadRequestException('Duplicate block id.');
    }

    const pageBlocks = await this.blockRepository.findByPageId(command.pageId);
    const pageBlockIds = new Set(pageBlocks.map((block) => block.id));
    const hasInvalidBlock = blockIds.some((blockId) => !pageBlockIds.has(blockId));

    if (hasInvalidBlock) {
      throw new BadRequestException('All blocks must belong to the page.');
    }

    await this.blockRepository.reorderBlocks(command.blocks);

    page.updateEditor(command.userId);
    await this.pageRepository.update(page);

    return {
      pageId: command.pageId,
    };
  }
}
