"use client";

import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import {
  type AdminResourceListParams,
  type PublicResourceListParams,
  resourceService,
} from "@/services/resource.service";
import type { AdminResource, ResourceCreateInput, ResourceUpdateInput } from "@/types/resource";

/**
 * Public and Admin projections of the same `resources` row expose different
 * fields, so each gets its own key namespace: a public cache entry can never
 * be read back as an Admin record, or the reverse.
 */
export const resourceKeys = {
  all: ["resources"] as const,
  publishedLists: () => [...resourceKeys.all, "published", "list"] as const,
  published: (id: string) => [...resourceKeys.all, "published", "detail", id] as const,
  adminLists: () => [...resourceKeys.all, "admin", "list"] as const,
  admin: (id: string) => [...resourceKeys.all, "admin", "detail", id] as const,
};

// --- Public discovery --------------------------------------------------

export function usePublishedResources(params: PublicResourceListParams = {}) {
  return useCursorPagination(resourceKeys.publishedLists(), params, (pageParams) =>
    resourceService.listPublished(pageParams),
  );
}

export function usePublishedResource(resourceId: string) {
  return useQuery({
    queryKey: resourceKeys.published(resourceId),
    queryFn: () => resourceService.getPublished(resourceId),
    enabled: Boolean(resourceId),
    retry: false,
  });
}

// --- Admin management ----------------------------------------------------

export function useAdminResources(params: AdminResourceListParams = {}) {
  return useCursorPagination(resourceKeys.adminLists(), params, (pageParams) =>
    resourceService.listAdmin(pageParams),
  );
}

export function useAdminResource(resourceId: string) {
  return useQuery({
    queryKey: resourceKeys.admin(resourceId),
    queryFn: () => resourceService.getAdmin(resourceId),
    enabled: Boolean(resourceId),
    retry: false,
  });
}

/**
 * Adopts the server's returned record (and therefore its new stateVersion)
 * immediately, then refreshes every list. Lists are invalidated, not edited,
 * so filters and ordering stay server-defined.
 */
async function adoptResource(queryClient: QueryClient, record: AdminResource) {
  queryClient.setQueryData(resourceKeys.admin(record.id), record);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: resourceKeys.adminLists() }),
    queryClient.invalidateQueries({ queryKey: resourceKeys.publishedLists() }),
    queryClient.invalidateQueries({ queryKey: resourceKeys.published(record.id) }),
  ]);
}

export function useCreateResource() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (input: ResourceCreateInput) => resourceService.create(input),
    onSuccess: (record) => adoptResource(queryClient, record),
  });
}

export function useUpdateResource(resourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (input: ResourceUpdateInput) => resourceService.update(resourceId, input),
    onSuccess: (record) => adoptResource(queryClient, record),
  });
}

export function usePublishResource(resourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (expectedStateVersion: number) =>
      resourceService.publish(resourceId, expectedStateVersion),
    onSuccess: (record) => adoptResource(queryClient, record),
  });
}

export function useArchiveResource(resourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (expectedStateVersion: number) =>
      resourceService.archive(resourceId, expectedStateVersion),
    onSuccess: (record) => adoptResource(queryClient, record),
  });
}

export function useDeleteResource(resourceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (expectedStateVersion: number) =>
      resourceService.remove(resourceId, expectedStateVersion),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: resourceKeys.admin(resourceId) });
      await queryClient.invalidateQueries({ queryKey: resourceKeys.adminLists() });
    },
  });
}
