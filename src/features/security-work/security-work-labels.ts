import type { OperationalAudience } from "@/hooks/use-consulting";
import type { AssessmentStatus, FindingSeverity, FindingStatus } from "@/types/security-work";

export const ASSESSMENT_STATUS_LABELS: Record<AssessmentStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** What each WF-ASM state means to Consultant/Admin operators. */
export const ASSESSMENT_STATUS_MEANING: Record<AssessmentStatus, string> = {
  PLANNED:
    "Planned. No testing yet — start the assessment when you are ready to work within the authorised scope.",
  IN_PROGRESS:
    "In progress. Record findings as you work, and complete the assessment once activity has finished.",
  COMPLETED: "Completed. Findings can still progress through remediation, resolution or reopening.",
  CANCELLED: "Cancelled. This is a terminal state and every linked finding is frozen.",
};

export const FINDING_STATUS_LABELS: Record<FindingStatus, string> = {
  OPEN: "Open",
  REMEDIATION_IN_PROGRESS: "Remediation in progress",
  RESOLVED: "Resolved",
};

export const FINDING_SEVERITY_LABELS: Record<FindingSeverity, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

export function assessmentsHref(audience: OperationalAudience): string {
  return audience === "admin" ? "/admin/assessments" : "/consultant/assessments";
}

export function assessmentHref(audience: OperationalAudience, assessmentId: string): string {
  return `${assessmentsHref(audience)}/${assessmentId}`;
}

export function findingHref(audience: OperationalAudience, findingId: string): string {
  return audience === "admin"
    ? `/admin/findings/${findingId}`
    : `/consultant/findings/${findingId}`;
}

export function requestWorkspaceHref(audience: OperationalAudience, requestId: string): string {
  return audience === "admin"
    ? `/admin/consulting/${requestId}`
    : `/consultant/requests/${requestId}`;
}
