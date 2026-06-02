import { MAIL_QUEUE, type MailQueue } from '@application/ports/mail-queue.port';
import { OTP_STORE, type OtpStore } from '@application/ports/otp-store.port';
import {
  PROFILE_REPOSITORY,
  type ProfileRepository,
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/interfaces';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { randomInt } from 'crypto';
import { ResendVerificationOtpCommand } from '../resend-verification-otp.command';

@CommandHandler(ResendVerificationOtpCommand)
export class ResendVerificationOtpHandler
  implements ICommandHandler<ResendVerificationOtpCommand>
{
  private readonly logger = new Logger(ResendVerificationOtpHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
    @Inject(MAIL_QUEUE)
    private readonly mailQueue: MailQueue,
    @Inject(OTP_STORE)
    private readonly otpStore: OtpStore,
  ) {}

  async execute(command: ResendVerificationOtpCommand) {
    const normalizedEmail = command.email.trim().toLowerCase();

    this.logger.log(
      `[CQRS] ResendVerificationOtpHandler: resending OTP to ${normalizedEmail}`,
    );

    const user = await this.userRepository.findByEmail(normalizedEmail);
    if (!user || user.isVerified) {
      return {
        email: normalizedEmail,
        expiresIn: 300,
      };
    }

    const profile = await this.profileRepository.findByUserId(user.id);
    const otp = randomInt(100000, 1000000).toString();

    await this.otpStore.setVerificationOtp(user.email, otp);
    await this.mailQueue.publishOtpEmail({
      email: user.email,
      otp,
      firstName: profile?.firstName ?? '',
    });

    return {
      email: user.email,
      expiresIn: 300,
    };
  }
}
