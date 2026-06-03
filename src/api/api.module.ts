import { AuthController } from './controllers/auth.controller';
import {
  BlockItemsController,
  BlocksController,
} from './controllers/blocks.controller';
import { PagesController } from './controllers/pages.controller';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { PagesJwtAuthGuard } from '@common/guards/pages-jwt-auth.guard';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { LoggerService } from '@common/services/logger.service';
import { ResponseService } from '@common/services/response.service';
import { TokenModule } from '@infrastructure/token/token.module';
import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application/application.module';

@Module({
  imports: [ApplicationModule, TokenModule],
  controllers: [
    AuthController,
    PagesController,
    BlocksController,
    BlockItemsController,
  ],
  providers: [
    LoggerService,
    ResponseService,
    ResponseInterceptor,
    JwtAuthGuard,
    PagesJwtAuthGuard,
  ],
})
export class ApiModule {}
