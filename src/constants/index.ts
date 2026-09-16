/** App-wide constant values. Keep magic strings/numbers here. */

export const APP_NAME = "Cyber Hub";

export const QUERY_STALE_TIME = 60 * 1000; // 1 minute
export const QUERY_GC_TIME = 5 * 60 * 1000; // 5 minutes

export const ROUTES = {
  home: "/",
  login: "/login",
  registerChoice: "/register",
  registerLearner: "/register/learner",
  registerBusiness: "/register/business",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  dashboard: "/dashboard",
} as const;

/**
 * The session lives in an HttpOnly cookie the backend owns — the frontend
 * never stores it. `theme` is the only client-only preference kept in
 * browser storage.
 */
export const STORAGE_KEYS = {
  theme: "ch:theme",
} as const;
