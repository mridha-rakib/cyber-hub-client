"use client";

import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { OperationalAudience } from "@/hooks/use-consulting";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import {
  type AssessmentListParams,
  type FindingListParams,
  securityWorkService,
} from "@/services/security-work.service";
import type {
  Assessment,
  Finding,
  FindingCreateInput,
  FindingUpdateInput,
} from "@/types/security-work";

/**
 * Consultant and Admin data live under separate key roots, mirroring the
 * Consulting cache layout, so one role's cache entry is never served to the
 * other. Assessment and finding trees are separate so a mutation refreshes
 * only the records it can actually have changed.
 */
export const securityWorkKeys = {
  all: ["security-work"] as const,
  audience: (audience: OperationalAudience) => [...securityWorkKeys.all, audience] as const,
  assessments: (audience: OperationalAudience) =>
    [...securityWorkKeys.audience(audience), "assessments"] as const,
  assessmentLists: (audience: OperationalAudience) =>
    [...securityWorkKeys.assessments(audience), "list"] as const,
  assessmentDetail: (audience: OperationalAudience, assessmentId: string) =>
    [...securityWorkKeys.assessments(audience), "detail", assessmentId] as const,
  findings: (audience: OperationalAudience) =>
    [...securityWorkKeys.audience(audience), "findings"] as const,
  findingLists: (audience: OperationalAudience, assessmentId: string) =>
    [...securityWorkKeys.findings(audience), "list", assessmentId] as const,
  findingDetail: (audience: OperationalAudience, findingId: string) =>
    [...securityWorkKeys.findings(audience), "detail", findingId] as const,
};

/** Security-work mutations render their own contextual errors inline. */
const inlineErrors = { inlineErrors: true } as const;

// --- Reads (API-ASM-002/003, API-FND-002/003) --------------------------------

export const useAssessments = (
  audience: OperationalAudience,
  params: AssessmentListParams = {},
  enabled = true,
) =>
  useCursorPagination(
    securityWorkKeys.assessmentLists(audience),
    params,
    securityWorkService.listAssessments,
    { enabled },
  );

export const useAssessment = (audience: OperationalAudience, assessmentId: string | undefined) =>
  useQuery({
    queryKey: securityWorkKeys.assessmentDetail(audience, assessmentId ?? ""),
    queryFn: () => securityWorkService.getAssessment(assessmentId ?? ""),
    enabled: Boolean(assessmentId),
  });

export const useFindings = (
  audience: OperationalAudience,
  assessmentId: string,
  params: FindingListParams = {},
) =>
  useCursorPagination(securityWorkKeys.findingLists(audience, assessmentId), params, (pageParams) =>
    securityWorkService.listFindings(assessmentId, pageParams),
  );

export const useFinding = (audience: OperationalAudience, findingId: string) =>
  useQuery({
    queryKey: securityWorkKeys.findingDetail(audience, findingId),
    queryFn: () => securityWorkService.getFinding(findingId),
    enabled: Boolean(findingId),
  });

// --- Authoritative re-reads after a rejected command ---------------------------

/**
 * Re-reads an assessment and every list that can show it. Used after a 409
 * or 404 answer to reconcile the view — never to replay the command.
 */
export function useRefreshAssessment(audience: OperationalAudience, assessmentId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: securityWorkKeys.assessmentDetail(audience, assessmentId),
      }),
      queryClient.invalidateQueries({ queryKey: securityWorkKeys.assessmentLists(audience) }),
      queryClient.invalidateQueries({
        queryKey: securityWorkKeys.findingLists(audience, assessmentId),
      }),
    ]);
}

/**
 * Re-reads a finding together with its parent assessment: a D-3 conflict
 * can come from either record changing.
 */
export function useRefreshFinding(audience: OperationalAudience) {
  const queryClient = useQueryClient();
  return (finding: Pick<Finding, "id" | "assessmentId">) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: securityWorkKeys.findingDetail(audience, finding.id),
      }),
      queryClient.invalidateQueries({
        queryKey: securityWorkKeys.findingLists(audience, finding.assessmentId),
      }),
      queryClient.invalidateQueries({
        queryKey: securityWorkKeys.assessmentDetail(audience, finding.assessmentId),
      }),
    ]);
}

// --- Cache application after a successful command ----------------------------

/**
 * Seeds the detail cache with the server's authoritative response (so the
 * next command reads the fresh `stateVersion` immediately), then refetches
 * the detail and the lists that can show it.
 */
function applyAssessment(
  queryClient: QueryClient,
  audience: OperationalAudience,
  assessment: Assessment,
) {
  queryClient.setQueryData(securityWorkKeys.assessmentDetail(audience, assessment.id), assessment);
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: securityWorkKeys.assessmentDetail(audience, assessment.id),
    }),
    queryClient.invalidateQueries({ queryKey: securityWorkKeys.assessmentLists(audience) }),
    queryClient.invalidateQueries({
      queryKey: securityWorkKeys.findingLists(audience, assessment.id),
    }),
  ]);
}

function applyFinding(queryClient: QueryClient, audience: OperationalAudience, finding: Finding) {
  queryClient.setQueryData(securityWorkKeys.findingDetail(audience, finding.id), finding);
  return Promise.all([
    queryClient.invalidateQueries({
      queryKey: securityWorkKeys.findingDetail(audience, finding.id),
    }),
    queryClient.invalidateQueries({
      queryKey: securityWorkKeys.findingLists(audience, finding.assessmentId),
    }),
  ]);
}

// --- Assessment commands (API-ASM-001, 004, 005, 006) -------------------------

export function useCreateAssessment(audience: OperationalAudience, requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => securityWorkService.createAssessment(requestId),
    meta: inlineErrors,
    onSuccess: (created) => applyAssessment(queryClient, audience, created),
  });
}

export type AssessmentTransitionInput =
  | { command: "start" | "complete"; expectedStateVersion: number }
  | { command: "cancel"; expectedStateVersion: number; reason: string };

export function useAssessmentTransition(audience: OperationalAudience, assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssessmentTransitionInput) =>
      input.command === "cancel"
        ? securityWorkService.cancelAssessment(
            assessmentId,
            input.expectedStateVersion,
            input.reason,
          )
        : securityWorkService.assessmentCommand(
            assessmentId,
            input.command,
            input.expectedStateVersion,
          ),
    meta: inlineErrors,
    onSuccess: (updated) => applyAssessment(queryClient, audience, updated),
  });
}

// --- Finding commands (API-FND-001, 004..007) ---------------------------------

export function useCreateFinding(audience: OperationalAudience, assessmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FindingCreateInput) =>
      securityWorkService.createFinding(assessmentId, input),
    meta: inlineErrors,
    onSuccess: (created) => applyFinding(queryClient, audience, created),
  });
}

export function useUpdateFinding(audience: OperationalAudience, findingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FindingUpdateInput) => securityWorkService.updateFinding(findingId, input),
    meta: inlineErrors,
    onSuccess: (updated) => applyFinding(queryClient, audience, updated),
  });
}

export type FindingTransitionInput =
  | { command: "start-remediation"; expectedStateVersion: number }
  | { command: "resolve"; expectedStateVersion: number; verificationNote: string }
  | { command: "reopen"; expectedStateVersion: number; reason: string };

export function useFindingTransition(audience: OperationalAudience, findingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FindingTransitionInput) => {
      switch (input.command) {
        case "resolve":
          return securityWorkService.resolveFinding(
            findingId,
            input.expectedStateVersion,
            input.verificationNote,
          );
        case "reopen":
          return securityWorkService.reopenFinding(
            findingId,
            input.expectedStateVersion,
            input.reason,
          );
        default:
          return securityWorkService.findingCommand(
            findingId,
            input.command,
            input.expectedStateVersion,
          );
      }
    },
    meta: inlineErrors,
    onSuccess: (updated) => applyFinding(queryClient, audience, updated),
  });
}
