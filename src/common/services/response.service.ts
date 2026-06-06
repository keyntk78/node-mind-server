import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import {
  ApiResponse,
  CursorPaginatedResponse,
  CursorPaginationMeta,
  ErrorResponse,
  PaginatedResponse,
  PaginationMeta,
  SuccessResponse,
} from '../dto/api-response.dto';

@Injectable()
export class ResponseService {
  /**
   * This service groups helpers for building standard controller responses.
   *
   * Controllers can call responseService.success/error/... instead of building
   * objects manually. This keeps the response format consistent across the API
   * and reduces repeated code in route handlers.
   */

  /**
   * Create a successful response with a message and optional data.
   *
   * Use this for endpoints that return normal data, such as retrieving user
   * information or creating a resource successfully.
   */
  success<T>(message: string, data?: T): SuccessResponse<T> {
    return new SuccessResponse(message, data);
  }

  /**
   * Create an error response with a message, error code, and optional details.
   *
   * This method does not set the HTTP status. Status handling usually belongs in
   * a controller or exception filter, while this object only represents the body.
   */
  error(message: string, code: string, details?: any): ErrorResponse {
    return new ErrorResponse(message, code, details);
  }

  /**
   * Create a response for a paginated list.
   *
   * The method accepts page, limit, and total, then calculates totalPages,
   * hasNext, and hasPrev. Callers do not need to repeat pagination metadata logic.
   */
  paginated<T>(
    message: string,
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const pagination: PaginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };

    return new PaginatedResponse(message, data, pagination);
  }

  cursorPaginated<T>(
    message: string,
    data: T[],
    meta: CursorPaginationMeta,
  ): CursorPaginatedResponse<T> {
    return new CursorPaginatedResponse(message, data, meta);
  }

  /**
   * Attach request context to the response.
   *
   * path and method help clients and debuggers identify which request produced
   * the response, especially when logging errors or when an API gateway combines
   * multiple services.
   */
  withRequest<T>(response: ApiResponse<T>, req: Request): ApiResponse<T> {
    response.path = req.path;
    response.method = req.method;
    return response;
  }

  /**
   * Shortcut for a successful create response.
   */
  created<T>(
    data?: T,
    message = 'Resource created successfully',
  ): SuccessResponse<T> {
    return this.success(message, data);
  }

  /**
   * Shortcut for a successful update response.
   */
  updated<T>(
    data?: T,
    message = 'Resource updated successfully',
  ): SuccessResponse<T> {
    return this.success(message, data);
  }

  /**
   * Shortcut for a successful delete response, usually without returned data.
   */
  deleted(message = 'Resource deleted successfully'): SuccessResponse {
    return this.success(message);
  }

  /**
   * Shortcut for a successful retrieval response.
   */
  retrieved<T>(
    data: T,
    message = 'Resource retrieved successfully',
  ): SuccessResponse<T> {
    return this.success(message, data);
  }

  /**
   * Shortcut for a resource-not-found error.
   */
  notFound(message = 'Resource not found', code = 'NOT_FOUND'): ErrorResponse {
    return this.error(message, code);
  }

  /**
   * Shortcut for missing authentication or an invalid token.
   */
  unauthorized(
    message = 'Unauthorized access',
    code = 'AUTHENTICATION_ERROR',
  ): ErrorResponse {
    return this.error(message, code);
  }

  /**
   * Shortcut for a missing-permission error.
   */
  forbidden(
    message = 'Access forbidden',
    code = 'AUTHORIZATION_ERROR',
  ): ErrorResponse {
    return this.error(message, code);
  }

  /**
   * Shortcut for malformed input, invalid input, or missing required data.
   */
  badRequest(
    message = 'Bad request',
    code = 'BAD_REQUEST',
    details?: any,
  ): ErrorResponse {
    return this.error(message, code, details);
  }

  /**
   * Shortcut for validation errors, usually with per-field details.
   */
  validationError(details: any, message = 'Validation failed'): ErrorResponse {
    return this.error(message, 'VALIDATION_ERROR', details);
  }

  /**
   * Shortcut for unexpected system errors.
   */
  internalError(
    message = 'Internal server error',
    code = 'INTERNAL_ERROR',
  ): ErrorResponse {
    return this.error(message, code);
  }
}
