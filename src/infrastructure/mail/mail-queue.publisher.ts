import {
  MailQueue,
  SEND_OTP_EMAIL_JOB,
  SendOtpEmailJob,
} from '@application/ports/mail-queue.port';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EMAIL_QUEUE } from './mail.constants';

@Injectable()
export class MailQueuePublisher implements MailQueue {
  constructor(
    @InjectQueue(EMAIL_QUEUE)
    private readonly emailQueue: Queue<SendOtpEmailJob>,
  ) {}

  async publishOtpEmail(job: SendOtpEmailJob): Promise<void> {
    await this.emailQueue.add(SEND_OTP_EMAIL_JOB, job, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: 100,
    });
  }
}
