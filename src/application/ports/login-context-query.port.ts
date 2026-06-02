import { WorkspaceMembership } from '@domain/entities';

export const LOGIN_CONTEXT_QUERY = Symbol('LOGIN_CONTEXT_QUERY');

export type LoginWorkspaceContext = {
  id: string;
  name: string;
  slug: string;
  membership: WorkspaceMembership;
};

export interface LoginContextQuery {
  findDefaultWorkspaceForUser(
    userId: string,
  ): Promise<LoginWorkspaceContext | null>;
  findRoleCodes(userId: string, workspaceId: string): Promise<string[]>;
}
