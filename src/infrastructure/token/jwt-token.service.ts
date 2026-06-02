import {
  JWT_ACCESS_EXPIRES_IN_SECONDS,
  JWT_REFRESH_EXPIRES_IN_SECONDS,
  JWT_REFRESH_SECRET,
  JWT_SECRET,
} from '@common/constants/env.constants';
import {
  type GenerateAccessTokenInput,
  type GenerateRefreshTokenInput,
  type TokenService,
} from '@application/ports/token-service.port';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash } from 'node:crypto';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(input: GenerateAccessTokenInput): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: input.userId,
        email: input.email,
        workspaceId: input.workspaceId,
        roles: input.roles,
      },
      {
        secret: JWT_SECRET,
        expiresIn: JWT_ACCESS_EXPIRES_IN_SECONDS,
      },
    );
  }

  async generateRefreshToken(
    input: GenerateRefreshTokenInput,
  ): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: input.userId,
        jti: input.jti,
        type: 'refresh',
      },
      {
        secret: JWT_REFRESH_SECRET,
        expiresIn: JWT_REFRESH_EXPIRES_IN_SECONDS,
      },
    );
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getAccessTokenExpiresInSeconds(): number {
    return JWT_ACCESS_EXPIRES_IN_SECONDS;
  }

  getRefreshTokenExpiresAt(now = new Date()): Date {
    return new Date(
      now.getTime() + JWT_REFRESH_EXPIRES_IN_SECONDS * 1000,
    );
  }
}
