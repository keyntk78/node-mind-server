import {
  TOKEN_SERVICE,
  type TokenService,
} from '@application/ports/token-service.port';
import type { AuthenticatedRequest } from '@common/interfaces/authenticated-request.interface';
import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class PagesJwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw this.unauthorized();
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);

      request.user = {
        id: payload.sub,
        email: payload.email,
        workspaceId: payload.workspaceId,
        roles: payload.roles,
        iat: payload.iat,
        exp: payload.exp,
      };

      return true;
    } catch {
      throw this.unauthorized();
    }
  }

  private extractBearerToken(authorization?: string): string | null {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return null;
    }

    return token;
  }

  private unauthorized(): UnauthorizedException {
    return new UnauthorizedException({
      message: 'Unauthorized',
      error: {
        code: 'UNAUTHORIZED',
        details: null,
      },
    });
  }
}
