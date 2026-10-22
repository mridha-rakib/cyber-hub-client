"use client";

import { useQuery } from "@tanstack/react-query";

import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import {
  type BusinessAssessmentListParams,
  type BusinessCursorParams,
  type BusinessFindingListParams,
  businessSecurityService,
} from "@/services/business-security.service";

/**
 * Business security reads live under their own key root, never shared with
 * the Consultant/Admin operational trees. The whole cache is cleared on
 * login and logout (G6D-04), so one account's entries are never served to
 * another. Filters are part of each list key, so changing a filter starts a
 * fresh cursor sequence.
 */
export const businessSecurityKeys = {
  all: ["business-security"] as const,
  dashboard: () => [...businessSecurityKeys.all, "dashboard"] as const,
  assessmentLists: () => [...businessSecurityKeys.all, "assessments", "list"] as const,
  assessmentDetail: (assessmentId: string) =>
    [...businessSecurityKeys.all, "assessments", "detail", assessmentId] as const,
  findingLists: () => [...businessSecurityKeys.all, "findings", "list"] as const,
  scoreLists: () => [...businessSecurityKeys.all, "scores", "list"] as const,
  reportLists: () => [...businessSecurityKeys.all, "reports", "list"] as const,
  reportDetail: (reportId: string) =>
    [...businessSecurityKeys.all, "reports", "detail", reportId] as const,
};

// API-SCR-003
export const useBusinessSecurityDashboard = () =>
  useQuery({
    queryKey: businessSecurityKeys.dashboard(),
    queryFn: businessSecurityService.getDashboard,
  });

// API-ASM-007 / 008
export const useBusinessAssessments = (params: BusinessAssessmentListParams) =>
  useCursorPagination(
    businessSecurityKeys.assessmentLists(),
    params,
    businessSecurityService.listAssessments,
  );

export const useBusinessAssessment = (assessmentId: string) =>
  useQuery({
    queryKey: businessSecurityKeys.assessmentDetail(assessmentId),
    queryFn: () => businessSecurityService.getAssessment(assessmentId),
    enabled: Boolean(assessmentId),
  });

// API-SCR-004
export const useBusinessFindings = (params: BusinessFindingListParams) =>
  useCursorPagination(
    businessSecurityKeys.findingLists(),
    params,
    businessSecurityService.listFindings,
  );

// API-SCR-005
export const useBusinessScores = (params: BusinessCursorParams) =>
  useCursorPagination(
    businessSecurityKeys.scoreLists(),
    params,
    businessSecurityService.listScores,
  );

// API-RPT-010 / 011
export const useBusinessReports = (params: BusinessCursorParams) =>
  useCursorPagination(
    businessSecurityKeys.reportLists(),
    params,
    businessSecurityService.listReports,
  );

export const useBusinessReport = (reportId: string) =>
  useQuery({
    queryKey: businessSecurityKeys.reportDetail(reportId),
    queryFn: () => businessSecurityService.getReport(reportId),
    enabled: Boolean(reportId),
  });
