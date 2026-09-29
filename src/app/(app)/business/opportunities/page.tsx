"use client";

import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnOpportunities } from "@/hooks/use-employer-opportunity";
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

export default function BusinessOpportunitiesPage() {
  const [status, setStatus] = useState<ListingStatus | "">("");
  const { data, isPending, isError, error, refetch } = useOwnOpportunities({
    status: status || undefined,
    limit: 50,
  });

  if (isError && isApiError(error) && error.status === 403) {
    return <ForbiddenState />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Opportunities</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organisation&apos;s internship opportunities and student projects.
          </p>
        </div>
        <Button asChild>
          <Link href="/business/opportunities/new">
            <PlusIcon />
            New opportunity
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
      {isError && data !== undefined && (
        <ErrorState
          title="Couldn't refresh opportunities"
          description="Showing the last loaded results. Try again when the connection is available."
          onRetry={() => refetch()}
          className="min-h-0 rounded-lg border py-6"
        />
      )}
      {!isPending && data?.length === 0 && (
        <EmptyState
          title="No opportunities yet"
          description="Create your first internship opportunity or student project."
          action={
            <Button asChild>
              <Link href="/business/opportunities/new">
                <PlusIcon />
                New opportunity
              </Link>
            </Button>
          }
        />
      )}
      {!isPending &&
        data?.map((opportunity) => (
          <Link key={opportunity.id} href={`/business/opportunities/${opportunity.id}`}>
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
    </div>
  );
}
