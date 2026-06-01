import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseService } from '@common/services/response.service';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  /**
   * ResponseInterceptor normalizes successful controller return values.
   *
   * Controllers can return raw data, a plain message string, null/undefined, or
   * an already formatted response. The interceptor wraps those values with
   * ResponseService so clients receive the shared API response shape.
   */
  constructor(private readonly responseService: ResponseService) {}

  /**
   * Transform the controller result before it is sent to the client.
   *
   * The request is read from the execution context so path and method can be
   * attached to the final response. The map operator only handles successful
   * emissions; thrown exceptions are handled by the exception filter instead.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => {
        // Already formatted responses only need request context attached.
        if (data && typeof data === 'object' && 'message' in data) {
          return this.responseService.withRequest(data, request);
        }

        // Null or undefined means the operation succeeded without response data.
        if (data === null || data === undefined) {
          return this.responseService.withRequest(
            this.responseService.success('Operation completed successfully'),
            request,
          );
        }

        // Strings are treated as success messages instead of data payloads.
        if (typeof data === 'string') {
          return this.responseService.withRequest(
            this.responseService.success(data),
            request,
          );
        }

        // Login responses with an access token get a more specific success message.
        if (data && typeof data === 'object' && 'access_token' in data) {
          return this.responseService.withRequest(
            this.responseService.success('Authentication successful', data),
            request,
          );
        }

        // Default behavior wraps raw controller data in a standard success response.
        return this.responseService.withRequest(
          this.responseService.success(
            'Operation completed successfully',
            data,
          ),
          request,
        );
      }),
    );
  }
}
