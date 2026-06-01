import { MAIL_QUEUE, type MailQueue } from '@application/ports/mail-queue.port';
import { OTP_STORE, type OtpStore } from '@application/ports/otp-store.port';
import { Profile, User } from '@domain/entities';
import { UserAlreadyExistsException } from '@domain/exceptions';
import { USER_REPOSITORY, type UserRepository } from '@domain/interfaces';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { hash } from 'bcryptjs';
import { randomInt } from 'crypto';
import { RegisterCommand } from '../register.command';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(MAIL_QUEUE)
    private readonly mailQueue: MailQueue,
    @Inject(OTP_STORE)
    private readonly otpStore: OtpStore,
  ) {}

  async execute(command: RegisterCommand) {
    const { email, password, firstName, lastName } = command;

    // Step 1: Receive validated input from API layer.
    // DTO validation already checks email format, password strength, firstName, and lastName.
    this.logger.log(`[CQRS] RegisterHandler: registering ${email}`);

    // Step 2: Check duplicate email before creating a new user.
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }

    // Step 3: Hash password before persistence.
    const passwordHash = await hash(password, 12);

    // Step 4: Create user domain entity.
    const user = User.create({ email, passwordHash });
    const profile = Profile.create({
      userId: user.id,
      firstName,
      lastName,
    });

    // Step 5: Save users + profiles in one transaction.
    await this.userRepository.saveWithProfile(user, profile);

    // Step 6: Generate a 6-digit OTP and store it in Redis with a 5-minute TTL.
    const otp = randomInt(100000, 1000000).toString();
    await this.otpStore.setVerificationOtp(user.email, otp);

    // Step 7: Publish OTP email job to the mail queue for async delivery.
    await this.mailQueue.publishOtpEmail({
      email: user.email,
      otp,
      firstName,
    });

    this.logger.log(`[CQRS] User created for ${email}`);
    // Step 8: Return minimal register response.
    return {
      userId: user.id,
      email: user.email,
      isVerified: user.isVerified,
    };
  }
}
