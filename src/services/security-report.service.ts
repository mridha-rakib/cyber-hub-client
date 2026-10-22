import { api } from "@/services/api";
import type { CursorPage } from "@/types/api";
import type { SecurityScoreView } from "@/types/business-security";
import type { OperationalReport, ReportStatus, ReportSummary } from "@/types/security-report";

interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

export interface ReportListParams {
  status?: ReportStatus;
  cursor?: string;
  limit?: number;
}

export interface ScoreListParams {
  cursor?: string;
  limit?: number;
}

async function unwrap<T>(promise: Promise<{ data: Envelope<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

async function unwrapPage<T>(
  promise: Promise<{ data: Envelope<T[]> & { meta: CursorPage<T>["meta"] } }>,
): Promise<CursorPage<T>> {
  const response = await promise;
  return { data: response.data.data, meta: response.data.meta };
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Consultant/Admin operational report and score operations (API Contract
 * v1.5). Server-derived fields are never sent. Report release (API-RPT-008)
 * is deliberately absent: it needs a stored artifact that cannot exist while
 * GAP-013 is open, so the release control is disabled (D6D-3) and has no
 * request path at all.
 */
export const securityReportService = {
  // API-RPT-013
  listAssessmentReports: (assessmentId: string, params: ReportListParams = {}) =>
    unwrapPage<ReportSummary>(api.get(`/assessments/${assessmentId}/reports${toQuery(params)}`)),
  // API-RPT-001 — a new report starts with empty content (D6D-1).
  createReport: (assessmentId: string) =>
    unwrap<OperationalReport>(
      api.post(`/assessments/${assessmentId}/reports`, { draftContent: {} }),
    ),
  // API-RPT-002
  getReport: (reportId: string) => unwrap<OperationalReport>(api.get(`/reports/${reportId}`)),
  // API-RPT-003 — the complete object, unknown keys preserved.
  updateDraft: (
    reportId: string,
    draftContent: Record<string, unknown>,
    expectedStateVersion: number,
  ) =>
    unwrap<OperationalReport>(
      api.patch(`/reports/${reportId}`, { draftContent, expectedStateVersion }),
    ),
  // API-RPT-004
  replaceFindings: (reportId: string, findingIds: string[], expectedStateVersion: number) =>
    unwrap<OperationalReport>(
      api.put(`/reports/${reportId}/findings`, { findingIds, expectedStateVersion }),
    ),
  // API-RPT-005 / API-RPT-007
  command: (
    reportId: string,
    command: "submit-review" | "mark-ready",
    expectedStateVersion: number,
  ) =>
    unwrap<OperationalReport>(
      api.post(`/reports/${reportId}/${command}`, { expectedStateVersion }),
    ),
  // API-RPT-006
  returnToDraft: (reportId: string, expectedStateVersion: number, reason: string) =>
    unwrap<OperationalReport>(
      api.post(`/reports/${reportId}/return-to-draft`, { expectedStateVersion, reason }),
    ),
  // API-RPT-009 (Admin)
  supersede: (reportId: string, expectedStateVersion: number, replacementReportId: string) =>
    unwrap<OperationalReport>(
      api.post(`/admin/reports/${reportId}/supersede`, {
        expectedStateVersion,
        replacementReportId,
      }),
    ),
};

export const securityScoreService = {
  // API-SCR-002 — existing snapshots; scores are JSON numbers (D6C-3).
  listAssessmentScores: (assessmentId: string, params: ScoreListParams = {}) =>
    unwrapPage<SecurityScoreView>(
      api.get(`/assessments/${assessmentId}/security-scores${toQuery(params)}`),
    ),
  // API-SCR-001 — returns 409 SCORE_METHODOLOGY_NOT_CONFIGURED while GAP-009 is open.
  calculate: (assessmentId: string, methodologyVersion: string) =>
    unwrap<SecurityScoreView>(
      api.post(`/assessments/${assessmentId}/security-scores/calculate`, { methodologyVersion }),
    ),
};
