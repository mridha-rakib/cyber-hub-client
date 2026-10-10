"use client";

import { ChevronRight, PlusIcon, UserRoundCheck, UserRoundX } from "lucide-react";
import Link from "next/link";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { useBusinessConsultingRequests, useOperationalRequests } from "@/hooks/use-consulting";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { cn } from "@/lib/utils";
import {
  CONSULTING_STATUSES,
  type ConsultingRequestClient,
  type ConsultingRequestOperational,
  type ConsultingStatus,
} from "@/types/consulting";
import {
  CONSULTING_SERVICE_LABELS,
  CONSULTING_STATUS_LABELS,
  companyNameOf,
  formatConsultingDate,
  shortReference,
} from "./consulting-labels";
import { ConsultingStatusBadge } from "./consulting-status";
import { ConsultingPageHeader, ConsultingQueryError, RequestListSkeleton } from "./consulting-ui";

export type ConsultingAudience = "business" | "consultant" | "admin";

export function requestHref(audience: ConsultingAudience, id: string): string {
  if (audience === "business") return `/business/consulting/${id}`;
  if (audience === "consultant") return `/consultant/requests/${id}`;
  return `/admin/consulting/${id}`;
}

/** One scannable row: what it is, for whom, when, and where it stands. */
export function ConsultingRequestRow({
  audience,
  request,
}: {
  audience: ConsultingAudience;
  request: ConsultingRequestClient | ConsultingRequestOperational;
}) {
  const company = companyNameOf(request.companyDetails);
  const assigned = "assignedConsultantId" in request ? request.assignedConsultantId : undefined;
  return (
    <li>
      <Link
        href={requestHref(audience, request.id)}
        className="group flex items-center gap-3 px-4 py-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium sm:truncate">
            {CONSULTING_SERVICE_LABELS[request.requestedService]}
          </p>
          <ConsultingStatusBadge status={request.status} className="mt-2 sm:hidden" />
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {company && <span className="max-w-full truncate">{company}</span>}
            <span>Submitted {formatConsultingDate(request.submittedAt)}</span>
            {audience !== "business" && (
              <span className="font-mono">Ref {shortReference(request.id)}</span>
            )}
            {audience === "admin" && (
              <span className="inline-flex items-center gap-1">
                {assigned ? (
                  <UserRoundCheck className="size-3.5" aria-hidden="true" />
                ) : (
                  <UserRoundX className="size-3.5" aria-hidden="true" />
                )}
                {assigned ? "Consultant assigned" : "Unassigned"}
              </span>
            )}
          </p>
        </div>
        <ConsultingStatusBadge status={request.status} className="hidden sm:inline-flex" />
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

export function StatusFilter({
  value,
  onChange,
}: {
  value: ConsultingStatus | "";
  onChange: (value: ConsultingStatus | "") => void;
}) {
  const options: { value: ConsultingStatus | ""; label: string }[] = [
    { value: "", label: "All" },
    ...CONSULTING_STATUSES.map((status) => ({
      value: status,
      label: CONSULTING_STATUS_LABELS[status],
    })),
  ];
  return (
    <fieldset className="flex flex-wrap gap-1.5">
      <legend className="sr-only">Filter by status</legend>
      {options.map((option) => (
        <Button
          key={option.value || "all"}
          type="button"
          size="sm"
          variant={value === option.value ? "secondary" : "ghost"}
          aria-pressed={value === option.value}
          className={cn("h-8 px-3", value === option.value && "ring-1 ring-foreground/15")}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </fieldset>
  );
}

const COPY: Record<
  ConsultingAudience,
  { title: string; description: string; emptyTitle: string; emptyDescription: string }
> = {
  business: {
    title: "Consulting requests",
    description:
      "Track your organisation's cybersecurity requests and confirm the scope consultants may work within.",
    emptyTitle: "No consulting requests yet",
    emptyDescription:
      "When your organisation needs cybersecurity help, describe the concern and choose a service to get started.",
  },
  consultant: {
    title: "Consulting requests",
    description:
      "Requests assigned to you. Open one to review it, progress the next valid step, and keep internal notes.",
    emptyTitle: "No assigned consulting requests",
    emptyDescription: "Requests will appear here when an Admin assigns them to you.",
  },
  admin: {
    title: "Consulting requests",
    description:
      "The operational queue for consulting requests. Open a request to assign a consultant and manage its lifecycle.",
    emptyTitle: "No consulting requests yet",
    emptyDescription: "Submitted Business requests will appear here.",
  },
};

export function ConsultingRequestList({
  audience,
  status,
  onStatusChange,
}: {
  audience: ConsultingAudience;
  status: ConsultingStatus | "";
  onStatusChange: (status: ConsultingStatus | "") => void;
}) {
  const params = { status: status || undefined, limit: 25 };
  const business = useBusinessConsultingRequests(params, audience === "business");
  const operational = useOperationalRequests(
    audience === "admin" ? "admin" : "consultant",
    params,
    audience !== "business",
  );
  const query = audience === "business" ? business : operational;
  const requests: (ConsultingRequestClient | ConsultingRequestOperational)[] = flattenCursorPages(
    query.data,
  );
  const copy = COPY[audience];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <ConsultingPageHeader
        title={copy.title}
        description={copy.description}
        actions={
          audience === "business" && (
            <Button asChild size="lg">
              <Link href="/business/consulting/new">
                <PlusIcon aria-hidden="true" /> New consulting request
              </Link>
            </Button>
          )
        }
      />

      <StatusFilter value={status} onChange={onStatusChange} />

      {query.isPending ? (
        <RequestListSkeleton />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="consulting requests"
        />
      ) : requests.length === 0 ? (
        status ? (
          <EmptyState
            className="min-h-[30vh] rounded-xl border border-dashed"
            title={`No ${CONSULTING_STATUS_LABELS[status].toLowerCase()} requests`}
            description="No consulting requests match this status filter."
            action={
              <Button variant="outline" onClick={() => onStatusChange("")}>
                Show all requests
              </Button>
            }
          />
        ) : (
          <EmptyState
            className="min-h-[30vh] rounded-xl border border-dashed"
            title={copy.emptyTitle}
            description={copy.emptyDescription}
            action={
              audience === "business" ? (
                <Button asChild>
                  <Link href="/business/consulting/new">
                    <PlusIcon aria-hidden="true" /> Create your first request
                  </Link>
                </Button>
              ) : undefined
            }
          />
        )
      ) : (
        <div className="space-y-3">
          {query.isError && !query.isFetchNextPageError && (
            <p className="text-sm text-destructive" role="alert">
              Couldn&apos;t refresh this list. The requests below may be out of date.
            </p>
          )}
          <ul
            aria-label={copy.title}
            className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
          >
            {requests.map((request) => (
              <ConsultingRequestRow key={request.id} audience={audience} request={request} />
            ))}
          </ul>
          <LoadMore
            hasMore={Boolean(query.hasNextPage)}
            isLoading={query.isFetchingNextPage}
            isError={query.isFetchNextPageError}
            onLoadMore={() => query.fetchNextPage()}
            onRetry={() => query.fetchNextPage()}
          />
        </div>
      )}
    </div>
  );
}
