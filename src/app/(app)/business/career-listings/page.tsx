"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnCareerListings } from "@/hooks/use-career";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { isApiError } from "@/lib/errors/api-error";
import { CAREER_LISTING_TYPE_LABELS, type ListingStatus } from "@/types/career";

const STATUS_FILTERS: { value: ListingStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CLOSED", label: "Closed" },
];

export default function BusinessCareerListingsPage() {
  const [status, setStatus] = useState<ListingStatus | "">("");
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
  } = useOwnCareerListings({
    status: status || undefined,
    limit: 25,
  });
  const listings = flattenCursorPages(data);

  if (isError && isApiError(error) && error.status === 403) {
    return <ForbiddenState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Career Listings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organisation&apos;s career listings across every stage of review.
          </p>
        </div>
        <Button asChild>
          <Link href="/business/career-listings/new">
            <PlusIcon />
            New listing
          </Link>
        </Button>
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
          title="Couldn't refresh listings"
          description="Showing the last loaded results. Try again when the connection is available."
          onRetry={() => refetch()}
          className="min-h-0 rounded-lg border py-6"
        />
      )}
      {!isPending && listings.length === 0 && (
        <EmptyState
          title="No listings yet"
          description="Create your first career listing to get it into moderation."
          action={
            <Button asChild>
              <Link href="/business/career-listings/new">
                <PlusIcon />
                New listing
              </Link>
            </Button>
          }
        />
      )}
      {!isPending && listings.length > 0 && (
        <>
          {listings.map((listing) => (
            <Link key={listing.id} href={`/business/career-listings/${listing.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex-row items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{listing.title}</CardTitle>
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{listing.location}</span>
                      <Badge variant="outline">
                        {CAREER_LISTING_TYPE_LABELS[listing.listingType]}
                      </Badge>
                    </div>
                  </div>
                  <StatusBadge status={listing.status} />
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
