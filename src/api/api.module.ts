import { AuthController } from './controllers/auth.controller';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { LoggerService } from '@common/services/logger.service';
import { ResponseService } from '@common/services/response.service';
import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application/application.module';

@Module({
  imports: [ApplicationModule],
  controllers: [AuthController],
  providers: [LoggerService, ResponseService, ResponseInterceptor],
})
export class ApiModule {}
