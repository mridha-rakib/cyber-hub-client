"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { findInCursorPages, useCursorPagination } from "@/hooks/use-cursor-pagination";
import {
  type AdminOpportunityListParams,
  employerOpportunityService,
  type OwnOpportunityListParams,
  type PublicOpportunityListParams,
} from "@/services/employer-opportunity.service";
import type {
  EmployerOpportunityInput,
  EmployerOpportunityUpdateInput,
} from "@/types/employer-opportunity";

/** Same public/own/admin cache-separation rationale as `careerListingKeys`. */
export const employerOpportunityKeys = {
  all: ["employer-opportunities"] as const,
  publishedLists: () => [...employerOpportunityKeys.all, "published", "list"] as const,
  publishedList: (params: PublicOpportunityListParams) =>
    [...employerOpportunityKeys.publishedLists(), params] as const,
  published: (id: string) => [...employerOpportunityKeys.all, "published", "detail", id] as const,
  ownLists: () => [...employerOpportunityKeys.all, "own", "list"] as const,
  ownList: (params: OwnOpportunityListParams) =>
    [...employerOpportunityKeys.ownLists(), params] as const,
  own: (id: string) => [...employerOpportunityKeys.all, "own", "detail", id] as const,
  adminLists: () => [...employerOpportunityKeys.all, "admin", "list"] as const,
  adminList: (params: AdminOpportunityListParams) =>
    [...employerOpportunityKeys.adminLists(), params] as const,
};

// --- Public discovery --------------------------------------------------

export function usePublishedOpportunities(params: PublicOpportunityListParams = {}) {
  return useCursorPagination(employerOpportunityKeys.publishedLists(), params, (pageParams) =>
    employerOpportunityService.listPublished(pageParams),
  );
}

export function usePublishedOpportunity(opportunityId: string) {
  return useQuery({
    queryKey: employerOpportunityKeys.published(opportunityId),
    queryFn: () => employerOpportunityService.getPublished(opportunityId),
    enabled: Boolean(opportunityId),
  });
}

// --- Business: own management -------------------------------------------

export function useOwnOpportunities(params: OwnOpportunityListParams = {}) {
  return useCursorPagination(employerOpportunityKeys.ownLists(), params, (pageParams) =>
    employerOpportunityService.listOwn(pageParams),
  );
}

export function useOwnOpportunity(opportunityId: string) {
  return useQuery({
    queryKey: employerOpportunityKeys.own(opportunityId),
    queryFn: () => employerOpportunityService.getOwn(opportunityId),
    enabled: Boolean(opportunityId),
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployerOpportunityInput) => employerOpportunityService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employerOpportunityKeys.all });
    },
  });
}

export function useUpdateOpportunity(opportunityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EmployerOpportunityUpdateInput) =>
      employerOpportunityService.update(opportunityId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employerOpportunityKeys.all });
    },
  });
}

export function useResubmitOpportunity(opportunityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      employerOpportunityService.resubmit(opportunityId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employerOpportunityKeys.all });
    },
  });
}

export function useCloseOpportunity(opportunityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      employerOpportunityService.close(opportunityId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employerOpportunityKeys.all });
    },
  });
}

// --- Admin: moderation ---------------------------------------------------

export function useAdminOpportunities(params: AdminOpportunityListParams = {}) {
  return useCursorPagination(employerOpportunityKeys.adminLists(), params, (pageParams) =>
    employerOpportunityService.listAdmin(pageParams),
  );
}

/** API-MOD-002 exposes no dedicated detail endpoint, so walk its cursor page chain. */
export function useAdminOpportunityLookup(opportunityId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [...employerOpportunityKeys.all, "admin", "lookup", opportunityId],
    queryFn: () =>
      findInCursorPages(
        queryClient,
        employerOpportunityKeys.adminLists(),
        opportunityId,
        employerOpportunityService.listAdmin,
        { limit: 100 },
      ),
    enabled: Boolean(opportunityId),
  });
}

export function useStartReviewOpportunity(opportunityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      employerOpportunityService.startReview(opportunityId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employerOpportunityKeys.all });
    },
  });
}

export function usePublishOpportunity(opportunityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      employerOpportunityService.publish(opportunityId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employerOpportunityKeys.all });
    },
  });
}

export function useRejectOpportunity(opportunityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { expectedStateVersion: number; reason: string }) =>
      employerOpportunityService.reject(opportunityId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employerOpportunityKeys.all });
    },
  });
}

export function useAdminCloseOpportunity(opportunityId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      employerOpportunityService.adminClose(opportunityId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employerOpportunityKeys.all });
    },
  });
}
