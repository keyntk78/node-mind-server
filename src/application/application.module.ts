import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InfrastructureModule } from '@infrastructure/infrastructure.module';
import { RegisterHandler } from './auth/command/handler/register.handler';

const commandHandlers = [RegisterHandler];

@Module({
  imports: [CqrsModule, InfrastructureModule],
  providers: [...commandHandlers],
  exports: [CqrsModule],
})
export class ApplicationModule {}
