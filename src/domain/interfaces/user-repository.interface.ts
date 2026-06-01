import { User } from '@domain/entities';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

/**
 * Domain contract for user persistence.
 * Infrastructure adapters implement this interface with Prisma/PostgreSQL.
 */
export interface UserRepository {
  /**
   * Finds a user by normalized email.
   * Returns null when the email is still available.
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Persists a new or changed user aggregate.
   */
  save(user: User): Promise<void>;
}
