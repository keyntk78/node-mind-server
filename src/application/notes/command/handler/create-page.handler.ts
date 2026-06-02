import { CreatePageCommand } from '@application/notes/command/create-page.command';
import { Page } from '@domain/entities';
import {
  PageNotFoundException,
  WorkspaceAccessDeniedException,
} from '@domain/exceptions';
import { PAGE_REPOSITORY, WORKSPACE_REPOSITORY } from '@domain/interfaces';
import type { PageRepository, WorkspaceRepository } from '@domain/interfaces';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(CreatePageCommand)
export class CreatePageHandler implements ICommandHandler<CreatePageCommand> {
  private readonly logger = new Logger(CreatePageHandler.name);

  constructor(
    @Inject(PAGE_REPOSITORY)
    private readonly pageRepository: PageRepository,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(command: CreatePageCommand) {
    this.logger.log('[CQRS] CreatePageHandler: creating page');

    const hasWorkspaceAccess = await this.workspaceRepository.isMember(
      command.userId,
      command.workspaceId,
    );

    if (!hasWorkspaceAccess) {
      throw new WorkspaceAccessDeniedException();
    }

    if (command.parentId) {
      const parent = await this.pageRepository.findByIdInWorkspace(
        command.parentId,
        command.workspaceId,
      );

      if (!parent) {
        throw new PageNotFoundException();
      }
    }

    const maxOrderIndex = await this.pageRepository.getMaxOrderIndex(
      command.workspaceId,
      command.parentId,
    );

    const page = Page.create({
      workspaceId: command.workspaceId,
      parentId: command.parentId,
      title: command.title,
      icon: command.icon,
      createdById: command.userId,
      orderIndex: maxOrderIndex === null ? 0 : maxOrderIndex + 1,
    });

    const createdPage = await this.pageRepository.save(page);

    return createdPage.toPrimitives();
  }
}
