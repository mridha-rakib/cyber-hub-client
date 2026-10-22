"use client";

import { ChevronRight, FilePlus2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { Button } from "@/components/ui/button";
import {
  formatConsultingDate,
  formatConsultingDateTime,
} from "@/features/consulting/consulting-labels";
import { ConsultingQueryError, RequestListSkeleton } from "@/features/consulting/consulting-ui";
import {
  describeSecurityWorkError,
  type SecurityWorkFailure,
} from "@/features/security-work/security-work-errors";
import { FailureAlert } from "@/features/security-work/security-work-ui";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { useAssessmentReports, useCreateReport } from "@/hooks/use-security-reports";
import { useRefreshAssessment } from "@/hooks/use-security-work";
import { showNotification } from "@/stores/notification.store";
import { REPORT_STATUSES, type ReportStatus } from "@/types/security-report";
import type { Assessment } from "@/types/security-work";
import { reportCreateLockReason, reportHref } from "./report-rules";
import { REPORT_STATUS_LABELS, ReportStatusBadge } from "./report-status";

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

/**
 * Assessment-workspace report section (UI-CON-005 / UI-ADM-022, UI-DEC-016):
 * the assessment's reports via API-RPT-013 and report creation (API-RPT-001).
 * There is no global report list.
 */
export function ReportSection({
  audience,
  assessment,
}: {
  audience: OperationalAudience;
  assessment: Assessment;
}) {
  const ids = useId();
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus | "">("");
  const query = useAssessmentReports(audience, assessment.id, {
    status: status || undefined,
    limit: 25,
  });
  const reports = flattenCursorPages(query.data);
  const create = useCreateReport(audience, assessment.id);
  const refreshAssessment = useRefreshAssessment(audience, assessment.id);
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);
  const createLock = reportCreateLockReason(assessment.status);

  const createReport = async () => {
    setFailure(null);
    try {
      const report = await create.mutateAsync();
      showNotification({ type: "success", message: `Report version ${report.versionNo} created.` });
      router.push(reportHref(audience, report.id));
    } catch (error) {
      const next = describeSecurityWorkError(error, {
        subject: "assessment",
        action: "create a report",
      });
      setFailure(next);
      if (next.refresh) await refreshAssessment();
    }
  };

  return (
    <div className="space-y-4">
      {createLock ? (
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>{createLock}</span>
        </p>
      ) : (
        <Button onClick={createReport} disabled={create.isPending}>
          <FilePlus2 aria-hidden="true" />
          {create.isPending ? "Creating report…" : "Create report"}
        </Button>
      )}
      {failure && <FailureAlert failure={failure} onRefresh={refreshAssessment} />}

      <div className="flex flex-col gap-1 sm:w-56">
        <label htmlFor={`${ids}-status`} className="text-xs font-medium text-muted-foreground">
          Status
        </label>
        <select
          id={`${ids}-status`}
          className={selectClassName}
          value={status}
          onChange={(event) => setStatus(event.target.value as ReportStatus | "")}
        >
          <option value="">All statuses</option>
          {REPORT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {REPORT_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      {query.isPending ? (
        <RequestListSkeleton rows={2} label="Loading reports…" />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="reports"
        />
      ) : reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {status ? "No reports with this status." : "No reports for this assessment yet."}
        </p>
      ) : (
        <>
          <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
            {reports.map((report) => (
              <li key={report.id}>
                <Link
                  href={reportHref(audience, report.id)}
                  className="group flex items-center gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Version {report.versionNo}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Updated {formatConsultingDateTime(report.updatedAt)}
                      {report.releasedAt &&
                        ` · Released ${formatConsultingDate(report.releasedAt)}`}
                    </p>
                  </div>
                  <ReportStatusBadge status={report.status} />
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
