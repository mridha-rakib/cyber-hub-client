"use client";

import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { OperationalAudience } from "@/hooks/use-consulting";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { securityWorkKeys } from "@/hooks/use-security-work";
import {
  type ReportListParams,
  type ScoreListParams,
  securityReportService,
  securityScoreService,
} from "@/services/security-report.service";
import type { OperationalReport } from "@/types/security-report";

/**
 * Operational report and score keys sit under the existing per-audience
 * security-work root, so Consultant and Admin caches never mix and Business
 * keys (`business-security`) are a separate tree.
 */
export const securityReportKeys = {
  reports: (audience: OperationalAudience) =>
    [...securityWorkKeys.audience(audience), "reports"] as const,
  reportLists: (audience: OperationalAudience, assessmentId: string) =>
    [...securityReportKeys.reports(audience), "list", assessmentId] as const,
  reportDetail: (audience: OperationalAudience, reportId: string) =>
    [...securityReportKeys.reports(audience), "detail", reportId] as const,
  scoreLists: (audience: OperationalAudience, assessmentId: string) =>
    [...securityWorkKeys.audience(audience), "scores", "list", assessmentId] as const,
};

/** Report and score mutations render their own contextual errors inline. */
const inlineErrors = { inlineErrors: true } as const;

// --- Reads -------------------------------------------------------------------

// API-RPT-013
export const useAssessmentReports = (
  audience: OperationalAudience,
  assessmentId: string,
  params: ReportListParams = {},
) =>
  useCursorPagination(securityReportKeys.reportLists(audience, assessmentId), params, (page) =>
    securityReportService.listAssessmentReports(assessmentId, page),
  );

// API-RPT-002
export const useOperationalReport = (audience: OperationalAudience, reportId: string) =>
  useQuery({
    queryKey: securityReportKeys.reportDetail(audience, reportId),
    queryFn: () => securityReportService.getReport(reportId),
    enabled: Boolean(reportId),
  });

// API-SCR-002
export const useAssessmentScores = (
  audience: OperationalAudience,
  assessmentId: string,
  params: ScoreListParams = {},
) =>
  useCursorPagination(securityReportKeys.scoreLists(audience, assessmentId), params, (page) =>
    securityScoreService.listAssessmentScores(assessmentId, page),
  );

// --- Authoritative re-reads ----------------------------------------------------

function invalidateReport(
  queryClient: QueryClient,
  audience: OperationalAudience,
  report: Pick<OperationalReport, "id" | "assessmentId">,
) {
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: securityReportKeys.reportDetail(audience, report.id),
    }),
    queryClient.invalidateQueries({
      queryKey: securityReportKeys.reportLists(audience, report.assessmentId),
    }),
  ]);
}

/** Re-reads a report after a rejected command — never replays the command. */
export function useRefreshReport(audience: OperationalAudience, reportId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.refetchQueries({ queryKey: securityReportKeys.reportDetail(audience, reportId) });
}

function useReportMutation<TInput>(
  audience: OperationalAudience,
  mutationFn: (input: TInput) => Promise<OperationalReport>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: inlineErrors,
    onSuccess: async (report) => {
      queryClient.setQueryData(securityReportKeys.reportDetail(audience, report.id), report);
      await invalidateReport(queryClient, audience, report);
    },
  });
}

// --- Mutations (API-RPT-001, 003..007, 009) -----------------------------------

export function useCreateReport(audience: OperationalAudience, assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => securityReportService.createReport(assessmentId),
    meta: inlineErrors,
    onSuccess: async (report) => {
      queryClient.setQueryData(securityReportKeys.reportDetail(audience, report.id), report);
      await queryClient.invalidateQueries({
        queryKey: securityReportKeys.reportLists(audience, assessmentId),
      });
    },
  });
}

export const useSaveReportDraft = (audience: OperationalAudience, reportId: string) =>
  useReportMutation(
    audience,
    (input: { draftContent: Record<string, unknown>; expectedStateVersion: number }) =>
      securityReportService.updateDraft(reportId, input.draftContent, input.expectedStateVersion),
  );

export const useReplaceReportFindings = (audience: OperationalAudience, reportId: string) =>
  useReportMutation(audience, (input: { findingIds: string[]; expectedStateVersion: number }) =>
    securityReportService.replaceFindings(reportId, input.findingIds, input.expectedStateVersion),
  );

export type ReportTransitionInput =
  | { command: "submit-review" | "mark-ready"; expectedStateVersion: number }
  | { command: "return-to-draft"; expectedStateVersion: number; reason: string }
  | { command: "supersede"; expectedStateVersion: number; replacementReportId: string };

export const useReportTransition = (audience: OperationalAudience, reportId: string) =>
  useReportMutation(audience, (input: ReportTransitionInput) => {
    switch (input.command) {
      case "return-to-draft":
        return securityReportService.returnToDraft(
          reportId,
          input.expectedStateVersion,
          input.reason,
        );
      case "supersede":
        return securityReportService.supersede(
          reportId,
          input.expectedStateVersion,
          input.replacementReportId,
        );
      default:
        return securityReportService.command(reportId, input.command, input.expectedStateVersion);
    }
  });

// API-SCR-001 — expected to answer 409 while GAP-009 is open; never retried.
export function useCalculateScore(audience: OperationalAudience, assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (methodologyVersion: string) =>
      securityScoreService.calculate(assessmentId, methodologyVersion),
    meta: inlineErrors,
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: securityReportKeys.scoreLists(audience, assessmentId),
      }),
  });
}
