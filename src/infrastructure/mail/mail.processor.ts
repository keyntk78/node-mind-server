import {
  SEND_OTP_EMAIL_JOB,
  type SendOtpEmailJob,
} from '@application/ports/mail-queue.port';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EMAIL_QUEUE } from './mail.constants';
import { MailService } from './mail.service';

@Processor(EMAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<SendOtpEmailJob>): Promise<void> {
    if (job.name !== SEND_OTP_EMAIL_JOB) {
      this.logger.warn(`Skipped unknown mail job: ${job.name}`);
      return;
    }

    await this.mailService.sendOtpEmail(job.data);
    this.logger.log(`Sent OTP email to ${job.data.email}`);
  }
}
