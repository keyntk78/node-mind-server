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

export interface TokenService {
  generateAccessToken(input: GenerateAccessTokenInput): Promise<string>;
  generateRefreshToken(input: GenerateRefreshTokenInput): Promise<string>;
  hashToken(token: string): string;
  getAccessTokenExpiresInSeconds(): number;
  getRefreshTokenExpiresAt(now?: Date): Date;
}
