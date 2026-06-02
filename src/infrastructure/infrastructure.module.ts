import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { MailModule } from './mail/mail.module';
import { RedisModule } from './redis/redis.module';
import { TokenModule } from './token/token.module';

@Module({
  imports: [PrismaModule, MailModule, RedisModule, TokenModule],
  exports: [PrismaModule, MailModule, RedisModule, TokenModule],
})
export class InfrastructureModule {}
