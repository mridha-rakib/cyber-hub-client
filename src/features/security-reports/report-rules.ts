import type { OperationalAudience } from "@/hooks/use-consulting";
import type { ReportStatus } from "@/types/security-report";
import type { AssessmentStatus } from "@/types/security-work";

/**
 * Which report actions to offer (API Contract v1.5, Workflow v1.2 §7). This
 * is UX only — the API re-checks role, dual ASG, state, stateVersion and the
 * D6-5 guards on every request.
 *
 * - API-RPT-003/004 draft edits: Consultant or Admin, DRAFT only.
 * - API-RPT-005 submit-review and API-RPT-007 mark-ready: Consultant only.
 * - API-RPT-006: IN_REVIEW -> DRAFT (Consultant or Admin);
 *   READY_FOR_RELEASE -> DRAFT (Admin only).
 * - API-RPT-008 release: Admin only, always disabled while GAP-013 is open.
 * - API-RPT-009 supersede: Admin only, RELEASED only.
 */
export interface ReportActions {
  editDraft: boolean;
  submitReview: boolean;
  returnToDraft: boolean;
  markReady: boolean;
  release: boolean;
  supersede: boolean;
}

export function reportActionsFor(
  status: ReportStatus,
  audience: OperationalAudience,
): ReportActions {
  const consultant = audience === "consultant";
  const admin = audience === "admin";
  return {
    editDraft: status === "DRAFT",
    submitReview: consultant && status === "DRAFT",
    returnToDraft: status === "IN_REVIEW" || (admin && status === "READY_FOR_RELEASE"),
    markReady: consultant && status === "IN_REVIEW",
    release: admin && status === "READY_FOR_RELEASE",
    supersede: admin && status === "RELEASED",
  };
}

/** D6-5: reports are created only under an IN_PROGRESS or COMPLETED assessment. */
export function reportCreateLockReason(parent: AssessmentStatus): string | null {
  switch (parent) {
    case "PLANNED":
      return "A report can be created once the assessment is in progress.";
    case "CANCELLED":
      return "The assessment was cancelled, so no new report can be created.";
    default:
      return null;
  }
}

/** D6-5 parent guards for submit-review and mark-ready (null = allowed or unknown). */
export function submitParentLockReason(parent: AssessmentStatus | undefined): string | null {
  if (parent === "PLANNED" || parent === "CANCELLED") {
    return "The assessment must be in progress or completed before this report can be submitted for review.";
  }
  return null;
}

export function markReadyParentLockReason(parent: AssessmentStatus | undefined): string | null {
  if (parent && parent !== "COMPLETED") {
    return "The assessment must be completed before this report can be marked ready for release.";
  }
  return null;
}

export const REPORT_STATUS_MEANING: Record<ReportStatus, string> = {
  DRAFT:
    "Draft. Write the report content and choose the included findings, then submit it for review.",
  IN_REVIEW:
    "In review. Content and findings are locked. Mark it ready after human review, or return it to draft for changes.",
  READY_FOR_RELEASE:
    "Ready for release. Reviewed and awaiting Admin release. Only an Admin can return it to draft.",
  RELEASED:
    "Released. Visible to the client organisation. It can only be replaced by a newer released version.",
  SUPERSEDED: "Superseded. A newer released version replaced this report. It is kept as history.",
};

export function reportHref(audience: OperationalAudience, reportId: string): string {
  return audience === "admin" ? `/admin/reports/${reportId}` : `/consultant/reports/${reportId}`;
}

export function scoreWorkspaceHref(audience: OperationalAudience, assessmentId: string): string {
  return audience === "admin"
    ? `/admin/assessments/${assessmentId}/score`
    : `/consultant/assessments/${assessmentId}/score`;
}
