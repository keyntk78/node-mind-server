// import { Role } from '@domain/entities/enums/role.enum';
import { Request } from 'express';

/**
 * JwtPayload is the user data decoded from an access token.
 *
 * The authentication strategy assigns this payload to request.user. Decorators
 * and guards can rely on this interface to read the user id, email, issued-at
 * timestamp, and expiration timestamp.
 */
export interface JwtPayload {
  // User id, usually transformed from the JWT sub field.
  id: string;

  // Email of the currently authenticated user.
  email: string;

  // Workspace selected when the access token was issued.
  workspaceId?: string;

  // Role list if the app enables role-based access control.
  roles?: string[];

  // Issued at: token creation time as a Unix timestamp.
  iat?: number;

  // Expires at: token expiration time as a Unix timestamp.
  exp?: number;
}

/**
 * AuthenticatedRequest extends Express Request with the user field.
 *
 * Use this type where the request has definitely passed through an
 * authentication guard, because request.user will contain a valid JwtPayload.
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
