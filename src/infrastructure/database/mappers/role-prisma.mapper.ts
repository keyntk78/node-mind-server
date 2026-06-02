import { Role } from '@domain/entities';

type PrismaRoleRecord = {
  id: string;
  workspaceId: string | null;
  code: string;
  name: string;
  description: string | null;
  createdAt: Date;
};

export class RolePrismaMapper {
  static toDomain(record: PrismaRoleRecord): Role {
    return Role.restore(record);
  }

  static toPersistence(role: Role): PrismaRoleRecord {
    return role.toPrimitives();
  }
}
