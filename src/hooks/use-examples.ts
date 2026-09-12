"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { type ExampleItem, exampleService } from "@/services/example.service";

/**
 * Query-key factory pattern: keep all keys for a resource in one object so
 * invalidation stays consistent.
 */
export const exampleKeys = {
  all: ["examples"] as const,
  lists: () => [...exampleKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...exampleKeys.lists(), params ?? {}] as const,
  details: () => [...exampleKeys.all, "detail"] as const,
  detail: (id: string) => [...exampleKeys.details(), id] as const,
};

export function useExamples(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: exampleKeys.list(params),
    queryFn: () => exampleService.list(params),
  });
}

export function useExample(id: string) {
  return useQuery({
    queryKey: exampleKeys.detail(id),
    queryFn: () => exampleService.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateExample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Pick<ExampleItem, "name">) => exampleService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exampleKeys.lists() });
    },
  });
}
