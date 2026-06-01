import { Injectable } from '@nestjs/common';
import type { NestMiddleware } from '@nestjs/common';
import { NODE_ENV } from '../constants/env.constants';
import { LoggerService } from '../services/logger.service';

/**
 * Sensitive request body keys that must be masked before logging.
 *
 * The middleware only logs request bodies outside production, but fields such as
 * password, token, auth, secret, email, and code are still redacted to avoid
 * exposing sensitive data in terminals or development logs.
 */
const REDACT_KEYS = [
  /pass/i,
  /token/i,
  /auth/i,
  /secret/i,
  /^email$/i,
  /code/i,
];

/**
 * System paths that do not need detailed request logging.
 *
 * Health checks, metrics, and favicon requests can be called frequently. Skipping
 * them keeps logs concise and focused on requests that are useful for debugging.
 */
const SKIP_PATHS = new Set<string>([
  '/',
  '/health',
  '/metrics',
  '/favicon.ico',
]);

/**
 * Methods that should not be logged as regular business requests.
 *
 * OPTIONS is usually a CORS preflight request, while HEAD usually checks only
 * metadata. Skipping them makes real user requests easier to read in the logs.
 */
const SKIP_METHODS = new Set<string>(['OPTIONS', 'HEAD']);

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  /**
   * LoggerMiddleware writes logs after the response has finished.
   *
   * Unlike an interceptor that measures handler execution time, this middleware
   * runs closer to the HTTP layer and can capture statusCode, clientIp,
   * userAgent, requestId, and userId. Logs are written on the finish event so
   * the final statusCode is available.
   */
  constructor(private readonly loggerService: LoggerService) {}

  /**
   * NestMiddleware entry point for every HTTP request.
   *
   * This method skips paths and methods that do not need logging, records the
   * request start time, and then passes control onward. When the response
   * finishes, it calculates durationMs, builds the payload, and selects the
   * appropriate log level.
   */
  use(req: any, res: any, next: any) {
    const method: string = req.method;
    const rawUrl: string = req.originalUrl || req.url || '';
    const urlPath: string = rawUrl.split('?')[0];

    if (SKIP_METHODS.has(method) || SKIP_PATHS.has(urlPath)) {
      return next();
    }

    const startTime = Date.now();
    const isProd = NODE_ENV === 'production';

    // Wait until the response finishes so the final statusCode is available.
    res.on('finish', () => {
      const durationMs = Date.now() - startTime;
      const { statusCode } = res;

      const forwardedFor = (req.headers?.['x-forwarded-for'] as string) || '';
      const clientIp =
        forwardedFor.split(',')[0]?.trim() ||
        req.ip ||
        req.socket?.remoteAddress;
      const userAgent = req.headers?.['user-agent'];

      const baseLog = {
        method,
        url: urlPath,
        statusCode,
        durationMs,
        requestId: req.requestId || req.headers?.['x-request-id'],
        clientIp,
        userAgent,
        userId: req.user?.id,
      } as const;

      // Choose the log level from statusCode and the 1s slow-request threshold.
      const isServerError = statusCode >= 500;
      const isClientError = statusCode >= 400 && statusCode < 500;
      const isSlow = durationMs > 1000; // 1s threshold

      if (!isProd && ['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
        // Non-production can log request bodies for debugging, with sensitive keys masked.
        const redactedBody: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(req.body)) {
          if (REDACT_KEYS.some((regex) => regex.test(key))) {
            redactedBody[key] = '***';
          } else if (typeof value === 'string' && value.length > 256) {
            redactedBody[key] = value.slice(0, 256) + '…';
          } else {
            redactedBody[key] = value;
          }
        }
        const payload = { ...baseLog, body: redactedBody };
        if (isServerError) {
          this.loggerService.err(payload, { module: 'HTTP', method });
        } else if (isClientError || isSlow) {
          this.loggerService.warning(payload, { module: 'HTTP', method });
        } else {
          this.loggerService.log(payload, { module: 'HTTP', method });
        }
      } else {
        if (isServerError) {
          this.loggerService.err(baseLog, { module: 'HTTP', method });
        } else if (isClientError || isSlow) {
          this.loggerService.warning(baseLog, { module: 'HTTP', method });
        } else {
          this.loggerService.log(baseLog, { module: 'HTTP', method });
        }
      }
    });

    next();
  }
}
