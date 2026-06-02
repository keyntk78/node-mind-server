export type UserRoleProps = {
  userId: string;
  roleId: string;
  workspaceId: string;
};

export class UserRole {
  private constructor(private props: UserRoleProps) {}

  static create(props: UserRoleProps): UserRole {
    return new UserRole(props);
  }

  static restore(props: UserRoleProps): UserRole {
    return new UserRole(props);
  }

  toPrimitives(): UserRoleProps {
    return { ...this.props };
  }
}
