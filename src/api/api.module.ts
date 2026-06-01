import { AuthController } from './controllers/auth.controller';
// import { ProfileController } from '@api/controllers/profile.controller';
// import { ApplicationModule } from '@application/application.module';
// import { ResponseInterceptor } from '@application/common/interceptors/response.interceptor';
// import { ResponseService } from '@application/common/services/response.service';
import { Module } from '@nestjs/common';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { LoggerService } from '@common/services/logger.service';
import { ResponseService } from '@common/services/response.service';
// import { CqrsModule } from '@nestjs/cqrs';
// import { WalletController } from '@api/controllers/wallet.controller';
// import { CategoryController } from '@api/controllers/category.controller';

@Module({
  //CqrsModule, ApplicationModule
  imports: [],
  controllers: [AuthController],
  providers: [LoggerService, ResponseService, ResponseInterceptor],
})
export class ApiModule {}
