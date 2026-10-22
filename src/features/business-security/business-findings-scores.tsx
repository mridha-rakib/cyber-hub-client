"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ConsultingPageHeader,
  ConsultingQueryError,
  RequestListSkeleton,
} from "@/features/consulting/consulting-ui";
import {
  FINDING_SEVERITY_LABELS,
  FINDING_STATUS_LABELS,
} from "@/features/security-work/security-work-labels";
import { useBusinessFindings, useBusinessScores } from "@/hooks/use-business-security";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import {
  FINDING_SEVERITIES,
  FINDING_STATUSES,
  type FindingSeverity,
  type FindingStatus,
} from "@/types/security-work";
import { businessSecurityHref, ClientFindingItem, ScoreSnapshot } from "./business-security-ui";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

function BackToSecurity() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
      <Link href={businessSecurityHref.dashboard}>
        <ArrowLeft aria-hidden="true" /> Back to Security
      </Link>
    </Button>
  );
}

/** UI-BIZ-014 — findings from released or superseded reports (API-SCR-004). */
export function BusinessFindingList() {
  const ids = useId();
  const [severity, setSeverity] = useState<FindingSeverity | "">("");
  const [status, setStatus] = useState<FindingStatus | "">("");
  const query = useBusinessFindings({
    severity: severity || undefined,
    status: status || undefined,
    limit: 25,
  });
  const findings = flattenCursorPages(query.data);
  const filtered = Boolean(severity || status);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <BackToSecurity />
      <ConsultingPageHeader
        title="Security findings"
        description="Findings included in reports released to your organisation, including earlier report versions. Each status is the finding's current remediation status — use the dashboard for currently open risks."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-md">
          <div className="flex flex-col gap-1">
            <label
              htmlFor={`${ids}-severity`}
              className="text-xs font-medium text-muted-foreground"
            >
              Severity
            </label>
            <select
              id={`${ids}-severity`}
              className={selectClassName}
              value={severity}
              onChange={(event) => setSeverity(event.target.value as FindingSeverity | "")}
            >
              <option value="">All severities</option>
              {FINDING_SEVERITIES.map((value) => (
                <option key={value} value={value}>
                  {FINDING_SEVERITY_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${ids}-status`} className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <select
              id={`${ids}-status`}
              className={selectClassName}
              value={status}
              onChange={(event) => setStatus(event.target.value as FindingStatus | "")}
            >
              <option value="">All statuses</option>
              {FINDING_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {FINDING_STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filtered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSeverity("");
              setStatus("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {query.isPending ? (
        <RequestListSkeleton label="Loading findings…" />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="your findings"
        />
      ) : findings.length === 0 ? (
        <EmptyState
          title={filtered ? "No findings match these filters" : "No findings yet"}
          description={
            filtered
              ? "Try a different severity or status."
              : "Findings appear here once a report including them has been released to you."
          }
        />
      ) : (
        <>
          <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
            {findings.map((finding) => (
              <ClientFindingItem key={finding.id} finding={finding} />
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

/** UI-BIZ-015 — score snapshots of assessments with released reports (API-SCR-005). */
export function BusinessScoreHistory() {
  const query = useBusinessScores({ limit: 10 });
  const scores = flattenCursorPages(query.data);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <BackToSecurity />
      <ConsultingPageHeader
        title="Security score history"
        description="Score snapshots for assessments with reports released to your organisation, newest first."
      />
      {query.isPending ? (
        <RequestListSkeleton label="Loading score history…" />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="your score history"
        />
      ) : scores.length === 0 ? (
        <EmptyState
          title="No released score snapshots yet"
          description="Scores appear here once a scored assessment has a report released to you."
        />
      ) : (
        <>
          <ul className="space-y-4">
            {scores.map((score) => (
              <li key={score.id}>
                <Card className="py-5 [--card-spacing:--spacing(5)]">
                  <CardContent>
                    <ScoreSnapshot score={score} />
                  </CardContent>
                </Card>
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
