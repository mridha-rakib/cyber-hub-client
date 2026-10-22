"use client";

import { ArrowLeft, ChevronRight, ClipboardList, FileText, Gauge, ListChecks } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CONSULTING_SERVICE_LABELS,
  formatConsultingDate,
  formatConsultingDateTime,
  shortReference,
} from "@/features/consulting/consulting-labels";
import {
  ConsultingPageHeader,
  ConsultingQueryError,
  DetailItem,
  RequestListSkeleton,
  SectionHeading,
  WorkspaceSkeleton,
} from "@/features/consulting/consulting-ui";
import { ASSESSMENT_STATUS_LABELS } from "@/features/security-work/security-work-labels";
import { AssessmentStatusBadge } from "@/features/security-work/security-work-status";
import { useBusinessAssessment, useBusinessAssessments } from "@/hooks/use-business-security";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { cn } from "@/lib/utils";
import { ASSESSMENT_STATUSES, type AssessmentStatus } from "@/types/security-work";
import { businessSecurityHref } from "./business-security-ui";

/** UI-BIZ-012 — own-organisation assessment history (API-ASM-007). */
export function BusinessAssessmentList() {
  const [status, setStatus] = useState<AssessmentStatus | "">("");
  const query = useBusinessAssessments({ status: status || undefined, limit: 25 });
  const assessments = flattenCursorPages(query.data);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href={businessSecurityHref.dashboard}>
          <ArrowLeft aria-hidden="true" /> Back to Security
        </Link>
      </Button>
      <ConsultingPageHeader
        title="Security assessments"
        description="Every security assessment for your organisation, newest first."
      />
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

      {query.isPending ? (
        <RequestListSkeleton label="Loading assessments…" />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="your assessments"
        />
      ) : assessments.length === 0 ? (
        <EmptyState
          title={status ? "No assessments with this status" : "No assessments yet"}
          description={
            status
              ? "Try another status filter."
              : "Assessments appear here once a consulting request becomes an assessment."
          }
        />
      ) : (
        <>
          <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
            {assessments.map((assessment) => (
              <li key={assessment.id}>
                <Link
                  href={businessSecurityHref.assessment(assessment.id)}
                  className="group flex items-center gap-3 px-4 py-3.5 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{CONSULTING_SERVICE_LABELS[assessment.service]}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created {formatConsultingDate(assessment.createdAt)}
                      {assessment.completedAt &&
                        ` · Completed ${formatConsultingDate(assessment.completedAt)}`}
                    </p>
                  </div>
                  <AssessmentStatusBadge status={assessment.status} />
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <LoadMore
            hasMore={Boolean(query.hasNextPage)}
            isLoading={query.isFetchingNextPage}
            isError={query.isFetchNextPageError}
            onLoadMore={() => query.fetchNextPage()}
            onRetry={() => query.fetchNextPage()}
          />
        </>
      )}
    </div>
  );
}

const cardSpacing = "gap-5 py-5 [--card-spacing:--spacing(5)]";

/** UI-BIZ-013 — client-safe assessment detail (API-ASM-008), read-only. */
export function BusinessAssessmentDetail({ assessmentId }: { assessmentId: string }) {
  const query = useBusinessAssessment(assessmentId);

  if (query.isPending) return <WorkspaceSkeleton label="Loading assessment…" />;
  if (query.isError) {
    return (
      <ConsultingQueryError
        error={query.error}
        onRetry={() => query.refetch()}
        subject="this assessment"
      />
    );
  }
  const assessment = query.data;
  const notYet = <span className="text-muted-foreground">Not yet</span>;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href={businessSecurityHref.assessments}>
          <ArrowLeft aria-hidden="true" /> Back to assessments
        </Link>
      </Button>
      <ConsultingPageHeader
        eyebrow={
          <span className="font-mono">Assessment · Ref {shortReference(assessment.id)}</span>
        }
        title={CONSULTING_SERVICE_LABELS[assessment.service]}
        actions={<AssessmentStatusBadge status={assessment.status} />}
      />
      <Card className={cardSpacing}>
        <CardHeader className="border-b">
          <SectionHeading icon={ClipboardList} title="Assessment" />
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-3">
            <DetailItem label="Created">
              {formatConsultingDateTime(assessment.createdAt)}
            </DetailItem>
            <DetailItem label="Started">
              {formatConsultingDateTime(assessment.startedAt) ?? notYet}
            </DetailItem>
            <DetailItem label="Completed">
              {formatConsultingDateTime(assessment.completedAt) ?? notYet}
            </DetailItem>
          </dl>
        </CardContent>
      </Card>
      <Card className={cardSpacing}>
        <CardHeader className="border-b">
          <SectionHeading
            title="Related security records"
            description="Findings, scores and reports become available once a report is released to you. These lists cover all your assessments."
          />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={businessSecurityHref.findings}>
              <ListChecks aria-hidden="true" /> Findings
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={businessSecurityHref.scores}>
              <Gauge aria-hidden="true" /> Score history
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={businessSecurityHref.reports}>
              <FileText aria-hidden="true" /> Reports
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
