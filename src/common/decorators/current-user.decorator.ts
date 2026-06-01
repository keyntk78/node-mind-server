import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../interfaces/authenticated-request.interface';

/**
 * CurrentUser returns the full user payload from request.user.
 *
 * This decorator prevents controllers from repeating
 * ctx.switchToHttp().getRequest() in every endpoint. It should be used after an
 * authentication guard, because the guard is responsible for assigning user to
 * the request.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

/**
 * CurrentUserId returns only the id of the currently authenticated user.
 *
 * Use this decorator when an endpoint only needs the user id, such as creating a
 * resource for an owner or querying data for the current user.
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user.id;
  },
);

// export const IsAdmin = createParamDecorator(
//   (data: unknown, ctx: ExecutionContext): boolean => {
//     const request = ctx.switchToHttp().getRequest();
//     return request.user.roles?.includes(Role.ADMIN) || false;
//   },
// );
