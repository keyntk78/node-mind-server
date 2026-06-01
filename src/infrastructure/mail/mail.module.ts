import { MAIL_QUEUE } from '@application/ports/mail-queue.port';
import {
  REDIS_DB,
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
} from '@common/constants/env.constants';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EMAIL_QUEUE } from './mail.constants';
import { MailProcessor } from './mail.processor';
import { MailQueuePublisher } from './mail-queue.publisher';
import { MailService } from './mail.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: REDIS_HOST,
        port: REDIS_PORT,
        password: REDIS_PASSWORD,
        db: REDIS_DB,
      },
    }),
    BullModule.registerQueue({
      name: EMAIL_QUEUE,
    }),
  ],
  providers: [
    MailService,
    MailProcessor,
    {
      provide: MAIL_QUEUE,
      useClass: MailQueuePublisher,
    },
  ],
  exports: [MAIL_QUEUE],
})
export class MailModule {}
