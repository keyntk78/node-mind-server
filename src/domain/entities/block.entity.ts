import { EntityBase } from '@domain/entities/base/entity.base';
import { BlockType } from '@domain/entities/enums/block-type.enum';
import { BlockContent } from '@domain/value-objects/block-content.value-object';
import { randomUUID } from 'node:crypto';

export type BlockProps = {
  id: string;
  pageId: string;
  type: BlockType;
  content: BlockContent;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BlockPrimitives = Omit<BlockProps, 'content'> & {
  content: Record<string, unknown>;
};

export type CreateBlockProps = {
  pageId: string;
  type: BlockType;
  content?: BlockContent | Record<string, unknown>;
  orderIndex?: number;
};

export class Block extends EntityBase<string> {
  private constructor(private props: BlockProps) {
    super(props.id);
  }

  static create(props: CreateBlockProps): Block {
    const now = new Date();

    return new Block({
      id: randomUUID(),
      pageId: props.pageId,
      type: props.type,
      content: Block.normalizeContent(props.content),
      orderIndex: props.orderIndex ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: BlockProps): Block {
    return new Block(props);
  }

  get pageId(): string {
    return this.props.pageId;
  }

  get type(): BlockType {
    return this.props.type;
  }

  get content(): BlockContent {
    return this.props.content;
  }

  get orderIndex(): number {
    return this.props.orderIndex;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  moveToPage(pageId: string): void {
    this.props.pageId = pageId;
    this.touch();
  }

  changeType(type: BlockType): void {
    this.props.type = type;
    this.touch();
  }

  updateContent(content: BlockContent | Record<string, unknown>): void {
    this.props.content = Block.normalizeContent(content);
    this.touch();
  }

  reorder(orderIndex: number): void {
    this.props.orderIndex = orderIndex;
    this.touch();
  }

  toPrimitives(): BlockPrimitives {
    return {
      ...this.props,
      content: this.props.content.toPrimitives(),
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static normalizeContent(
    content?: BlockContent | Record<string, unknown>,
  ): BlockContent {
    if (content instanceof BlockContent) {
      return content;
    }

    return BlockContent.create(content ?? {});
  }
}
