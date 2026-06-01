/**
 * Shared response types for the entire API.
 *
 * The goal is for every endpoint to return the same format: message, data on
 * success, error on failure, and request metadata such as path/method when
 * needed. These classes are simple DTOs with no controller or business logic
 * dependency, so they can be reused across modules.
 */

/**
 * ApiResponse is the base shape for every response returned to clients.
 *
 * Generic T represents the data field type. On failed requests, data may be
 * absent and the response will contain an error field instead.
 */
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  timestamp?: string;
  path?: string;
  method?: string;
}

/**
 * SuccessResponse is used for successful requests.
 *
 * The constructor automatically sets timestamp so clients and logs know when the
 * response was created. meta contains extra request information, currently used
 * to attach path and method when provided by the caller.
 */
export class SuccessResponse<T = any> implements ApiResponse<T> {
  message: string;
  data?: T;
  timestamp?: string;
  path?: string;
  method?: string;

  constructor(message: string, data?: T, meta?: any) {
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
    if (meta) {
      this.path = meta.path;
      this.method = meta.method;
    }
  }
}

/**
 * ErrorResponse is used for failed requests.
 *
 * The error field contains code and details so the frontend can show contextual
 * messages while the backend keeps a stable code for debugging or mapping.
 */
export class ErrorResponse implements ApiResponse {
  message: string;
  error: {
    code: string;
    details?: any;
  };
  timestamp?: string;
  path?: string;
  method?: string;

  constructor(message: string, code: string, details?: any, meta?: any) {
    this.message = message;
    this.error = { code, details };
    this.timestamp = new Date().toISOString();
    if (meta) {
      this.path = meta.path;
      this.method = meta.method;
    }
  }
}

/**
 * PaginationMeta describes the current page for paginated list responses.
 *
 * totalPages, hasNext, and hasPrev are calculated in the service so controllers
 * do not repeat pagination logic in each endpoint.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * PaginatedResponse extends SuccessResponse, with data always represented as an array.
 *
 * In addition to message, data, and timestamp, this response includes pagination
 * so clients know the current page and whether previous or next pages exist.
 */
export class PaginatedResponse<T = any> extends SuccessResponse<T[]> {
  pagination: PaginationMeta;

  constructor(
    message: string,
    data: T[],
    pagination: PaginationMeta,
    meta?: any,
  ) {
    super(message, data, meta);
    this.pagination = pagination;
  }
}
