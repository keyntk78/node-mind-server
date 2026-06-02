import { UserSession } from '@domain/entities';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export interface SessionRepository {
  save(session: UserSession): Promise<void>;
}
