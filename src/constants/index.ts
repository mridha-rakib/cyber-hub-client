/** App-wide constant values. Keep magic strings/numbers here. */

export const APP_NAME = "Cyber Hub";

export const QUERY_STALE_TIME = 60 * 1000; // 1 minute
export const QUERY_GC_TIME = 5 * 60 * 1000; // 5 minutes

export const ROUTES = {
  home: "/",
} as const;

export const STORAGE_KEYS = {
  theme: "ch:theme",
  authToken: "ch:auth-token",
} as const;
