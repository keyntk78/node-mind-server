import { RefreshTokenLockStore } from '@application/ports/refresh-token-lock-store.port';
import {
  REDIS_DB,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
} from '@common/constants/env.constants';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const REFRESH_LOCK_TTL_SECONDS = 10;

@Injectable()
export class RedisRefreshTokenLockStore
  implements RefreshTokenLockStore, OnModuleDestroy
{
  private readonly redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: REDIS_DB,
    maxRetriesPerRequest: 3,
  });

  async acquire(userId: string): Promise<boolean> {
    const result = await this.redis.set(
      `auth:refresh:${userId}`,
      '1',
      'EX',
      REFRESH_LOCK_TTL_SECONDS,
      'NX',
    );

    return result === 'OK';
  }

  async release(userId: string): Promise<void> {
    await this.redis.del(`auth:refresh:${userId}`);
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
  }
}
