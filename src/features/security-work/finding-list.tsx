"use client";

import { ChevronRight, Lock, Plus } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { Button } from "@/components/ui/button";
import {
  formatConsultingDate,
  formatConsultingDateTime,
} from "@/features/consulting/consulting-labels";
import { ConsultingQueryError, RequestListSkeleton } from "@/features/consulting/consulting-ui";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { useFindings } from "@/hooks/use-security-work";
import {
  type Assessment,
  FINDING_SEVERITIES,
  FINDING_STATUSES,
  type Finding,
  type FindingSeverity,
  type FindingStatus,
} from "@/types/security-work";
import { CreateFindingForm } from "./finding-form";
import {
  FINDING_SEVERITY_LABELS,
  FINDING_STATUS_LABELS,
  findingHref,
} from "./security-work-labels";
import { canCreateFinding, findingCreateLockReason } from "./security-work-rules";
import { FindingStatusBadge, SeverityBadge } from "./security-work-status";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/**
 * Findings for one assessment (API-FND-002, cursor-paginated) plus the
 * create entry (API-FND-001), which D-3 surfaces only while the assessment
 * is IN_PROGRESS.
 */
export function FindingsPanel({
  audience,
  assessment,
}: {
  audience: OperationalAudience;
  assessment: Assessment;
}) {
  const ids = useId();
  const [severity, setSeverity] = useState<FindingSeverity | "">("");
  const [status, setStatus] = useState<FindingStatus | "">("");
  const [creating, setCreating] = useState(false);
  const query = useFindings(audience, assessment.id, {
    severity: severity || undefined,
    status: status || undefined,
    limit: 25,
  });
  const findings = flattenCursorPages(query.data);
  const filtered = Boolean(severity || status);
  const createAllowed = canCreateFinding(assessment.status);
  const createLock = findingCreateLockReason(assessment.status);

  return (
    <div className="space-y-4">
      {createAllowed && !creating && (
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden="true" /> Record finding
        </Button>
      )}
      {createLock && !creating && (
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>{createLock}</span>
        </p>
      )}
      {creating && (
        <CreateFindingForm
          audience={audience}
          assessment={assessment}
          onClose={() => setCreating(false)}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${ids}-severity`} className="text-xs font-medium text-muted-foreground">
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

      {query.isPending ? (
        <RequestListSkeleton rows={3} label="Loading findings…" />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="findings"
        />
      ) : findings.length === 0 ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-5">
          <div>
            <p className="font-medium">
              {filtered ? "No findings match these filters" : "No findings recorded"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {filtered
                ? "Try a different severity or status."
                : createAllowed
                  ? "Record each finding as the assessment progresses."
                  : "No findings were recorded on this assessment."}
            </p>
          </div>
          {filtered && (
            <Button
              variant="outline"
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
      ) : (
        <div className="space-y-3">
          {query.isError && !query.isFetchNextPageError && (
            <p className="text-sm text-destructive" role="alert">
              Couldn&apos;t refresh the findings. The list below may be out of date.
            </p>
          )}
          <ul
            aria-label="Findings"
            className="divide-y overflow-hidden rounded-xl ring-1 ring-foreground/10"
          >
            {findings.map((finding) => (
              <FindingRow key={finding.id} audience={audience} finding={finding} />
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

function FindingRow({ audience, finding }: { audience: OperationalAudience; finding: Finding }) {
  return (
    <li>
      <Link
        href={findingHref(audience, finding.id)}
        className="group flex items-center gap-3 px-4 py-3.5 transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium break-words">{finding.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <FindingStatusBadge status={finding.status} />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Recorded {formatConsultingDate(finding.createdAt)}</span>
            {finding.status === "RESOLVED" && finding.resolvedAt && (
              <span>Resolved {formatConsultingDateTime(finding.resolvedAt)}</span>
            )}
          </p>
        </div>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}
