import axios, { type AxiosError, type AxiosInstance } from "axios";

import { env } from "@/config/env";
import { ApiError } from "@/lib/errors/api-error";

/**
 * Shared Axios instance. Import this in feature-specific service modules
 * (see `src/services/*.service.ts`) rather than calling `axios` directly.
 */
export const api: AxiosInstance = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  // Attach auth token / tenant headers here when available.
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => Promise.reject(normalizeApiError(error)),
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
      // Validation / business-rule errors. The backend is expected to send
      // `{ message, code, errors: { field: [messages] } }`.
      return ApiError.fromResponse(status, data, error);
    case 401:
      // Not authenticated / session expired. Token refresh & redirect-to-login
      // are handled by whatever consumes this error (e.g. an auth store) —
      // intentionally not implemented here yet.
      return ApiError.fromResponse(status, data, error);
    case 403:
      // Authenticated but not permitted.
      return ApiError.fromResponse(status, data, error);
    case 404:
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
