import { randomUUID } from 'node:crypto';
import { EntityBase } from '@domain/entities/base/entity.base';

export type RoleProps = {
  id: string;
  workspaceId: string | null;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export type CreateRoleProps = {
  code: string;
  name: string;
  workspaceId?: string | null;
  description?: string | null;
};

export class Role extends EntityBase<string> {
  private constructor(private props: RoleProps) {
    super(props.id);
  }

  static create(props: CreateRoleProps): Role {
    return new Role({
      id: randomUUID(),
      workspaceId: props.workspaceId ?? null,
      code: Role.cleanRequiredText(props.code, 'Role code'),
      name: Role.cleanRequiredText(props.name, 'Role name'),
      description: Role.cleanOptionalText(props.description),
      createdAt: new Date(),
    });
  }

  static restore(props: RoleProps): Role {
    return new Role(props);
  }

  get code(): string {
    return this.props.code;
  }

  get workspaceId(): string | null {
    return this.props.workspaceId;
  }

  toPrimitives(): RoleProps {
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
