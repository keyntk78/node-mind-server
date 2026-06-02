export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export type GenerateAccessTokenInput = {
  userId: string;
  email: string;
  workspaceId: string;
  roles: string[];
};

export type GenerateRefreshTokenInput = {
  userId: string;
  jti: string;
};

export type RefreshTokenPayload = {
  sub: string;
  jti: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
};

export interface TokenService {
  generateAccessToken(input: GenerateAccessTokenInput): Promise<string>;
  generateRefreshToken(input: GenerateRefreshTokenInput): Promise<string>;
  verifyRefreshToken(token: string): Promise<RefreshTokenPayload>;
  hashToken(token: string): string;
  getAccessTokenExpiresInSeconds(): number;
  getRefreshTokenExpiresAt(now?: Date): Date;
}
