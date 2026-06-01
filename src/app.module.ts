import { ApiExceptionFilter } from '@common/filters/api-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { LoggerMiddleware } from '@common/middleware/logger.middleware';
import { LoggerService } from '@common/services/logger.service';
import { ResponseService } from '@common/services/response.service';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApiModule } from 'src/api/api.module';
import { AuthController } from 'src/api/controllers/auth.controller';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ApiModule,
    // ApplicationModule,
    // TerminusModule,
    // HttpModule,
    // PrometheusModule.register({
    //   controller: MetricsController,
    // }),
    // LoggerModule,
    // RedisModule,
    // MailModule,
    // BullModule.forRoot({
    //   connection: {
    //     host: REDIS_HOST,
    //     port: REDIS_PORT,
    //   },
    // }),
  ],
  //HealthController
  controllers: [],
  providers: [
    // TerminusOptionsService,
    LoggerService,
    ResponseService,
    {
      provide: APP_FILTER,
      useClass: ApiExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes(AuthController);
  }
}
