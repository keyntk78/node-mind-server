import { TOKEN_SERVICE } from '@application/ports/token-service.port';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtTokenService } from './jwt-token.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [
    {
      provide: TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
  ],
  exports: [TOKEN_SERVICE],
})
export class TokenModule {}
