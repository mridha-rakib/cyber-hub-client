"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { isApiError } from "@/lib/errors/api-error";
import {
  type BusinessConsultingListParams,
  type ConsultingNotesListParams,
  consultingService,
  type OperationalConsultingListParams,
} from "@/services/consulting.service";
import type {
  ConsultingRequestInput,
  ConsultingTransitionAction,
  ScopeAuthorizationInput,
} from "@/types/consulting";

export type OperationalAudience = "consultant" | "admin";

/**
 * Business, Consultant and Admin data live under separate key roots so one
 * role's projection can never be served from another role's cache entry.
 * (Logout additionally clears the whole query cache.)
 */
export const consultingKeys = {
  all: ["consulting"] as const,
  business: () => [...consultingKeys.all, "business"] as const,
  businessLists: () => [...consultingKeys.business(), "list"] as const,
  businessDetail: (id: string) => [...consultingKeys.business(), "detail", id] as const,
  businessScope: (id: string) => [...consultingKeys.business(), "scope", id] as const,
  operational: (audience: OperationalAudience) => [...consultingKeys.all, audience] as const,
  operationalLists: (audience: OperationalAudience) =>
    [...consultingKeys.operational(audience), "list"] as const,
  operationalDetail: (audience: OperationalAudience, id: string) =>
    [...consultingKeys.operational(audience), "detail", id] as const,
  notes: (audience: OperationalAudience, id: string) =>
    [...consultingKeys.operational(audience), "notes", id] as const,
};

/** Consulting mutations render their own contextual errors inline. */
const inlineErrors = { inlineErrors: true } as const;

// --- Business (API-CON-001..005) -------------------------------------------

export const useBusinessConsultingRequests = (
  params: BusinessConsultingListParams = {},
  enabled = true,
) =>
  useCursorPagination(consultingKeys.businessLists(), params, consultingService.listOwn, {
    enabled,
  });

export const useBusinessConsultingRequest = (requestId: string) =>
  useQuery({
    queryKey: consultingKeys.businessDetail(requestId),
    queryFn: () => consultingService.getOwn(requestId),
    enabled: Boolean(requestId),
  });

/** API-CON-005 answers 404 when no current authorisation exists yet — that is `null`, not an error. */
export const useCurrentScopeAuthorization = (requestId: string, enabled = true) =>
  useQuery({
    queryKey: consultingKeys.businessScope(requestId),
    queryFn: async () => {
      try {
        return await consultingService.getCurrentScope(requestId);
      } catch (error) {
        if (isApiError(error) && error.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(requestId) && enabled,
  });

export function useCreateConsultingRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ConsultingRequestInput) => consultingService.create(input),
    meta: inlineErrors,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: consultingKeys.businessLists() }),
  });
}

export function useCreateScopeAuthorization(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ScopeAuthorizationInput) => consultingService.createScope(requestId, input),
    meta: inlineErrors,
    onSuccess: async (created) => {
      queryClient.setQueryData(consultingKeys.businessScope(requestId), created);
      await queryClient.invalidateQueries({ queryKey: consultingKeys.business() });
    },
  });
}

// --- Consultant / Admin (API-CON-006..015) ----------------------------------

export const useOperationalRequests = (
  audience: OperationalAudience,
  params: OperationalConsultingListParams = {},
  enabled = true,
) =>
  useCursorPagination(
    consultingKeys.operationalLists(audience),
    params,
    consultingService.listOperational,
    { enabled },
  );

export const useOperationalRequest = (audience: OperationalAudience, requestId: string) =>
  useQuery({
    queryKey: consultingKeys.operationalDetail(audience, requestId),
    queryFn: () => consultingService.getOperational(requestId),
    enabled: Boolean(requestId),
  });

/** Refreshes the request detail plus every list/dashboard preview that may show it. */
function useRefreshOperational(audience: OperationalAudience, requestId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: consultingKeys.operationalDetail(audience, requestId),
      }),
      queryClient.invalidateQueries({ queryKey: consultingKeys.operationalLists(audience) }),
    ]);
}

export function useConsultingTransition(audience: OperationalAudience, requestId: string) {
  const refresh = useRefreshOperational(audience, requestId);
  return useMutation({
    mutationFn: (input: { action: ConsultingTransitionAction; expectedStateVersion: number }) =>
      consultingService.transition(requestId, input.action, input.expectedStateVersion),
    meta: inlineErrors,
    onSuccess: refresh,
  });
}

export function useDeclineConsultingRequest(audience: OperationalAudience, requestId: string) {
  const refresh = useRefreshOperational(audience, requestId);
  return useMutation({
    mutationFn: (input: { expectedStateVersion: number; reason: string }) =>
      consultingService.decline(requestId, input.expectedStateVersion, input.reason),
    meta: inlineErrors,
    onSuccess: refresh,
  });
}

export function useAssignConsultant(requestId: string) {
  const refresh = useRefreshOperational("admin", requestId);
  return useMutation({
    mutationFn: (consultantUserId: string) => consultingService.assign(requestId, consultantUserId),
    meta: inlineErrors,
    onSuccess: refresh,
  });
}

export const useConsultingNotes = (
  audience: OperationalAudience,
  requestId: string,
  params: ConsultingNotesListParams = {},
) =>
  useCursorPagination(consultingKeys.notes(audience, requestId), params, (pageParams) =>
    consultingService.listNotes(requestId, pageParams),
  );

export function useCreateConsultingNote(audience: OperationalAudience, requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => consultingService.createNote(requestId, body),
    meta: inlineErrors,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: consultingKeys.notes(audience, requestId) }),
  });
}
