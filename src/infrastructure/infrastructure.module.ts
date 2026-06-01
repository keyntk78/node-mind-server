import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [PrismaModule, MailModule, RedisModule],
  exports: [PrismaModule, MailModule, RedisModule],
})
export class InfrastructureModule {}
