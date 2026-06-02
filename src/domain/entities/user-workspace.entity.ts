import { WorkspaceMembership } from '@domain/entities/enums/workspace-membership.enum';

export type UserWorkspaceProps = {
  userId: string;
  workspaceId: string;
  membership: WorkspaceMembership;
  joinedAt: Date;
};

export type CreateUserWorkspaceProps = {
  userId: string;
  workspaceId: string;
  membership?: WorkspaceMembership;
};

export class UserWorkspace {
  private constructor(private props: UserWorkspaceProps) {}

  static create(props: CreateUserWorkspaceProps): UserWorkspace {
    return new UserWorkspace({
      userId: props.userId,
      workspaceId: props.workspaceId,
      membership: props.membership ?? WorkspaceMembership.MEMBER,
      joinedAt: new Date(),
    });
  }

  static restore(props: UserWorkspaceProps): UserWorkspace {
    return new UserWorkspace(props);
  }

  toPrimitives(): UserWorkspaceProps {
    return { ...this.props };
  }
}
