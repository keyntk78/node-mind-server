import {
  MAIL_FROM,
  MAIL_HOST,
  MAIL_PASSWORD,
  MAIL_PORT,
  MAIL_USER,
} from '@common/constants/env.constants';
import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

interface SendOtpEmailParams {
  email: string;
  otp: string;
  firstName: string;
}

@Injectable()
export class MailService {
  private readonly transporter: Transporter = createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: false,
    auth:
      MAIL_USER && MAIL_PASSWORD
        ? {
            user: MAIL_USER,
            pass: MAIL_PASSWORD,
          }
        : undefined,
  });

  async sendOtpEmail({
    email,
    otp,
    firstName,
  }: SendOtpEmailParams): Promise<void> {
    await this.transporter.sendMail({
      from: MAIL_FROM,
      to: email,
      subject: 'Verify your Node Mind account',
      text: `Hi ${firstName}, your verification code is ${otp}. This code expires in 5 minutes.`,
      html:
        `<p>Hi ${firstName},</p>` +
        `<p>Your verification code is <strong>${otp}</strong>.</p>` +
        '<p>This code expires in 5 minutes.</p>',
    });
  }
}
