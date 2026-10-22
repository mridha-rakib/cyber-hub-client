/**
 * Operational security report (Wave 6) types for Consultant/Admin screens.
 * They mirror the committed API projections in
 * `api/src/modules/security-report/services/security-report.views.ts`
 * (`reportView` for API-RPT-002 and mutations, `reportSummaryView` for
 * API-RPT-013) and are never used on Business routes.
 */

import type { Finding } from "@/types/security-work";

export const REPORT_STATUSES = [
  "DRAFT",
  "IN_REVIEW",
  "READY_FOR_RELEASE",
  "RELEASED",
  "SUPERSEDED",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** API-RPT-013 — SecurityReportOperationalSummaryView (never draftContent). */
export interface ReportSummary {
  id: string;
  assessmentId: string;
  status: ReportStatus;
  versionNo: number;
  stateVersion: number;
  supersedesReportId: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReportIncludedFinding {
  findingId: string;
  sortOrder: number;
  includedAt: string;
  finding: Finding;
}

/** API-RPT-002 internal operational projection. */
export interface OperationalReport {
  id: string;
  assessmentId: string;
  employerId: string;
  /** Any JSON object (backend contract); the editor authors D6D-1 fields only. */
  draftContent: unknown;
  reportPath: string | null;
  status: ReportStatus;
  stateVersion: number;
  versionNo: number;
  supersedesReportId: string | null;
  preparedByUserId: string;
  reviewedByUserId: string | null;
  releasedByUserId: string | null;
  generatedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
  includedFindings: ReportIncludedFinding[];
}

export type ReportCommand = "submit-review" | "mark-ready";
