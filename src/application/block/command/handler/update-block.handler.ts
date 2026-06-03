import { UpdateBlockCommand } from '@application/block/command/update-block.command';
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
import { API_VALUE_BY_BLOCK_TYPE } from './create-block.handler';

@CommandHandler(UpdateBlockCommand)
export class UpdateBlockHandler implements ICommandHandler<UpdateBlockCommand> {
  private readonly logger = new Logger(UpdateBlockHandler.name);

  constructor(
    @Inject(BLOCK_REPOSITORY)
    private readonly blockRepository: BlockRepository,
    @Inject(PAGE_REPOSITORY)
    private readonly pageRepository: PageRepository,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(command: UpdateBlockCommand) {
    this.logger.log('[CQRS] UpdateBlockHandler: updating block');

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

    const updatedBlock = await this.blockRepository.updateContent(
      command.blockId,
      command.content,
    );

    page.updateEditor(command.userId);
    await this.pageRepository.update(page);

    const primitives = updatedBlock.toPrimitives();

    return {
      ...primitives,
      type: API_VALUE_BY_BLOCK_TYPE[primitives.type],
    };
  }
}
