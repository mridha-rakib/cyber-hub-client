"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  publishedList: (params: PublicOpportunityListParams) =>
    [...employerOpportunityKeys.all, "published", "list", params] as const,
  published: (id: string) => [...employerOpportunityKeys.all, "published", "detail", id] as const,
  ownList: (params: OwnOpportunityListParams) =>
    [...employerOpportunityKeys.all, "own", "list", params] as const,
  own: (id: string) => [...employerOpportunityKeys.all, "own", "detail", id] as const,
  adminList: (params: AdminOpportunityListParams) =>
    [...employerOpportunityKeys.all, "admin", "list", params] as const,
};

// --- Public discovery --------------------------------------------------

export function usePublishedOpportunities(params: PublicOpportunityListParams = {}) {
  return useQuery({
    queryKey: employerOpportunityKeys.publishedList(params),
    queryFn: () => employerOpportunityService.listPublished(params),
  });
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
  return useQuery({
    queryKey: employerOpportunityKeys.ownList(params),
    queryFn: () => employerOpportunityService.listOwn(params),
  });
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
  return useQuery({
    queryKey: employerOpportunityKeys.adminList(params),
    queryFn: () => employerOpportunityService.listAdmin(params),
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
