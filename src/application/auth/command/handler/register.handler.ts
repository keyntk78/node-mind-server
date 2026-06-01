import { User } from '@domain/entities';
import { UserAlreadyExistsException } from '@domain/exceptions';
import { USER_REPOSITORY, type UserRepository } from '@domain/interfaces';
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { hash } from 'bcryptjs';
import { RegisterCommand } from '../register.command';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  private readonly logger = new Logger(RegisterHandler.name);

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(command: RegisterCommand) {
    const { email, password } = command;

    this.logger.log(`[CQRS] RegisterHandler: registering ${email}`);

    // Temporary register flow: only check duplicate email and persist user.
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }

    const passwordHash = await hash(password, 12);
    const user = User.create({ email, passwordHash });

    await this.userRepository.save(user);

    this.logger.log(`[CQRS] User created for ${email}`);

    return user.toPrimitives();
  }
}
