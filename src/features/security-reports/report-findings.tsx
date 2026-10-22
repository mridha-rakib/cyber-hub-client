"use client";

import { History } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConsultingQueryError, RequestListSkeleton } from "@/features/consulting/consulting-ui";
import {
  describeSecurityWorkError,
  type SecurityWorkFailure,
} from "@/features/security-work/security-work-errors";
import { findingHref } from "@/features/security-work/security-work-labels";
import { FindingStatusBadge, SeverityBadge } from "@/features/security-work/security-work-status";
import { FailureAlert } from "@/features/security-work/security-work-ui";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { useRefreshReport, useReplaceReportFindings } from "@/hooks/use-security-reports";
import { useFindings } from "@/hooks/use-security-work";
import { showNotification } from "@/stores/notification.store";
import type { OperationalReport } from "@/types/security-report";

/** Unsaved included-findings selection, lifted so workflow actions can see it. */
export interface SelectionState {
  findingIds: string[] | null;
  /** Report stateVersion the selection was started on (the CAS expectedStateVersion). */
  baseVersion: number | null;
}

export function includedFindingIds(report: OperationalReport): string[] {
  return [...report.includedFindings]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((entry) => entry.findingId);
}

export function hasUnsavedSelection(state: SelectionState, report: OperationalReport): boolean {
  if (!state.findingIds) return false;
  const current = includedFindingIds(report);
  return (
    current.length !== state.findingIds.length ||
    current.some((id, index) => state.findingIds?.[index] !== id)
  );
}

/**
 * Included findings (API-RPT-004, DRAFT only). Membership is replaced as a
 * whole set in the order shown; the findings themselves are never copied
 * into draftContent. A version change pauses saving until reviewed.
 */
export function ReportFindingsPanel({
  audience,
  report,
  editable,
  state,
  onStateChange,
}: {
  audience: OperationalAudience;
  report: OperationalReport;
  editable: boolean;
  state: SelectionState;
  onStateChange: (next: SelectionState) => void;
}) {
  const included = [...report.includedFindings].sort((a, b) => a.sortOrder - b.sortOrder);
  const selecting = state.findingIds !== null;

  return (
    <div className="space-y-4">
      {included.length === 0 ? (
        <p className="text-sm text-muted-foreground">No findings are included yet.</p>
      ) : (
        <ol className="divide-y rounded-xl ring-1 ring-foreground/10">
          {included.map((entry) => (
            <li key={entry.findingId} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <Link
                href={findingHref(audience, entry.findingId)}
                className="min-w-0 flex-1 font-medium break-words underline-offset-4 hover:underline"
              >
                {entry.finding.title}
              </Link>
              <SeverityBadge severity={entry.finding.severity} />
              <FindingStatusBadge status={entry.finding.status} />
            </li>
          ))}
        </ol>
      )}
      {editable && !selecting && (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            onStateChange({
              findingIds: includedFindingIds(report),
              baseVersion: report.stateVersion,
            })
          }
        >
          Change included findings
        </Button>
      )}
      {editable && selecting && (
        <FindingSelector
          audience={audience}
          report={report}
          state={state}
          onStateChange={onStateChange}
        />
      )}
    </div>
  );
}

function FindingSelector({
  audience,
  report,
  state,
  onStateChange,
}: {
  audience: OperationalAudience;
  report: OperationalReport;
  state: SelectionState;
  onStateChange: (next: SelectionState) => void;
}) {
  const ids = useId();
  const query = useFindings(audience, report.assessmentId, { limit: 50 });
  const findings = flattenCursorPages(query.data);
  const replace = useReplaceReportFindings(audience, report.id);
  const refreshReport = useRefreshReport(audience, report.id);
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);
  const selected = state.findingIds ?? [];
  const stale = state.baseVersion !== null && state.baseVersion !== report.stateVersion;

  const toggle = (findingId: string, checked: boolean) =>
    onStateChange({
      ...state,
      findingIds: checked
        ? [...selected.filter((id) => id !== findingId), findingId]
        : selected.filter((id) => id !== findingId),
    });

  const save = async () => {
    if (state.baseVersion === null || stale) return;
    setFailure(null);
    try {
      await replace.mutateAsync({ findingIds: selected, expectedStateVersion: state.baseVersion });
      onStateChange({ findingIds: null, baseVersion: null });
      showNotification({ type: "success", message: "Included findings updated." });
    } catch (error) {
      const next = describeSecurityWorkError(error, {
        subject: "report",
        action: "update the included findings",
        preserved: "Your selection has been kept.",
      });
      setFailure(next);
      if (next.refresh) await refreshReport();
    }
  };

  return (
    <section aria-label="Choose included findings" className="space-y-3 rounded-xl border p-4">
      <h3 className="font-medium">Choose included findings</h3>
      <p id={`${ids}-help`} className="text-xs text-muted-foreground">
        Findings from this assessment, including resolved ones. The report lists them in the order
        you select them.
      </p>
      {query.isPending ? (
        <RequestListSkeleton rows={2} label="Loading findings…" />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="findings"
        />
      ) : findings.length === 0 ? (
        <p className="text-sm text-muted-foreground">This assessment has no findings yet.</p>
      ) : (
        <fieldset aria-describedby={`${ids}-help`} className="space-y-1">
          <legend className="sr-only">Findings to include</legend>
          {findings.map((finding) => {
            const checked = selected.includes(finding.id);
            return (
              <div key={finding.id} className="flex items-start gap-3 rounded-lg px-1 py-2">
                <Checkbox
                  id={`${ids}-${finding.id}`}
                  checked={checked}
                  onCheckedChange={(value) => toggle(finding.id, value === true)}
                  disabled={replace.isPending}
                  className="mt-0.5"
                />
                <label htmlFor={`${ids}-${finding.id}`} className="min-w-0 flex-1 space-y-1.5">
                  <span className="block text-sm font-medium break-words">{finding.title}</span>
                  <span className="flex flex-wrap gap-1.5">
                    <SeverityBadge severity={finding.severity} />
                    <FindingStatusBadge status={finding.status} />
                  </span>
                </label>
              </div>
            );
          })}
          <LoadMore
            hasMore={Boolean(query.hasNextPage)}
            isLoading={query.isFetchingNextPage}
            isError={query.isFetchNextPageError}
            onLoadMore={() => query.fetchNextPage()}
            onRetry={() => query.fetchNextPage()}
          />
        </fieldset>
      )}
      <p className="text-sm" aria-live="polite">
        {selected.length} {selected.length === 1 ? "finding" : "findings"} selected
      </p>
      {stale && (
        <Alert className="gap-1 rounded-xl px-4 py-3.5">
          <History aria-hidden="true" />
          <AlertTitle>This report changed since you started</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Saving is paused so nothing is overwritten. Your selection is kept — compare it with
              the included findings shown above before continuing.
            </p>
            {report.status === "DRAFT" && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setFailure(null);
                  onStateChange({ ...state, baseVersion: report.stateVersion });
                }}
              >
                I&apos;ve reviewed it — continue with my selection
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      {failure && <FailureAlert failure={failure} onRefresh={refreshReport} />}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          disabled={replace.isPending}
          onClick={() => onStateChange({ findingIds: null, baseVersion: null })}
        >
          Cancel
        </Button>
        <Button type="button" disabled={replace.isPending || stale} onClick={save}>
          {replace.isPending ? "Saving…" : "Save included findings"}
        </Button>
      </div>
    </section>
  );
}
