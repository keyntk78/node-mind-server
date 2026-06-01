import { OtpStore } from '@application/ports/otp-store.port';
import {
  REDIS_DB,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
} from '@common/constants/env.constants';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

const OTP_TTL_SECONDS = 300;

@Injectable()
export class RedisOtpStore implements OtpStore, OnModuleDestroy {
  private readonly redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
    db: REDIS_DB,
    maxRetriesPerRequest: 3,
  });

  async setVerificationOtp(email: string, otp: string): Promise<void> {
    await this.redis.set(`auth:otp:${email}`, otp, 'EX', OTP_TTL_SECONDS);
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
  }
}
