import {
  DEFAULT_ERROR_MESSAGES,
  type ErrorCode,
  statusToErrorCode,
} from "@/lib/errors/error-codes";

/** Field-level validation errors, e.g. `{ email: ["Email already registered"] }`. */
export type ValidationErrors = Record<string, string[]>;

/** Shape a backend error response is expected to follow. Every field is optional. */
export interface ApiErrorResponse {
  success?: false;
  message?: string;
  code?: string;
  errors?: ValidationErrors;
  [key: string]: unknown;
}

interface ApiErrorOptions {
  status: number | null;
  code?: string;
  errors?: ValidationErrors;
  data?: unknown;
  cause?: unknown;
}

/**
 * Normalised representation of any failed API call.
 *
 * Every Axios failure is converted into an `ApiError` by the response
 * interceptor in `src/services/api.ts`, so the rest of the app (TanStack
 * Query, components, the global error handler) only ever has to deal with
 * this one shape instead of raw `AxiosError`s.
 */
export class ApiError extends Error {
  readonly name = "ApiError";
  /** HTTP status code, or `null` for network/timeout failures with no response. */
  readonly status: number | null;
  /** Machine-readable error code, e.g. `EMAIL_EXISTS` or a code from `ErrorCode`. */
  readonly code: string;
  /** Field-level validation errors, keyed by field name. */
  readonly errors: ValidationErrors;
  /** The raw response body (or other original error data), kept for logging/debugging. */
  readonly data: unknown;

  constructor(message: string, options: ApiErrorOptions) {
    super(message, { cause: options.cause });
    this.status = options.status;
    this.code = options.code ?? statusToErrorCode(options.status);
    this.errors = options.errors ?? {};
    this.data = options.data ?? null;
  }

  /** Whether this error carries field-level validation errors. */
  get hasValidationErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  /** First validation message for a given field, if any. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }

  /**
   * Builds an `ApiError` from a (possibly malformed) backend response body.
   * Falls back to a status-derived default message/code when the body is
   * missing or doesn't follow the expected shape.
   */
  static fromResponse(status: number | null, body: unknown, cause?: unknown): ApiError {
    const payload = isApiErrorResponse(body) ? body : undefined;
    const code = payload?.code ?? statusToErrorCode(status);
    const message =
      payload?.message ??
      DEFAULT_ERROR_MESSAGES[code as ErrorCode] ??
      DEFAULT_ERROR_MESSAGES.UNKNOWN_ERROR;

    return new ApiError(message, {
      status,
      code,
      errors: payload?.errors,
      data: body,
      cause,
    });
  }

  /** Builds an `ApiError` for failures that never reached the server (network/timeout). */
  static network(message: string, cause?: unknown): ApiError {
    return new ApiError(message, {
      status: null,
      code: "NETWORK_ERROR",
      cause,
    });
  }
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === "object" && value !== null;
}

/** Type guard for narrowing `unknown` catch values to `ApiError`. */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
