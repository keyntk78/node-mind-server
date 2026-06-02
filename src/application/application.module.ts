import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { LoginHandler } from './auth/command/handler/login.handler';
import { RegisterHandler } from './auth/command/handler/register.handler';
import { ResendVerificationOtpHandler } from './auth/command/handler/resend-verification-otp.handler';
import { VerifyEmailHandler } from './auth/command/handler/verify-email.handler';

const commandHandlers = [
  LoginHandler,
  RegisterHandler,
  VerifyEmailHandler,
  ResendVerificationOtpHandler,
];

@Module({
  imports: [CqrsModule, InfrastructureModule],
  providers: [...commandHandlers],
  exports: [CqrsModule],
})
export class ApplicationModule {}
