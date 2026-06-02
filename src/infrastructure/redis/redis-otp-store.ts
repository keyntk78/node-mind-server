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

  /**
   * Sets a verification OTP for the given email with a TTL of 5 minutes (300 seconds).
   */
  async setVerificationOtp(email: string, otp: string): Promise<void> {
    await this.redis.set(`auth:otp:${email}`, otp, 'EX', OTP_TTL_SECONDS);
  }

  /**
   * Retrieves the verification OTP for the given email. Returns null if not found or expired.
   * @param email The email address to retrieve the OTP for.
   * @returns The OTP string if found, or null if not found or expired.
   */
  async getVerificationOtp(email: string): Promise<string | null> {
    return this.redis.get(`auth:otp:${email}`);
  }

  /**
   * deletes the verification OTP for the given email. This should be called after successful verification to clean up the OTP.
   * @param email The email address to delete the OTP for.
   */
  async deleteVerificationOtp(email: string): Promise<void> {
    await this.redis.del(`auth:otp:${email}`);
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
  }
}
