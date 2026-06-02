import { UserRole } from '@domain/entities';

type PrismaUserRoleRecord = {
  userId: string;
  roleId: string;
  workspaceId: string;
};

export class UserRolePrismaMapper {
  static toPersistence(userRole: UserRole): PrismaUserRoleRecord {
    return userRole.toPrimitives();
  }
}
