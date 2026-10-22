import type { z } from "zod";

import {
  assessmentClientViewSchema,
  cursorMetaSchema,
  findingClientViewSchema,
  securityDashboardViewSchema,
  securityReportClientDetailSchema,
  securityReportClientViewSchema,
  securityScoreViewSchema,
} from "@/schemas/business-security.schema";
import { api } from "@/services/api";
import type { CursorPage } from "@/types/api";
import type {
  AssessmentClientView,
  FindingClientView,
  SecurityDashboardView,
  SecurityReportClientDetail,
  SecurityReportClientView,
  SecurityScoreView,
} from "@/types/business-security";
import type { AssessmentStatus, FindingSeverity, FindingStatus } from "@/types/security-work";

interface Envelope {
  data: unknown;
  meta?: unknown;
}

/** The employer is always the session's; no list accepts an employer filter. */
export interface BusinessAssessmentListParams {
  status?: AssessmentStatus;
  cursor?: string;
  limit?: number;
}

export interface BusinessFindingListParams {
  severity?: FindingSeverity;
  status?: FindingStatus;
  cursor?: string;
  limit?: number;
}

export interface BusinessCursorParams {
  cursor?: string;
  limit?: number;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function parseOne<T>(promise: Promise<{ data: Envelope }>, schema: z.ZodType<T>): Promise<T> {
  const response = await promise;
  return schema.parse(response.data.data);
}

/**
 * Parses a cursor page item by item. Only approved keys survive parsing, so
 * no unexpected property can reach a Business component.
 */
async function parsePage<T>(
  promise: Promise<{ data: Envelope }>,
  schema: z.ZodType<T>,
): Promise<CursorPage<T>> {
  const response = await promise;
  const items = Array.isArray(response.data.data) ? response.data.data : [];
  return {
    data: items.map((item) => schema.parse(item)),
    meta: cursorMetaSchema.parse(response.data.meta),
  };
}

/**
 * Business security reads (API Contract v1.5). Report download
 * (API-RPT-012) is intentionally absent: while GAP-013 is open
 * `downloadAvailable` is false and the UI never requests the file.
 */
export const businessSecurityService = {
  // API-SCR-003
  getDashboard: (): Promise<SecurityDashboardView> =>
    parseOne(api.get("/business/security/dashboard"), securityDashboardViewSchema),
  // API-ASM-007
  listAssessments: (
    params: BusinessAssessmentListParams = {},
  ): Promise<CursorPage<AssessmentClientView>> =>
    parsePage(
      api.get(`/business/security/assessments${toQuery(params)}`),
      assessmentClientViewSchema,
    ),
  // API-ASM-008
  getAssessment: (assessmentId: string): Promise<AssessmentClientView> =>
    parseOne(api.get(`/business/security/assessments/${assessmentId}`), assessmentClientViewSchema),
  // API-SCR-004
  listFindings: (params: BusinessFindingListParams = {}): Promise<CursorPage<FindingClientView>> =>
    parsePage(api.get(`/business/security/findings${toQuery(params)}`), findingClientViewSchema),
  // API-SCR-005
  listScores: (params: BusinessCursorParams = {}): Promise<CursorPage<SecurityScoreView>> =>
    parsePage(api.get(`/business/security/scores${toQuery(params)}`), securityScoreViewSchema),
  // API-RPT-010
  listReports: (params: BusinessCursorParams = {}): Promise<CursorPage<SecurityReportClientView>> =>
    parsePage(
      api.get(`/business/security/reports${toQuery(params)}`),
      securityReportClientViewSchema,
    ),
  // API-RPT-011
  getReport: (reportId: string): Promise<SecurityReportClientDetail> =>
    parseOne(api.get(`/business/security/reports/${reportId}`), securityReportClientDetailSchema),
};
