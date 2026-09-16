import { api } from "@/services/api";

/**
 * CSRF double-submit token, held in memory only (module-level variable) —
 * never `localStorage`/`sessionStorage`. It is not a secret on its own (the
 * backend's CSRF cookie is intentionally non-HttpOnly and readable by JS
 * too), but keeping it in memory means it's naturally cleared on full page
 * reload, matching the token's short, per-session lifecycle.
 *
 * Lifecycle: `GET /auth/csrf-token` sets a CSRF cookie AND returns the same
 * value in the response body. The frontend only needs to remember the body
 * value to echo it back via the `x-csrf-token` header — the browser handles
 * sending the cookie itself because requests use `withCredentials`.
 */
let cachedToken: string | null = null;
let inFlight: Promise<string> | null = null;

export function getCsrfToken(): string | null {
  return cachedToken;
}

export function clearCsrfToken(): void {
  cachedToken = null;
}

/**
 * Returns a CSRF token, fetching one from the backend if none is cached yet.
 * Concurrent callers share a single in-flight request instead of firing one
 * `GET /auth/csrf-token` each.
 */
export async function ensureCsrfToken(): Promise<string> {
  if (cachedToken) {
    return cachedToken;
  }
  if (!inFlight) {
    inFlight = fetchCsrfToken().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

/** Forces a fresh token fetch, discarding any cached value first. */
export async function refreshCsrfToken(): Promise<string> {
  clearCsrfToken();
  return ensureCsrfToken();
}

async function fetchCsrfToken(): Promise<string> {
  const response = await api.get<{
    success: boolean;
    data: { csrfToken: string };
  }>("/auth/csrf-token");
  cachedToken = response.data.data.csrfToken;
  return cachedToken;
}
