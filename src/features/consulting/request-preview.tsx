"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useBusinessConsultingRequests, useOperationalRequests } from "@/hooks/use-consulting";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import type { ConsultingStatus } from "@/types/consulting";
import { describeConsultingError } from "./consulting-errors";
import { RequestListSkeleton } from "./consulting-ui";
import { type ConsultingAudience, ConsultingRequestRow } from "./request-list";

/**
 * Compact first page of a Consulting queue for dashboards. Shows only rows
 * the API returned — no totals or counts, since none are exposed.
 */
export function ConsultingRequestPreview({
  audience,
  status,
  limit,
  emptyTitle,
  emptyDescription,
  emptyAction,
  viewAllHref,
}: {
  audience: ConsultingAudience;
  status?: ConsultingStatus;
  limit: number;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
  viewAllHref: string;
}) {
  const params = { status, limit };
  const business = useBusinessConsultingRequests(params, audience === "business");
  const operational = useOperationalRequests(
    audience === "admin" ? "admin" : "consultant",
    params,
    audience !== "business",
  );
  const query = audience === "business" ? business : operational;
  const requests = flattenCursorPages(query.data).slice(0, limit);

  if (query.isPending) return <RequestListSkeleton rows={3} />;

  if (query.isError && query.data === undefined) {
    const copy = describeConsultingError(query.error, { action: "load these requests" });
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-5">
        <div>
          <p className="font-medium">{copy.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-5">
        <div>
          <p className="font-medium">{emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{emptyDescription}</p>
        </div>
        {emptyAction}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y overflow-hidden rounded-xl ring-1 ring-foreground/10">
        {requests.map((request) => (
          <ConsultingRequestRow key={request.id} audience={audience} request={request} />
        ))}
      </ul>
      {query.hasNextPage && (
        <Button asChild variant="ghost" size="sm">
          <Link href={viewAllHref}>
            View all <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  );
}
