import axios, { type AxiosError, type AxiosInstance } from "axios";

import { env } from "@/config/env";
import { clearCsrfToken, ensureCsrfToken } from "@/lib/api/csrf";
import { ApiError } from "@/lib/errors/api-error";

const CSRF_HEADER_NAME = "x-csrf-token";
const UNSAFE_METHODS = new Set(["post", "put", "patch", "delete"]);

/**
 * Shared Axios instance. Import this in feature-specific service modules
 * (see `src/services/*.service.ts`) rather than calling `axios` directly.
 *
 * The backend uses an opaque, HttpOnly, cookie-backed session — there is no
 * bearer token to attach here, ever. `withCredentials` is what makes the
 * browser send/receive that cookie cross-origin.
 */
export const api: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  // CSRF is only required (and only checked by the backend guard) on unsafe
  // methods. Attaching it to safe GETs would be pointless and could trigger
  // an unnecessary token fetch on first load.
  const method = config.method?.toLowerCase();
  if (method && UNSAFE_METHODS.has(method)) {
    const token = await ensureCsrfToken();
    config.headers.set(CSRF_HEADER_NAME, token);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // A CSRF failure most likely means our cached token expired or was
    // rotated server-side. Refresh once and retry the same request exactly
    // once — never more, to avoid a retry loop against a persistently
    // failing origin/config problem.
    const config = error.config as (typeof error)["config"] & { _csrfRetried?: boolean };
    const isCsrfInvalid =
      error.response?.status === 403 &&
      (error.response.data as { error?: { code?: string } } | undefined)?.error?.code ===
        "CSRF_INVALID";

    if (isCsrfInvalid && config && !config._csrfRetried) {
      config._csrfRetried = true;
      clearCsrfToken();
      return api.request(config);
    }

    return Promise.reject(normalizeApiError(error));
  },
);

/**
 * Converts every failed request into an `ApiError`, so callers (services,
 * TanStack Query hooks, components) only ever deal with one error shape
 * regardless of whether the failure was a validation error, an HTTP error
 * response, a timeout, or a network drop.
 *
 * This only normalises the error — it does not show toasts, redirect, or
 * otherwise react to it. That's the job of `handleError`
 * (`src/lib/errors/error-handler.ts`) and its callers.
 */
function normalizeApiError(error: AxiosError): ApiError {
  // No response at all: request timed out, was aborted, or the network
  // dropped before the server could reply.
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return ApiError.network("The request took too long. Please try again.", error);
    }
    return ApiError.network(
      "Unable to reach the server. Check your connection and try again.",
      error,
    );
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
    case 422:
      // Client input / validation errors. Backend sends
      // `{ error: { code, message, details: { errors } } }` (422 for Zod
      // validation failures specifically — see `ApiError.fromResponse`).
      return ApiError.fromResponse(status, data, error);
    case 401:
      // Not authenticated, or session expired/revoked. Session invalidation
      // and redirect-to-login are handled by whoever consumes this error
      // (the session query / route guard) — intentionally not done here,
      // since this interceptor must not swallow the 401 vs 403 vs 404
      // distinction for callers that need it (e.g. auth screens themselves).
      return ApiError.fromResponse(status, data, error);
    case 403:
      // Authenticated but not permitted. Backend never includes the reason
      // or required role/permission — message is already safe to display.
      return ApiError.fromResponse(status, data, error);
    case 404:
      // Genuinely missing OR a concealed-existence resource — the backend
      // deliberately makes these identical. Never treat this differently.
      return ApiError.fromResponse(status, data, error);
    case 409:
      // Idempotency-key or workflow/stateVersion conflict. Never auto-retry.
      return ApiError.fromResponse(status, data, error);
    case 429:
      return ApiError.fromResponse(status, data, error);
    case 500:
    case 502:
    case 503:
    case 504:
      return ApiError.fromResponse(status, data, error);
    default:
      return ApiError.fromResponse(status, data, error);
  }
}
