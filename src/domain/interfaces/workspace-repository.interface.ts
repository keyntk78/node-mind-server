import { UserWorkspace, Workspace } from '@domain/entities';

export const WORKSPACE_REPOSITORY = Symbol('WORKSPACE_REPOSITORY');

export interface WorkspaceRepository {
  findBySlug(slug: string): Promise<Workspace | null>;
  save(workspace: Workspace): Promise<void>;
  addMember(userWorkspace: UserWorkspace): Promise<void>;
}
