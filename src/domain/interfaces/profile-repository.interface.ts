import { Profile } from '@domain/entities';

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');

export interface ProfileRepository {
  findByUserId(userId: string): Promise<Profile | null>;
}
