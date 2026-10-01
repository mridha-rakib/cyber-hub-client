import { Button } from "@/components/ui/button";

interface LoadMoreProps {
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  onLoadMore: () => void;
  onRetry: () => void;
}

/** A compact continuation control that never replaces already-loaded results. */
export function LoadMore({ hasMore, isLoading, isError, onLoadMore, onRetry }: LoadMoreProps) {
  if (!hasMore && !isError) return null;

  return (
    <div className="flex flex-col items-start gap-2 pt-2" aria-live="polite">
      {isError && (
        <p className="text-sm text-destructive" role="alert">
          Couldn&apos;t load more results. Your loaded results are still available.
        </p>
      )}
      {hasMore && (
        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          onClick={isError ? onRetry : onLoadMore}
        >
          {isLoading ? "Loading more…" : isError ? "Try again" : "Load more"}
        </Button>
      )}
    </div>
  );
}
