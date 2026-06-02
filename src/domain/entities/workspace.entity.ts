import { randomUUID } from 'node:crypto';
import { EntityBase } from '@domain/entities/base/entity.base';

export type WorkspaceProps = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  createdById: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWorkspaceProps = {
  name: string;
  slug: string;
  createdById: string;
  description?: string | null;
  logoUrl?: string | null;
};

export class Workspace extends EntityBase<string> {
  private constructor(private props: WorkspaceProps) {
    super(props.id);
  }

  static create(props: CreateWorkspaceProps): Workspace {
    const now = new Date();

    return new Workspace({
      id: randomUUID(),
      name: Workspace.cleanRequiredText(props.name, 'Workspace name'),
      slug: Workspace.cleanRequiredText(props.slug, 'Workspace slug'),
      description: Workspace.cleanOptionalText(props.description),
      logoUrl: Workspace.cleanOptionalText(props.logoUrl),
      createdById: props.createdById,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: WorkspaceProps): Workspace {
    return new Workspace(props);
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get createdById(): string {
    return this.props.createdById;
  }

  toPrimitives(): WorkspaceProps {
    return { ...this.props };
  }

  private static cleanRequiredText(value: string, fieldName: string): string {
    const cleanedValue = value.trim();
    if (!cleanedValue) {
      throw new Error(`${fieldName} is required.`);
    }
    return cleanedValue;
  }

  private static cleanOptionalText(value?: string | null): string | null {
    const cleanedValue = value?.trim();
    return cleanedValue ? cleanedValue : null;
  }
}
