import {
  JWT_ACCESS_EXPIRES_IN_SECONDS,
  JWT_REFRESH_EXPIRES_IN_SECONDS,
  JWT_REFRESH_SECRET,
  JWT_SECRET,
} from '@common/constants/env.constants';
import {
  type AccessTokenPayload,
  type GenerateAccessTokenInput,
  type GenerateRefreshTokenInput,
  type RefreshTokenPayload,
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

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    const payload = await this.jwtService.verifyAsync<Record<string, unknown>>(
      token,
      {
        secret: JWT_SECRET,
      },
    );

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.workspaceId !== 'string' ||
      !Array.isArray(payload.roles) ||
      !payload.roles.every((role) => typeof role === 'string')
    ) {
      throw new Error('Invalid access token payload.');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      workspaceId: payload.workspaceId,
      roles: payload.roles,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    const payload = await this.jwtService.verifyAsync<Record<string, unknown>>(
      token,
      {
        secret: JWT_REFRESH_SECRET,
      },
    );

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.jti !== 'string' ||
      payload.type !== 'refresh'
    ) {
      throw new Error('Invalid refresh token payload.');
    }

    return {
      sub: payload.sub,
      jti: payload.jti,
      type: 'refresh',
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };
  }

  hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  getAccessTokenExpiresInSeconds(): number {
    return JWT_ACCESS_EXPIRES_IN_SECONDS;
  }

  getRefreshTokenExpiresAt(now = new Date()): Date {
    return new Date(now.getTime() + JWT_REFRESH_EXPIRES_IN_SECONDS * 1000);
  }
}
