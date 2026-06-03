import { CreateBlockCommand } from '@application/block/command/create-block.command';
import { Block, BlockType } from '@domain/entities';
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

const BLOCK_TYPE_BY_API_VALUE: Record<string, BlockType> = {
  paragraph: BlockType.PARAGRAPH,
  heading_1: BlockType.HEADING_1,
  heading_2: BlockType.HEADING_2,
  heading_3: BlockType.HEADING_3,
  bullet_list: BlockType.BULLET_LIST,
  numbered_list: BlockType.NUMBERED_LIST,
  todo: BlockType.TODO,
  quote: BlockType.QUOTE,
  code: BlockType.CODE,
  image: BlockType.IMAGE,
  divider: BlockType.DIVIDER,
};

const API_VALUE_BY_BLOCK_TYPE = Object.fromEntries(
  Object.entries(BLOCK_TYPE_BY_API_VALUE).map(([apiValue, blockType]) => [
    blockType,
    apiValue,
  ]),
) as Record<BlockType, string>;

@CommandHandler(CreateBlockCommand)
export class CreateBlockHandler implements ICommandHandler<CreateBlockCommand> {
  private readonly logger = new Logger(CreateBlockHandler.name);

  constructor(
    @Inject(BLOCK_REPOSITORY)
    private readonly blockRepository: BlockRepository,
    @Inject(PAGE_REPOSITORY)
    private readonly pageRepository: PageRepository,
    @Inject(WORKSPACE_REPOSITORY)
    private readonly workspaceRepository: WorkspaceRepository,
  ) {}

  async execute(command: CreateBlockCommand) {
    this.logger.log('[CQRS] CreateBlockHandler: creating block');

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

    const type = BLOCK_TYPE_BY_API_VALUE[command.type];

    if (!type) {
      throw new BadRequestException('Invalid block type');
    }

    const orderIndex =
      command.orderIndex ??
      (await this.blockRepository.getMaxOrderIndex(command.pageId)) + 1;

    const block = Block.create({
      pageId: command.pageId,
      type,
      content: command.content,
      orderIndex,
    });

    const createdBlock = await this.blockRepository.save(block);
    page.updateEditor(command.userId);
    await this.pageRepository.update(page);

    const primitives = createdBlock.toPrimitives();

    return {
      ...primitives,
      type: API_VALUE_BY_BLOCK_TYPE[primitives.type],
    };
  }
}
