import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '../exceptions/domain.exception';
import { LoggerService } from '../services/logger.service';
import { ResponseService } from '../services/response.service';

/**
 * Maps domain error codes to HTTP statuses.
 *
 * DomainException only knows about business codes, such as USER_NOT_FOUND. This
 * filter belongs to the API layer, so it decides whether a code should become
 * HTTP 404, 409, 401, and so on.
 */
const DOMAIN_EXCEPTION_STATUS_MAP: Record<string, HttpStatus> = {
  USER_ALREADY_EXISTS: HttpStatus.CONFLICT,
  USER_NOT_FOUND: HttpStatus.NOT_FOUND,
  OTP_EXPIRED: HttpStatus.GONE,
  PROFILE_NOT_FOUND: HttpStatus.NOT_FOUND,
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  INVALID_PASSWORD: HttpStatus.BAD_REQUEST,
  INVALID_EMAIL: HttpStatus.BAD_REQUEST,
  INVALID_REFRESH_TOKEN: HttpStatus.UNAUTHORIZED,
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  /**
   * ApiExceptionFilter catches exceptions raised during HTTP requests.
   *
   * The filter has three responsibilities:
   * 1. Convert exceptions into a consistent status/message/code/details shape.
   * 2. Log errors with LoggerService for debugging and production monitoring.
   * 3. Return the shared response format through ResponseService.
   */
  constructor(
    private readonly responseService: ResponseService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Handle an exception and return a JSON response to the client.
   *
   * The exception may be a DomainException, a NestJS HttpException, a regular
   * Error, or an unknown value. This method keeps client-meaningful messages and
   * codes when possible, while falling back to INTERNAL_ERROR for unknown cases.
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details: any = null;

    if (exception instanceof DomainException) {
      // Domain errors are mapped to HTTP statuses through the lookup table above.
      status =
        DOMAIN_EXCEPTION_STATUS_MAP[exception.code] ||
        HttpStatus.UNPROCESSABLE_ENTITY;
      message = exception.message;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;

      // BadRequestException usually represents validation errors, so expose details clearly.
      if (exception instanceof BadRequestException) {
        if (Array.isArray(exceptionResponse.message)) {
          // Multiple validation errors, such as several invalid fields at once.
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
          details = exceptionResponse.message;
        } else if (typeof exceptionResponse.message === 'string') {
          // A single validation error string is wrapped in an array for client consistency.
          message = 'Validation failed';
          code = 'VALIDATION_ERROR';
          details = [exceptionResponse.message];
        } else {
          // Bad request response that does not match the usual validation format.
          message = exceptionResponse.message || 'Bad request';
          code = 'BAD_REQUEST';
        }
      } else {
        // Other HttpException types reuse the NestJS response message when present.
        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else if (exceptionResponse.message) {
          message = Array.isArray(exceptionResponse.message)
            ? exceptionResponse.message[0]
            : exceptionResponse.message;
        }

        // Convert HTTP statuses into stable client-facing error codes.
        switch (status) {
          case HttpStatus.UNAUTHORIZED:
            code = 'AUTHENTICATION_ERROR';
            break;
          case HttpStatus.FORBIDDEN:
            code = 'AUTHORIZATION_ERROR';
            break;
          case HttpStatus.NOT_FOUND:
            code = 'NOT_FOUND';
            break;
          case HttpStatus.CONFLICT:
            code = 'CONFLICT';
            break;
          case HttpStatus.UNPROCESSABLE_ENTITY:
            code = 'VALIDATION_ERROR';
            details = exceptionResponse.message;
            break;
          case HttpStatus.TOO_MANY_REQUESTS:
            code = 'RATE_LIMIT_EXCEEDED';
            break;
          default:
            code = 'HTTP_ERROR';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      code = 'APPLICATION_ERROR';
    }

    // 5xx statuses are server errors; client and validation errors are warnings.
    const logMethod = status >= 500 ? 'err' : 'warning';
    this.logger[logMethod](
      {
        message,
        code,
        details,
        path: request.url,
        method: request.method,
        exception:
          exception instanceof Error
            ? { message: exception.message, stack: exception.stack }
            : exception,
      },
      { module: 'ApiExceptionFilter', method: request.method },
    );

    const errorResponse = this.responseService.error(message, code, details);
    const responseWithContext = this.responseService.withRequest(
      errorResponse,
      request,
    );

    response.status(status).json(responseWithContext);
  }
}
