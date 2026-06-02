import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { LoginHandler } from './auth/command/handler/login.handler';
import { LogoutHandler } from './auth/command/handler/logout.handler';
import { RefreshTokenHandler } from './auth/command/handler/refresh-token.handler';
import { RegisterHandler } from './auth/command/handler/register.handler';
import { ResendVerificationOtpHandler } from './auth/command/handler/resend-verification-otp.handler';
import { VerifyEmailHandler } from './auth/command/handler/verify-email.handler';
import { CreatePageHandler } from './notes/command/handler/create-page.handler';
import { GetPageChildrenHandler } from './notes/query/handler/get-page-children.handler';

const commandHandlers = [
  LoginHandler,
  LogoutHandler,
  RefreshTokenHandler,
  RegisterHandler,
  VerifyEmailHandler,
  ResendVerificationOtpHandler,
  CreatePageHandler,
];

const queryHandlers = [GetPageChildrenHandler];

@Module({
  imports: [CqrsModule, InfrastructureModule],
  providers: [...commandHandlers, ...queryHandlers],
  exports: [CqrsModule],
})
export class ApplicationModule {}
