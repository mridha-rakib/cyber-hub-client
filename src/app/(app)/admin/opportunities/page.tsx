"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { useAdminOpportunities } from "@/hooks/use-employer-opportunity";
import { isApiError } from "@/lib/errors/api-error";
import type { ListingStatus } from "@/types/career";
import { EMPLOYER_OPPORTUNITY_TYPE_LABELS } from "@/types/employer-opportunity";

const STATUS_FILTERS: { value: ListingStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CLOSED", label: "Closed" },
];

export default function AdminOpportunitiesPage() {
  const [status, setStatus] = useState<ListingStatus | "">("SUBMITTED");
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useAdminOpportunities({
    status: status || undefined,
    limit: 25,
  });
  const opportunities = flattenCursorPages(data);

  if (isError && isApiError(error) && error.status === 403) {
    return <ForbiddenState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Opportunity Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review employer-submitted internship opportunities and student projects.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value || "all"}
            size="sm"
            variant={status === filter.value ? "secondary" : "ghost"}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {isPending && <PageLoading />}
      {isError && data === undefined && !(isApiError(error) && error.status === 403) && (
        <ErrorState onRetry={() => refetch()} />
      )}
      {isError && data !== undefined && !isFetchNextPageError && (
        <ErrorState
          title="Couldn't refresh the moderation queue"
          description="Showing the last loaded results. Try again when the connection is available."
          onRetry={() => refetch()}
          className="min-h-0 rounded-lg border py-6"
        />
      )}
      {!isPending && opportunities.length === 0 && (
        <EmptyState
          title="Nothing is waiting for review"
          description="Opportunities will appear here as businesses submit them."
        />
      )}
      {!isPending && opportunities.length > 0 && (
        <>
          {opportunities.map((opportunity) => (
            <Link key={opportunity.id} href={`/admin/opportunities/${opportunity.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{opportunity.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {EMPLOYER_OPPORTUNITY_TYPE_LABELS[opportunity.type]}
                    </Badge>
                  </div>
                  <StatusBadge status={opportunity.status} />
                </CardHeader>
              </Card>
            </Link>
          ))}
          <LoadMore
            hasMore={hasNextPage}
            isLoading={isFetchingNextPage}
            isError={isFetchNextPageError}
            onLoadMore={() => fetchNextPage()}
            onRetry={() => fetchNextPage()}
          />
        </>
      )}
    </div>
  );
}
