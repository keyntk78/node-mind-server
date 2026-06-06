import { DeleteBlockCommand } from '@application/block/command/delete-block.command';
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
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(DeleteBlockCommand)
export class DeleteBlockHandler implements ICommandHandler<DeleteBlockCommand> {
  private readonly logger = new Logger(DeleteBlockHandler.name);

  constructor(
    @Inject(BLOCK_REPOSITORY)
    private readonly blockRepository: BlockRepository,
    @Inject(PAGE_REPOSITORY)
    private readonly pageRepository: PageRepository,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(command: DeleteBlockCommand) {
    this.logger.log('[CQRS] DeleteBlockHandler: deleting block');

    const block = await this.blockRepository.findById(command.blockId);

    if (!block) {
      throw new NotFoundException('Block not found.');
    }

    const page = await this.pageRepository.findById(block.pageId);

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

    await this.blockRepository.deleteAndReorder(
      command.blockId,
      block.pageId,
      block.orderIndex,
    );

    page.updateEditor(command.userId);
    await this.pageRepository.update(page);

    return {
      id: command.blockId,
    };
  }
}
