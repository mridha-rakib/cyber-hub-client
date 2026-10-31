import { isApiError } from "@/lib/errors/api-error";

/**
 * Inline message for a failed self-service save. Server-provided safe
 * messages are shown for expected rejections; anything else stays generic.
 * Nothing here retries or resubmits.
 */
export function accountMutationMessage(error: unknown): string {
  if (!isApiError(error)) return "Something went wrong. Nothing was changed; please try again.";
  if (error.status === 401) return "Your session has ended. Sign in again to continue.";
  if (error.status === 403) return "You don't have permission to make this change.";
  if (error.status === 422) return "Some details aren't valid. Check the highlighted fields.";
  return "The change could not be saved. Nothing was changed; please try again.";
}
