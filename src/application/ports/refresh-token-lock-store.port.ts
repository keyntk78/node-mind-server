export const REFRESH_TOKEN_LOCK_STORE = Symbol('REFRESH_TOKEN_LOCK_STORE');

export interface RefreshTokenLockStore {
  acquire(userId: string): Promise<boolean>;
  release(userId: string): Promise<void>;
}
