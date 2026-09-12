/**
 * Known application error codes.
 *
 * Backend responses are expected to send a `code` field matching one of
 * these values where possible. Unrecognised codes still flow through the
 * system fine — `ApiError` accepts any string — this just gives call sites
 * a typed, autocompletable set to switch on.
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  SERVER_ERROR: "SERVER_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Maps HTTP status codes to a sensible default error code. */
export function statusToErrorCode(status: number | null): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.NOT_FOUND;
    case 409:
      return ErrorCode.CONFLICT;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorCode.SERVER_ERROR;
    default:
      return ErrorCode.UNKNOWN_ERROR;
  }
}

/** Fallback, user-facing copy per error code, used when the backend omits `message`. */
export const DEFAULT_ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Please check the highlighted fields and try again.",
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  CONFLICT: "This conflicts with existing data.",
  SERVER_ERROR: "Something went wrong on our end. Please try again.",
  NETWORK_ERROR: "Unable to reach the server. Check your connection.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
};
