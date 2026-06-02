import { Role, UserRole } from '@domain/entities';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRepository {
  findByCode(code: string, workspaceId?: string | null): Promise<Role | null>;
  save(role: Role): Promise<void>;
  assignToUser(userRole: UserRole): Promise<void>;
}
