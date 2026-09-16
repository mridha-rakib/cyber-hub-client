/**
 * Frontend-owned auth/session contract types, hand-derived from the backend's
 * actual implementation (verified against `api/src/modules/auth` and
 * `api/src/core/security` — not generated, not imported cross-repo).
 *
 * These describe UX-facing shape only. The backend remains the sole
 * authority on what a session/role is actually permitted to do.
 */

/** The exact 5 authenticated roles the backend issues. No others exist. */
export const ROLES = [
  "ROLE_LEARNER",
  "ROLE_BUSINESS",
  "ROLE_MENTOR",
  "ROLE_CONSULTANT",
  "ROLE_ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** Roles the public registration UI is allowed to offer. Backend enforces this too. */
export const PUBLIC_REGISTRATION_ROLES = ["ROLE_LEARNER", "ROLE_BUSINESS"] as const;

/** The authenticated principal, as returned by `GET /auth/session` / `POST /auth/sessions`. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  verified: boolean;
}

/** Safe employer summary, present only when the session user belongs to one. */
export interface SessionEmployer {
  id: string;
  companyName: string;
  status: string;
}

export interface SessionResponse {
  user: SessionUser;
  /** Omitted entirely (not `null`) when the user has no associated employer. */
  employer?: SessionEmployer;
}
