import { isServer, MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { QUERY_GC_TIME, QUERY_STALE_TIME } from "@/constants";
import { isApiError } from "@/lib/errors/api-error";
import { handleError } from "@/lib/errors/error-handler";
import { showNotification } from "@/stores/notification.store";

/**
 * Retries transient failures (network drops, 5xx) up to twice with backoff,
 * but never retries 4xx responses — those are the caller's fault (bad input,
 * auth, permissions, missing resource) and won't succeed on retry.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error) && error.status !== null && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
    // Global error handling: any query or mutation that ends in an error
    // surfaces a toast automatically, so individual `useQuery`/`useMutation`
    // call sites don't need to repeat `onError` boilerplate. A hook can still
    // pass its own `onError` for field-level handling (e.g. form errors) —
    // that runs in addition to this, not instead of it.
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Silence background refetch failures when cached data is still
        // shown — surfacing a toast for every failed background refetch
        // would be noisy. Errors on the initial fetch (no data yet) still
        // notify, since the user has nothing else to look at.
        if (query.state.data !== undefined) {
          return;
        }
        const { message } = handleError(error);
        showNotification({ type: "error", message });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        const { message } = handleError(error);
        showNotification({ type: "error", message });
      },
    }),
  });
}

let browserQueryClient: QueryClient | undefined;

/**
 * Returns a request-scoped client on the server and a singleton in the browser,
 * per the TanStack Query + Next.js App Router recommendation.
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    return makeQueryClient();
  }

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
