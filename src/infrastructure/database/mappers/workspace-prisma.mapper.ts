import { Workspace } from '@domain/entities';

type PrismaWorkspaceRecord = {
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

export class WorkspacePrismaMapper {
  static toDomain(record: PrismaWorkspaceRecord): Workspace {
    return Workspace.restore(record);
  }

  static toPersistence(workspace: Workspace): PrismaWorkspaceRecord {
    return workspace.toPrimitives();
  }
}
