import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy {
  async validate(payload: { sub: string; email: string; roles: string[] }) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}
