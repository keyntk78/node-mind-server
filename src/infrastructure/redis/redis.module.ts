import { OTP_STORE } from '@application/ports/otp-store.port';
import { Module } from '@nestjs/common';
import { RedisOtpStore } from './redis-otp-store';

@Module({
  providers: [
    {
      provide: OTP_STORE,
      useClass: RedisOtpStore,
    },
  ],
  exports: [OTP_STORE],
})
export class RedisModule {}
