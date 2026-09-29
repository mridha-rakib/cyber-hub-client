"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCareerListings } from "@/hooks/use-career";
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

export default function AdminCareerListingsPage() {
  const [status, setStatus] = useState<ListingStatus | "">("SUBMITTED");
  const { data, isPending, isError, error, refetch } = useAdminCareerListings({
    status: status || undefined,
    limit: 100,
  });

  if (isError && isApiError(error) && error.status === 403) {
    return <ForbiddenState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Career Listing Moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review employer-submitted career listings and externally curated entries.
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
      {isError && data !== undefined && (
        <ErrorState
          title="Couldn't refresh the moderation queue"
          description="Showing the last loaded results. Try again when the connection is available."
          onRetry={() => refetch()}
          className="min-h-0 rounded-lg border py-6"
        />
      )}
      {!isPending && data?.length === 0 && (
        <EmptyState
          title="Nothing is waiting for review"
          description="Listings will appear here as businesses submit them."
        />
      )}
      {!isPending &&
        data?.map((listing) => (
          <Link key={listing.id} href={`/admin/career-listings/${listing.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{listing.title}</CardTitle>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">{listing.employerName}</span>
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
    </div>
  );
}
