import { isApiError } from "@/lib/errors/api-error";

export interface ConsultingErrorCopy {
  title: string;
  description: string;
  /** A stale-state 409 — the user should reload before acting again. */
  conflict: boolean;
}

/**
 * Maps a Consulting API failure to safe, actionable copy. Server messages
 * are never shown verbatim for 404/409/5xx: the backend deliberately keeps
 * those generic (non-disclosure), so the client supplies the context.
 */
export function describeConsultingError(
  error: unknown,
  context: { action: string; preserved?: string } = { action: "complete this action" },
): ConsultingErrorCopy {
  const preserved = context.preserved ? ` ${context.preserved}` : "";
  if (!isApiError(error)) {
    return {
      title: "Something went wrong",
      description: `We couldn't ${context.action}. Please try again.${preserved}`,
      conflict: false,
    };
  }
  switch (error.status) {
    case null:
      return {
        title: "Connection problem",
        description: `We couldn't reach the server to ${context.action}. Check your connection and try again.${preserved}`,
        conflict: false,
      };
    case 401:
      return {
        title: "Your session has ended",
        description: "Sign in again to continue. Nothing was changed.",
        conflict: false,
      };
    case 403:
      return {
        title: "Not permitted",
        description: `Your account isn't permitted to ${context.action}.`,
        conflict: false,
      };
    case 404:
      return {
        title: "Request unavailable",
        description:
          "This request is no longer available to you. It may have been reassigned or may not exist.",
        conflict: false,
      };
    case 409:
      return {
        title: "This request has changed",
        description:
          "The request changed since you opened it. Refresh the latest state before continuing.",
        conflict: true,
      };
    case 400:
    case 422:
      return {
        title: "Check the highlighted details",
        description: `Some details weren't accepted. Review them and try again.${preserved}`,
        conflict: false,
      };
    case 429:
      return {
        title: "Too many attempts",
        description: `Please wait a moment, then try again.${preserved}`,
        conflict: false,
      };
    default:
      return {
        title: "Server problem",
        description: `We couldn't ${context.action} because of a server problem. Please try again shortly.${preserved}`,
        conflict: false,
      };
  }
}

export function errorStatus(error: unknown): number | null | undefined {
  return isApiError(error) ? error.status : undefined;
}
