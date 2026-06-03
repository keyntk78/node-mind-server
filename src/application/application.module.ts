import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { LoginHandler } from './auth/command/handler/login.handler';
import { LogoutHandler } from './auth/command/handler/logout.handler';
import { RefreshTokenHandler } from './auth/command/handler/refresh-token.handler';
import { RegisterHandler } from './auth/command/handler/register.handler';
import { ResendVerificationOtpHandler } from './auth/command/handler/resend-verification-otp.handler';
import { VerifyEmailHandler } from './auth/command/handler/verify-email.handler';
import { GetCurrentAuthContextHandler } from './auth/query/handler/get-current-auth-context.handler';
import { CreateBlockHandler } from './block/command/handler/create-block.handler';
import { UpdateBlockHandler } from './block/command/handler/update-block.handler';
import { CreatePageHandler } from './page/command/handler/create-page.handler';
import { UpdatePageMetadataHandler } from './page/command/handler/update-page-metadata.handler';
import { GetPageChildrenHandler } from './page/query/handler/get-page-children.handler';
import { GetPageDetailHandler } from './page/query/handler/get-page-detail.handler';

const commandHandlers = [
  LoginHandler,
  LogoutHandler,
  RefreshTokenHandler,
  RegisterHandler,
  VerifyEmailHandler,
  ResendVerificationOtpHandler,
  CreatePageHandler,
  CreateBlockHandler,
  UpdateBlockHandler,
  UpdatePageMetadataHandler,
];

const queryHandlers = [
  GetCurrentAuthContextHandler,
  GetPageChildrenHandler,
  GetPageDetailHandler,
];

@Module({
  imports: [CqrsModule, InfrastructureModule],
  providers: [...commandHandlers, ...queryHandlers],
  exports: [CqrsModule],
})
export class ApplicationModule {}
