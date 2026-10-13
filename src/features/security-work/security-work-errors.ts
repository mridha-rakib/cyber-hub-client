import { type ApiErrorResponse, isApiError } from "@/lib/errors/api-error";

export type SecurityWorkFailureKind =
  | "version"
  | "state"
  | "scope"
  | "unavailable"
  | "forbidden"
  | "validation"
  | "session"
  | "rate-limited"
  | "network"
  | "server";

export interface SecurityWorkFailure {
  kind: SecurityWorkFailureKind;
  title: string;
  description: string;
  /** The record should be re-read before the user acts again (409 answers). */
  refresh: boolean;
  /** STATE_VERSION_CONFLICT `details.currentStateVersion`, when the server sent a valid one. */
  currentStateVersion: number | null;
}

/**
 * Reads `details.currentStateVersion` from a STATE_VERSION_CONFLICT answer.
 * Anything other than a positive integer is ignored rather than trusted.
 */
export function currentStateVersionOf(error: unknown): number | null {
  if (!isApiError(error) || error.code !== "STATE_VERSION_CONFLICT") return null;
  const value = (error.data as ApiErrorResponse | null)?.error?.details?.currentStateVersion;
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : null;
}

/**
 * Maps a security-work API failure to safe, actionable copy (API Contract
 * v1.2 §4.2 / D-6). STATE_CONFLICT and STATE_VERSION_CONFLICT stay distinct;
 * SECURITY_SCOPE_NOT_AUTHORIZED never reveals scope internals; a 404 stays
 * generic so a concealed record reads the same as a missing one. Server
 * messages are not shown verbatim.
 */
export function describeSecurityWorkError(
  error: unknown,
  context: { subject: "assessment" | "finding" | "request"; action: string; preserved?: string },
): SecurityWorkFailure {
  const preserved = context.preserved ? ` ${context.preserved}` : "";
  const base = { refresh: false, currentStateVersion: null };

  if (!isApiError(error)) {
    return {
      ...base,
      kind: "server",
      title: "Something went wrong",
      description: `We couldn't ${context.action}. Please try again.${preserved}`,
    };
  }

  if (error.status === 409) {
    if (error.code === "STATE_VERSION_CONFLICT") {
      return {
        kind: "version",
        title: `This ${context.subject} changed since you loaded it`,
        description: `Someone else updated it, so nothing was changed. The latest version is being loaded — review it before trying again.${preserved}`,
        refresh: true,
        currentStateVersion: currentStateVersionOf(error),
      };
    }
    return {
      ...base,
      kind: "state",
      title: "This action is no longer available",
      description: `The ${context.subject}'s current state doesn't allow this action, so nothing was changed. The latest state is being loaded.${preserved}`,
      refresh: true,
    };
  }

  switch (error.status) {
    case null:
      return {
        ...base,
        kind: "network",
        title: "Connection problem",
        description: `We couldn't reach the server to ${context.action}. Check your connection and try again.${preserved}`,
      };
    case 401:
      return {
        ...base,
        kind: "session",
        title: "Your session has ended",
        description: "Sign in again to continue. Nothing was changed.",
      };
    case 403:
      return error.code === "SECURITY_SCOPE_NOT_AUTHORIZED"
        ? {
            ...base,
            kind: "scope",
            title: "Authorised scope required",
            description: `The current authorised scope no longer permits this action, so nothing was changed.${preserved}`,
          }
        : {
            ...base,
            kind: "forbidden",
            title: "Not permitted",
            description: `Your account isn't permitted to ${context.action}.`,
          };
    // Deliberately generic: a concealed denial must read exactly like a
    // missing record, so the client never guesses at the reason.
    case 404:
      return {
        ...base,
        kind: "unavailable",
        title: "Unavailable",
        description: `The ${context.subject} or this action isn't available to you right now. Nothing was changed.`,
        refresh: true,
      };
    case 400:
    case 422:
      return {
        ...base,
        kind: "validation",
        title: "Check the details",
        description: `Some details weren't accepted. Review them and try again.${preserved}`,
      };
    case 429:
      return {
        ...base,
        kind: "rate-limited",
        title: "Too many attempts",
        description: `Please wait a moment, then try again.${preserved}`,
      };
    default:
      return {
        ...base,
        kind: "server",
        title: "Server problem",
        description: `We couldn't ${context.action} because of a server problem. Please try again shortly.${preserved}`,
      };
  }
}
