import { EntityBase } from '@domain/entities/base/entity.base';
import { randomUUID } from 'node:crypto';

export type PageProps = {
  id: string;
  workspaceId: string;
  parentId: string | null;

  title: string;
  icon: string | null;
  coverUrl: string | null;

  orderIndex: number;

  isFavorite: boolean;
  isArchived: boolean;

  isDeleted: boolean;
  deletedAt: Date | null;

  createdById: string;
  updatedById: string | null;

  createdAt: Date;
  updatedAt: Date;
};

export type CreatePageProps = {
  workspaceId: string;
  parentId?: string | null;

  title?: string;
  icon?: string | null;
  coverUrl?: string | null;

  createdById: string;
  orderIndex?: number;
};

export class Page extends EntityBase<string> {
  private constructor(private props: PageProps) {
    super(props.id);
  }

  static create(props: CreatePageProps): Page {
    const now = new Date();

    return new Page({
      id: randomUUID(),

      workspaceId: props.workspaceId,
      parentId: props.parentId ?? null,

      title: this.cleanTitle(props.title),
      icon: props.icon ?? null,
      coverUrl: props.coverUrl ?? null,

      orderIndex: props.orderIndex ?? 0,

      isFavorite: false,
      isArchived: false,

      isDeleted: false,
      deletedAt: null,

      createdById: props.createdById,
      updatedById: null,

      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: PageProps): Page {
    return new Page(props);
  }

  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get parentId(): string | null {
    return this.props.parentId;
  }

  get title(): string {
    return this.props.title;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  rename(title: string): void {
    this.props.title = Page.cleanTitle(title);
    this.touch();
  }

  changeIcon(icon: string | null): void {
    this.props.icon = icon?.trim() || null;
    this.touch();
  }

  changeCover(coverUrl: string | null): void {
    this.props.coverUrl = coverUrl?.trim() || null;
    this.touch();
  }

  move(parentId: string | null): void {
    this.props.parentId = parentId;
    this.touch();
  }

  reorder(orderIndex: number): void {
    this.props.orderIndex = orderIndex;
    this.touch();
  }

  favorite(): void {
    this.props.isFavorite = true;
    this.touch();
  }

  unfavorite(): void {
    this.props.isFavorite = false;
    this.touch();
  }

  archive(): void {
    this.props.isArchived = true;
    this.touch();
  }

  restoreFromArchive(): void {
    this.props.isArchived = false;
    this.touch();
  }

  delete(): void {
    this.props.isDeleted = true;
    this.props.deletedAt = new Date();
    this.touch();
  }

  restoreFromTrash(): void {
    this.props.isDeleted = false;
    this.props.deletedAt = null;
    this.touch();
  }

  updateEditor(userId: string): void {
    this.props.updatedById = userId;
    this.touch();
  }

  toPrimitives(): PageProps {
    return { ...this.props };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static cleanTitle(title?: string): string {
    const value = title?.trim();

    if (!value) {
      return 'Untitled';
    }

    return value;
  }
}
