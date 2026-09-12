import { env } from "@/config/env";
import { isApiError } from "@/lib/errors/api-error";
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "@/lib/errors/error-codes";

/** Normalised, user-safe error info returned by `handleError`. */
export interface HandledError {
  message: string;
  code: string;
  status: number | null;
}

/**
 * Single entry point for turning *any* thrown value into a safe,
 * user-friendly `{ message, code, status }` shape.
 *
 * Use this wherever an error surfaces to a human — mutation `onError`
 * callbacks, the error boundary, catch blocks in event handlers — instead of
 * reading `error.message` directly, which may not exist or may leak
 * implementation details for non-`ApiError` failures.
 */
export function handleError(error: unknown): HandledError {
  if (isApiError(error)) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    logUnexpectedError(error);
    return {
      message: DEFAULT_ERROR_MESSAGES.UNKNOWN_ERROR,
      code: ErrorCode.UNKNOWN_ERROR,
      status: null,
    };
  }

  logUnexpectedError(error);
  return {
    message: DEFAULT_ERROR_MESSAGES.UNKNOWN_ERROR,
    code: ErrorCode.UNKNOWN_ERROR,
    status: null,
  };
}

/**
 * Logs errors that aren't already well-formed `ApiError`s, e.g. programming
 * errors or unexpected exceptions. Kept separate so it's easy to swap in a
 * reporting service (Sentry, etc.) later.
 */
function logUnexpectedError(error: unknown): void {
  if (env.isDevelopment) {
    console.error("[unhandled error]", error);
  }
}
