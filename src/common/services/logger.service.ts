// import { APP_HOST, NODE_ENV } from '@constants';
import { Injectable, Logger } from '@nestjs/common';
import { APP_HOST, NODE_ENV } from '../constants/env.constants';

/**
 * Context describes where a log entry originated in the application.
 *
 * module is the larger feature area, such as HTTP, AuthService, or
 * ApiExceptionFilter. method is the specific action being handled, such as GET,
 * POST, createUser, or login.
 */
export interface Context {
  // Module name where the log entry is recorded.
  module: string;

  // Method name or action currently being processed.
  method: string;
}

@Injectable()
export class LoggerService extends Logger {
  /**
   * LoggerService wraps NestJS Logger to emit structured JSON logs.
   *
   * Each log includes server, type, timestamp, and epochMs. When context is an
   * object, the service merges module/method into the log so consoles, log
   * files, and observability tools can filter by context more easily.
   */

  /**
   * Convert a log object to a string before passing it to NestJS Logger.
   *
   * In development, JSON is pretty-printed across lines for easier terminal
   * reading. In other environments, JSON is kept on one line so log collectors
   * can parse it more easily and storage usage stays lower.
   */
  private formatLog(data: any): string {
    if (NODE_ENV === 'development') {
      return '\n' + JSON.stringify(data, null, 2);
    }
    return JSON.stringify(data);
  }

  /**
   * Write an INFO log for normal events.
   *
   * message can be a string or object. context can be a simple string or a
   * Context object that separates module/method inside the JSON log.
   */
  log(message: any, context?: string | Context) {
    const now = new Date();
    const standard = {
      server: APP_HOST,
      type: 'INFO',
      timestamp: now.toISOString(),
      epochMs: now.getTime(),
    };

    let data;
    // Context objects are merged into the log to expose module/method separately.
    if (typeof context === 'object' && context !== null) {
      data = { ...standard, ...context, message };
    } else {
      data = { ...standard, context, message };
    }
    super.log(this.formatLog(data));
  }

  /**
   * Write an ERROR log for severe failures.
   *
   * This method delegates to super.error while preserving the shared log format,
   * so 5xx errors and exceptions have the same structure as warnings and info.
   */
  err(message: any, context: string | Context) {
    const now = new Date();
    const standard = {
      server: APP_HOST,
      type: 'ERROR',
      timestamp: now.toISOString(),
      epochMs: now.getTime(),
    };

    let data;
    // String context stays in context; object context is flattened into the log.
    if (typeof context === 'object' && context !== null) {
      data = { ...standard, ...context, message };
    } else {
      data = { ...standard, context, message };
    }
    super.error(this.formatLog(data));
  }

  /**
   * Write a WARNING log for notable situations that are not server failures.
   *
   * Examples include 4xx requests, slow requests, or unusual business cases that
   * the application can still handle.
   */
  warning(message: any, context: string | Context) {
    const now = new Date();
    const standard = {
      server: APP_HOST,
      type: 'WARNING',
      timestamp: now.toISOString(),
      epochMs: now.getTime(),
    };

    let data;
    // Warnings use the standard log structure so they can be filtered by type.
    if (typeof context === 'object' && context !== null) {
      data = { ...standard, ...context, message };
    } else {
      data = { ...standard, context, message };
    }
    super.warn(this.formatLog(data));
  }
}
