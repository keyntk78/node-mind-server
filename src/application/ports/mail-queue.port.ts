export const MAIL_QUEUE = Symbol('MAIL_QUEUE');

export const SEND_OTP_EMAIL_JOB = 'SEND_OTP_EMAIL';

export interface SendOtpEmailJob {
  email: string;
  otp: string;
  firstName: string;
}

export interface MailQueue {
  publishOtpEmail(job: SendOtpEmailJob): Promise<void>;
}
