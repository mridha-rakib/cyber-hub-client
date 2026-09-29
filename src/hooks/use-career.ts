"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AdminListingListParams,
  careerService,
  type OwnListingListParams,
  type PublicListingListParams,
} from "@/services/career.service";
import type { BusinessCareerListingInput, BusinessCareerListingUpdateInput } from "@/types/career";

/**
 * Public, own (Business), and admin representations of the same underlying
 * `jobs` row expose different fields (see `src/types/career.ts`) — each
 * context gets its own query key namespace so a public-cache read can never
 * be confused with, or accidentally reused for, a private one.
 */
export const careerListingKeys = {
  all: ["career-listings"] as const,
  publishedList: (params: PublicListingListParams) =>
    [...careerListingKeys.all, "published", "list", params] as const,
  published: (id: string) => [...careerListingKeys.all, "published", "detail", id] as const,
  ownList: (params: OwnListingListParams) =>
    [...careerListingKeys.all, "own", "list", params] as const,
  own: (id: string) => [...careerListingKeys.all, "own", "detail", id] as const,
  adminList: (params: AdminListingListParams) =>
    [...careerListingKeys.all, "admin", "list", params] as const,
};

// --- Public discovery --------------------------------------------------

export function usePublishedCareerListings(params: PublicListingListParams = {}) {
  return useQuery({
    queryKey: careerListingKeys.publishedList(params),
    queryFn: () => careerService.listPublished(params),
  });
}

export function usePublishedCareerListing(listingId: string) {
  return useQuery({
    queryKey: careerListingKeys.published(listingId),
    queryFn: () => careerService.getPublished(listingId),
    enabled: Boolean(listingId),
  });
}

// --- Business: own management -------------------------------------------

export function useOwnCareerListings(params: OwnListingListParams = {}) {
  return useQuery({
    queryKey: careerListingKeys.ownList(params),
    queryFn: () => careerService.listOwn(params),
  });
}

export function useOwnCareerListing(listingId: string) {
  return useQuery({
    queryKey: careerListingKeys.own(listingId),
    queryFn: () => careerService.getOwn(listingId),
    enabled: Boolean(listingId),
  });
}

export function useCreateCareerListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BusinessCareerListingInput) => careerService.create(input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careerListingKeys.all });
    },
  });
}

export function useUpdateCareerListing(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BusinessCareerListingUpdateInput) => careerService.update(listingId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careerListingKeys.all });
    },
  });
}

export function useResubmitCareerListing(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      careerService.resubmit(listingId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careerListingKeys.all });
    },
  });
}

export function useCloseCareerListing(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      careerService.close(listingId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careerListingKeys.all });
    },
  });
}

// --- Admin: moderation ---------------------------------------------------

export function useAdminCareerListings(params: AdminListingListParams = {}) {
  return useQuery({
    queryKey: careerListingKeys.adminList(params),
    queryFn: () => careerService.listAdmin(params),
  });
}

export function useStartReviewCareerListing(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      careerService.startReview(listingId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careerListingKeys.all });
    },
  });
}

export function usePublishCareerListing(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      careerService.publish(listingId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careerListingKeys.all });
    },
  });
}

export function useRejectCareerListing(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { expectedStateVersion: number; reason: string }) =>
      careerService.reject(listingId, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careerListingKeys.all });
    },
  });
}

export function useAdminCloseCareerListing(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      careerService.adminClose(listingId, expectedStateVersion),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: careerListingKeys.all });
    },
  });
}
