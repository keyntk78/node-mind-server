import { OTP_STORE } from '@application/ports/otp-store.port';
import { REFRESH_TOKEN_LOCK_STORE } from '@application/ports/refresh-token-lock-store.port';
import { Module } from '@nestjs/common';
import { RedisOtpStore } from './redis-otp-store';
import { RedisRefreshTokenLockStore } from './redis-refresh-token-lock-store';

@Module({
  providers: [
    {
      provide: OTP_STORE,
      useClass: RedisOtpStore,
    },
    {
      provide: REFRESH_TOKEN_LOCK_STORE,
      useClass: RedisRefreshTokenLockStore,
    },
  ],
  exports: [OTP_STORE, REFRESH_TOKEN_LOCK_STORE],
})
export class RedisModule {}
