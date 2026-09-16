"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { isApiError } from "@/lib/errors/api-error";
import { authService } from "@/services/auth.service";
import type { SessionResponse } from "@/types/auth";

export const sessionKeys = {
  all: ["session"] as const,
};

/**
 * TanStack Query is the single source of truth for the authenticated
 * session — there is no parallel Zustand auth store to keep in sync. A 401
 * from `GET /auth/session` is not a query failure, it's the definitive
 * "anonymous" answer, so it must never trigger a retry.
 */
export function useSessionQuery() {
  return useQuery({
    queryKey: sessionKeys.all,
    queryFn: () => authService.getCurrentSession(),
    // The global query client (`src/config/query-client.ts`) already never
    // retries 4xx responses, so a 401 here resolves immediately as an error
    // rather than being retried into a slow "logged out" state.
    staleTime: 30 * 1000,
  });
}

export type SessionStatus = "loading" | "authenticated" | "anonymous" | "error";

export interface SessionState {
  status: SessionStatus;
  session: SessionResponse | undefined;
}

/**
 * Collapses the raw query result into the four states callers actually need
 * to branch on. A network/5xx failure is `"error"`, never `"anonymous"` —
 * conflating the two would log a user out just because the network blipped.
 */
export function useSession(): SessionState {
  const query = useSessionQuery();

  if (query.isPending) {
    return { status: "loading", session: undefined };
  }

  if (query.isError) {
    const status = isApiError(query.error) && query.error.status === 401 ? "anonymous" : "error";
    return { status, session: undefined };
  }

  return { status: "authenticated", session: query.data };
}

/** Invalidates the cached session, forcing the next read to refetch it. */
export function useInvalidateSession() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: sessionKeys.all });
}
