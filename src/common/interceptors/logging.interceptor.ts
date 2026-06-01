import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { LoggerService } from '../services/logger.service';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  /**
   * LoggingInterceptor measures request handler execution time.
   *
   * The interceptor wraps the NestJS execution pipeline, making it suitable for
   * measuring how long a request spends inside controller/service handling before
   * the response is returned.
   */
  constructor(private readonly logger: LoggerService) {}

  /**
   * Wrap the request handler and log after the Observable completes successfully.
   *
   * Date.now() is captured before next.handle() runs, then tap() calculates the
   * elapsed time. This log helps identify slow endpoints by method and URL.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          `Execution time for ${method} ${url}: ${Date.now() - now}ms`,
          { module: 'Interceptor', method },
        );
      }),
    );
  }
}
