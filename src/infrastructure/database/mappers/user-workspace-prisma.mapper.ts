import { UserWorkspace, WorkspaceMembership } from '@domain/entities';
import { WorkspaceMembership as PrismaWorkspaceMembership } from '@prisma/client';

type PrismaUserWorkspaceRecord = {
  userId: string;
  workspaceId: string;
  membership: PrismaWorkspaceMembership;
  joinedAt: Date;
};

export class UserWorkspacePrismaMapper {
  static toDomain(record: PrismaUserWorkspaceRecord): UserWorkspace {
    return UserWorkspace.restore({
      userId: record.userId,
      workspaceId: record.workspaceId,
      membership: record.membership as WorkspaceMembership,
      joinedAt: record.joinedAt,
    });
  }

  static toPersistence(
    userWorkspace: UserWorkspace,
  ): PrismaUserWorkspaceRecord {
    const props = userWorkspace.toPrimitives();

    return {
      userId: props.userId,
      workspaceId: props.workspaceId,
      membership: props.membership as PrismaWorkspaceMembership,
      joinedAt: props.joinedAt,
    };
  }
}
