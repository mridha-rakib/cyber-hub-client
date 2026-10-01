"use client";

import { type InfiniteData, type QueryClient, useInfiniteQuery } from "@tanstack/react-query";

import type { CursorPage } from "@/types/api";

type CursorParams = { cursor?: string };

/**
 * Keeps opaque cursors out of query identity and returns each continuation
 * unchanged to the API. Filter changes form a new query identity, so pages
 * from a prior filter never append to the new result set.
 */
export function useCursorPagination<T, TParams extends CursorParams>(
  key: readonly unknown[],
  params: TParams,
  fetchPage: (params: TParams) => Promise<CursorPage<T>>,
) {
  const { cursor: _ignoredCursor, ...filters } = params;

  return useInfiniteQuery({
    queryKey: [...key, filters],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchPage({
        ...filters,
        ...(pageParam === undefined ? {} : { cursor: pageParam }),
      } as TParams),
    getNextPageParam: (lastPage) =>
      lastPage.meta.page.hasMore ? (lastPage.meta.page.nextCursor ?? undefined) : undefined,
  });
}

/** Flattens server-returned pages without reordering or client-side deduplication. */
export function flattenCursorPages<T>(data: InfiniteData<CursorPage<T>> | undefined): T[] {
  return data?.pages.flatMap((page) => page.data) ?? [];
}

/**
 * Resolves a protected detail through its approved list endpoint. Requests
 * are deliberately sequential because every cursor is supplied by the prior
 * page. A repeated continuation cursor is an operational failure, never a
 * reason to loop or falsely report a missing record.
 */
export async function findInCursorPages<T extends { id: string }, TParams extends CursorParams>(
  queryClient: QueryClient,
  cacheKey: readonly unknown[],
  id: string,
  fetchPage: (params: TParams) => Promise<CursorPage<T>>,
  baseParams: Omit<TParams, "cursor">,
): Promise<T | null> {
  const cached = queryClient.getQueriesData<InfiniteData<CursorPage<T>>>({ queryKey: cacheKey });
  for (const [, data] of cached) {
    const match = data?.pages.flatMap((page) => page.data).find((item) => item.id === id);
    if (match) return match;
  }

  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  while (true) {
    const page = await fetchPage({
      ...baseParams,
      ...(cursor === undefined ? {} : { cursor }),
    } as TParams);
    const match = page.data.find((item) => item.id === id);
    if (match) return match;
    if (!page.meta.page.hasMore) return null;

    const nextCursor = page.meta.page.nextCursor;
    if (!nextCursor || seenCursors.has(nextCursor)) {
      throw new Error("Unable to continue loading the moderation record. Please try again.");
    }
    seenCursors.add(nextCursor);
    cursor = nextCursor;
  }
}
