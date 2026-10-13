/**
 * Security work (Wave 5) types. Every interface mirrors a real Wave 5B
 * operational response projection in
 * `api/src/modules/security-work/services/security-work.service.ts`
 * (`assessmentView` / `findingView`). These are the Consultant/Admin
 * operational projections only — the Business client projections are a
 * Wave 6 concern and are deliberately not modelled here.
 */

import type { ConsultingService } from "@/types/consulting";

export const ASSESSMENT_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

export const FINDING_STATUSES = ["OPEN", "REMEDIATION_IN_PROGRESS", "RESOLVED"] as const;
export type FindingStatus = (typeof FINDING_STATUSES)[number];

export const FINDING_SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

/** API-ASM-001..006 — operational assessment projection. */
export interface Assessment {
  id: string;
  employerId: string;
  consultingRequestId: string;
  scopeAuthorizationId: string;
  service: ConsultingService;
  /** Server-written copy of the authorised scope at creation; JSON, read-only. */
  scopeSnapshot: unknown;
  assignedConsultantId: string;
  status: AssessmentStatus;
  stateVersion: number;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** API-FND-001..007 — operational finding projection. */
export interface Finding {
  id: string;
  assessmentId: string;
  employerId: string;
  title: string;
  severity: FindingSeverity;
  description: string | null;
  evidenceSummary: string | null;
  recommendation: string;
  status: FindingStatus;
  stateVersion: number;
  /** Set by the server only while RESOLVED; cleared to null on reopen (D-2). */
  resolvedAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

/** API-FND-001 `FindingCreateInput` (strict). Owner/status/assessment are server-derived. */
export interface FindingCreateInput {
  title: string;
  severity: FindingSeverity;
  description?: string;
  evidenceSummary?: string;
  recommendation: string;
}

/** API-FND-004 `FindingUpdateInput` (strict). Never status, owner or resolvedAt. */
export interface FindingUpdateInput {
  title?: string;
  severity?: FindingSeverity;
  description?: string;
  evidenceSummary?: string;
  recommendation?: string;
  expectedStateVersion: number;
}

export type AssessmentCommand = "start" | "complete";
export type FindingCommand = "start-remediation";
