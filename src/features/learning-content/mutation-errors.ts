import { isApiError } from "@/lib/errors/api-error";

/** Exact UI-DEC-030 wording. */
export const VERSION_CONFLICT_SAVE_MESSAGE =
  "This record was changed by someone else. Review the latest version, then save again.";
export const VERSION_CONFLICT_DELETE_MESSAGE =
  "This record was changed by someone else. Review it before deleting.";
export const STATE_CONFLICT_MESSAGE =
  "That action isn't available in the record's current state. The latest state is shown below.";

export type MutationErrorKind =
  | "version-conflict"
  | "state-conflict"
  | "not-found"
  | "validation"
  | "forbidden"
  | "session"
  | "other";

export interface MutationErrorInfo {
  kind: MutationErrorKind;
  message: string;
  fieldErrors: Record<string, string | undefined>;
}

/**
 * Classifies a failed Admin save, lifecycle command or delete so the screen
 * can follow UI-DEC-030. Classification only: nothing here refetches or
 * retries; callers decide what to refresh, and never resubmit automatically.
 */
export function classifyMutationError(error: unknown): MutationErrorInfo {
  if (!isApiError(error)) {
    return {
      kind: "other",
      message: "Something went wrong. Nothing was changed; please try again.",
      fieldErrors: {},
    };
  }
  const fieldErrors = Object.fromEntries(
    Object.entries(error.errors).map(([field, messages]) => [field, messages[0]]),
  );
  if (error.status === 409 && error.code === "STATE_VERSION_CONFLICT") {
    return { kind: "version-conflict", message: VERSION_CONFLICT_SAVE_MESSAGE, fieldErrors };
  }
  if (error.status === 409) {
    return { kind: "state-conflict", message: STATE_CONFLICT_MESSAGE, fieldErrors };
  }
  if (error.status === 404) {
    return { kind: "not-found", message: "This record no longer exists.", fieldErrors };
  }
  if (error.status === 400 || error.status === 422) {
    return {
      kind: "validation",
      message: error.message || "Some details need attention. Nothing was changed.",
      fieldErrors,
    };
  }
  if (error.status === 403) {
    return { kind: "forbidden", message: error.message, fieldErrors };
  }
  if (error.status === 401) {
    return {
      kind: "session",
      message: "Your session has ended. Sign in again to continue.",
      fieldErrors,
    };
  }
  return {
    kind: "other",
    message: "The change could not be completed. Nothing was changed; please try again.",
    fieldErrors,
  };
}
