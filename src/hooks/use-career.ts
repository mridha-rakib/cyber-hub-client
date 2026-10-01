"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { findInCursorPages, useCursorPagination } from "@/hooks/use-cursor-pagination";
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
  publishedLists: () => [...careerListingKeys.all, "published", "list"] as const,
  publishedList: (params: PublicListingListParams) =>
    [...careerListingKeys.publishedLists(), params] as const,
  published: (id: string) => [...careerListingKeys.all, "published", "detail", id] as const,
  ownLists: () => [...careerListingKeys.all, "own", "list"] as const,
  ownList: (params: OwnListingListParams) => [...careerListingKeys.ownLists(), params] as const,
  own: (id: string) => [...careerListingKeys.all, "own", "detail", id] as const,
  adminLists: () => [...careerListingKeys.all, "admin", "list"] as const,
  adminList: (params: AdminListingListParams) =>
    [...careerListingKeys.adminLists(), params] as const,
};

// --- Public discovery --------------------------------------------------

export function usePublishedCareerListings(params: PublicListingListParams = {}) {
  return useCursorPagination(careerListingKeys.publishedLists(), params, (pageParams) =>
    careerService.listPublished(pageParams),
  );
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
  return useCursorPagination(careerListingKeys.ownLists(), params, (pageParams) =>
    careerService.listOwn(pageParams),
  );
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
  return useCursorPagination(careerListingKeys.adminLists(), params, (pageParams) =>
    careerService.listAdmin(pageParams),
  );
}

/** API-MOD-001 exposes no dedicated detail endpoint, so walk its cursor page chain. */
export function useAdminCareerListingLookup(listingId: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: [...careerListingKeys.all, "admin", "lookup", listingId],
    queryFn: () =>
      findInCursorPages(
        queryClient,
        careerListingKeys.adminLists(),
        listingId,
        careerService.listAdmin,
        { limit: 100 },
      ),
    enabled: Boolean(listingId),
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
