import { UpdatePageMetadataCommand } from '@application/page/command/update-page-metadata.command';
import {
  PageNotFoundException,
  WorkspaceAccessDeniedException,
} from '@domain/exceptions';
import type { PageRepository, WorkspaceRepository } from '@domain/interfaces';
import { PAGE_REPOSITORY, WORKSPACE_REPOSITORY } from '@domain/interfaces';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(UpdatePageMetadataCommand)
export class UpdatePageMetadataHandler
  implements ICommandHandler<UpdatePageMetadataCommand>
{
  private readonly logger = new Logger(UpdatePageMetadataHandler.name);

  constructor(
    @Inject(PAGE_REPOSITORY)
    private readonly pageRepository: PageRepository,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(command: UpdatePageMetadataCommand) {
    this.logger.log('[CQRS] UpdatePageMetadataHandler: updating page metadata');

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

    if (command.title !== undefined) {
      page.rename(command.title);
    }

    if (command.icon !== undefined) {
      page.changeIcon(command.icon);
    }

    if (command.coverUrl !== undefined) {
      page.changeCover(command.coverUrl);
    }

    page.updateEditor(command.userId);

    await this.pageRepository.update(page);

    return page.toPrimitives();
  }
}
