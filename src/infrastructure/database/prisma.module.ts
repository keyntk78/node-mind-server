import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from '@domain/interfaces';
import { PrismaService } from './prisma.service';
import { PrismaUserRepository } from './repositories/prisma-user.repository';

@Module({
  providers: [
    PrismaService,
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [PrismaService, USER_REPOSITORY],
})
export class PrismaModule {}
