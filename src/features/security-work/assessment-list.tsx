"use client";

import { ArrowRight, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  CONSULTING_SERVICE_LABELS,
  formatConsultingDate,
  shortReference,
} from "@/features/consulting/consulting-labels";
import {
  ConsultingPageHeader,
  ConsultingQueryError,
  RequestListSkeleton,
} from "@/features/consulting/consulting-ui";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { useAssessments } from "@/hooks/use-security-work";
import { cn } from "@/lib/utils";
import { CONSULTING_SERVICES, type ConsultingService } from "@/types/consulting";
import { ASSESSMENT_STATUSES, type Assessment, type AssessmentStatus } from "@/types/security-work";
import { describeSecurityWorkError } from "./security-work-errors";
import { ASSESSMENT_STATUS_LABELS, assessmentHref, assessmentsHref } from "./security-work-labels";
import { AssessmentStatusBadge } from "./security-work-status";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/** The most relevant lifecycle timestamp for a scannable row. */
function lifecycleDate(assessment: Assessment): string {
  if (assessment.cancelledAt) return `Cancelled ${formatConsultingDate(assessment.cancelledAt)}`;
  if (assessment.completedAt) return `Completed ${formatConsultingDate(assessment.completedAt)}`;
  if (assessment.startedAt) return `Started ${formatConsultingDate(assessment.startedAt)}`;
  return `Created ${formatConsultingDate(assessment.createdAt)}`;
}

export function AssessmentRow({
  audience,
  assessment,
}: {
  audience: OperationalAudience;
  assessment: Assessment;
}) {
  return (
    <li>
      <Link
        href={assessmentHref(audience, assessment.id)}
        className="group flex items-center gap-3 px-4 py-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium sm:truncate">{CONSULTING_SERVICE_LABELS[assessment.service]}</p>
          <AssessmentStatusBadge status={assessment.status} className="mt-2 sm:hidden" />
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>{lifecycleDate(assessment)}</span>
            <span className="font-mono">Ref {shortReference(assessment.id)}</span>
            <span className="font-mono">
              Request {shortReference(assessment.consultingRequestId)}
            </span>
          </p>
        </div>
        <AssessmentStatusBadge status={assessment.status} className="hidden sm:inline-flex" />
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

const COPY: Record<
  OperationalAudience,
  { title: string; description: string; emptyTitle: string; emptyDescription: string }
> = {
  consultant: {
    title: "Assessments",
    description:
      "Security assessments assigned to you. Open one to progress its lifecycle and manage its findings.",
    emptyTitle: "No assigned assessments",
    emptyDescription:
      "Assessments appear here once they are created from an accepted request assigned to you.",
  },
  admin: {
    title: "Security assessments",
    description:
      "Every security assessment, for oversight. Open one to review its lifecycle and findings.",
    emptyTitle: "No security assessments yet",
    emptyDescription: "Assessments appear here once they are created from accepted requests.",
  },
};

/** UI-CON-004 (Consultant, ASG-scoped) and UI-ADM-021 (Admin) — API-ASM-002. */
export function AssessmentList({ audience }: { audience: OperationalAudience }) {
  const ids = useId();
  const [status, setStatus] = useState<AssessmentStatus | "">("");
  const [service, setService] = useState<ConsultingService | "">("");
  const query = useAssessments(audience, {
    status: status || undefined,
    service: service || undefined,
    limit: 25,
  });
  const assessments = flattenCursorPages(query.data);
  const filtered = Boolean(status || service);
  const copy = COPY[audience];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <ConsultingPageHeader title={copy.title} description={copy.description} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <fieldset className="flex flex-wrap gap-1.5">
          <legend className="sr-only">Filter by status</legend>
          {[
            { value: "" as const, label: "All" },
            ...ASSESSMENT_STATUSES.map((value) => ({
              value,
              label: ASSESSMENT_STATUS_LABELS[value],
            })),
          ].map((option) => (
            <Button
              key={option.value || "all"}
              type="button"
              size="sm"
              variant={status === option.value ? "secondary" : "ghost"}
              aria-pressed={status === option.value}
              className={cn("h-8 px-3", status === option.value && "ring-1 ring-foreground/15")}
              onClick={() => setStatus(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </fieldset>
        <div className="flex flex-col gap-1 sm:w-64">
          <label htmlFor={`${ids}-service`} className="text-xs font-medium text-muted-foreground">
            Service
          </label>
          <select
            id={`${ids}-service`}
            className={selectClassName}
            value={service}
            onChange={(event) => setService(event.target.value as ConsultingService | "")}
          >
            <option value="">All services</option>
            {CONSULTING_SERVICES.map((value) => (
              <option key={value} value={value}>
                {CONSULTING_SERVICE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.isPending ? (
        <RequestListSkeleton label="Loading assessments…" />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="assessments"
        />
      ) : assessments.length === 0 ? (
        filtered ? (
          <EmptyState
            className="min-h-[30vh] rounded-xl border border-dashed"
            title="No assessments match these filters"
            description="Try a different status or service."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("");
                  setService("");
                }}
              >
                Show all assessments
              </Button>
            }
          />
        ) : (
          <EmptyState
            className="min-h-[30vh] rounded-xl border border-dashed"
            title={copy.emptyTitle}
            description={copy.emptyDescription}
          />
        )
      ) : (
        <div className="space-y-3">
          {query.isError && !query.isFetchNextPageError && (
            <p className="text-sm text-destructive" role="alert">
              Couldn&apos;t refresh this list. The assessments below may be out of date.
            </p>
          )}
          <ul
            aria-label={copy.title}
            className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
          >
            {assessments.map((assessment) => (
              <AssessmentRow key={assessment.id} audience={audience} assessment={assessment} />
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

/**
 * Compact first page for the Consultant dashboard (UI-CON-001). Shows only
 * rows the API returned — no counts or aggregates, since none are exposed.
 */
export function AssessmentPreview({
  audience,
  limit,
}: {
  audience: OperationalAudience;
  limit: number;
}) {
  const query = useAssessments(audience, { limit });
  const assessments = flattenCursorPages(query.data).slice(0, limit);

  if (query.isPending) return <RequestListSkeleton rows={3} label="Loading assessments…" />;

  if (query.isError && query.data === undefined) {
    const copy = describeSecurityWorkError(query.error, {
      subject: "assessment",
      action: "load these assessments",
    });
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-5">
        <div>
          <p className="font-medium">
            {copy.kind === "unavailable" ? "Couldn't load assessments" : copy.title}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.kind === "unavailable" ? "Please try again." : copy.description}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => query.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-5">
        <p className="font-medium">{COPY[audience].emptyTitle}</p>
        <p className="mt-1 text-sm text-muted-foreground">{COPY[audience].emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="divide-y overflow-hidden rounded-xl ring-1 ring-foreground/10">
        {assessments.map((assessment) => (
          <AssessmentRow key={assessment.id} audience={audience} assessment={assessment} />
        ))}
      </ul>
      {query.hasNextPage && (
        <Button asChild variant="ghost" size="sm">
          <Link href={assessmentsHref(audience)}>
            View all <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      )}
    </div>
  );
}
