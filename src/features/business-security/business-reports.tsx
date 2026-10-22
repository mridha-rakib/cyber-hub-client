"use client";

import { ArrowLeft, ChevronRight, Download, FileText, Info, ListChecks } from "lucide-react";
import Link from "next/link";
import { useId } from "react";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
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
import { ReportStatusBadge } from "@/features/security-reports/report-status";
import { useBusinessReport, useBusinessReports } from "@/hooks/use-business-security";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import type { SecurityReportClientView } from "@/types/business-security";
import { businessSecurityHref, ClientFindingItem } from "./business-security-ui";

const HISTORICAL_NOTE =
  "A newer version has replaced this report. It stays available as part of your history.";

/** UI-BIZ-016 — released and superseded reports (API-RPT-010). */
export function BusinessReportList() {
  const query = useBusinessReports({ limit: 25 });
  const reports = flattenCursorPages(query.data);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href={businessSecurityHref.dashboard}>
          <ArrowLeft aria-hidden="true" /> Back to Security
        </Link>
      </Button>
      <ConsultingPageHeader
        title="Security reports"
        description="Reports released to your organisation, including earlier versions that have since been replaced."
      />
      {query.isPending ? (
        <RequestListSkeleton label="Loading reports…" />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="your reports"
        />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No released reports yet"
          description="Reports appear here once they have been reviewed and released to your organisation."
        />
      ) : (
        <>
          <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
            {reports.map((report) => (
              <li key={report.id}>
                <Link
                  href={businessSecurityHref.report(report.id)}
                  className="group flex items-center gap-3 px-4 py-3.5 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset sm:gap-4"
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">Security report · Version {report.versionNo}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {report.releasedAt
                        ? `Released ${formatConsultingDate(report.releasedAt)}`
                        : "Released"}
                      {" · "}
                      <span className="font-mono">
                        Assessment {shortReference(report.assessmentId)}
                      </span>
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

/**
 * RPT-012 download gate (GAP-013 open, D6-3). The button is disabled with a
 * visible reason whenever the API says the file isn't available; there is no
 * client request path to the download endpoint, no reportPath link and no
 * generated file.
 */
export function ReportDownloadControl({ report }: { report: SecurityReportClientView }) {
  const reasonId = useId();
  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" disabled aria-describedby={reasonId}>
        <Download aria-hidden="true" /> Download report
      </Button>
      <p id={reasonId} className="flex items-start gap-2 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {report.downloadAvailable
          ? "The report file isn't available in this version of the platform."
          : "The report file is not available yet."}
      </p>
    </div>
  );
}

const cardSpacing = "gap-5 py-5 [--card-spacing:--spacing(5)]";

/** UI-BIZ-017 — released report metadata and live included findings (API-RPT-011). */
export function BusinessReportDetail({ reportId }: { reportId: string }) {
  const query = useBusinessReport(reportId);

  if (query.isPending) return <WorkspaceSkeleton label="Loading report…" />;
  if (query.isError) {
    return (
      <ConsultingQueryError
        error={query.error}
        onRetry={() => query.refetch()}
        subject="this report"
      />
    );
  }
  const report = query.data;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
        <Link href={businessSecurityHref.reports}>
          <ArrowLeft aria-hidden="true" /> Back to reports
        </Link>
      </Button>
      <ConsultingPageHeader
        eyebrow={<span className="font-mono">Report · Ref {shortReference(report.id)}</span>}
        title={`Security report · Version ${report.versionNo}`}
        actions={<ReportStatusBadge status={report.status} />}
      />
      {report.status === "SUPERSEDED" && (
        <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm" role="note">
          {HISTORICAL_NOTE}
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className={`order-last lg:order-first ${cardSpacing}`}>
          <CardHeader className="border-b">
            <SectionHeading
              icon={ListChecks}
              title="Included findings"
              description="Each finding shows its current remediation status, which may have changed since this report was released. The released report file is the record of what was reported at the time."
            />
          </CardHeader>
          <CardContent>
            {report.includedFindings.length === 0 ? (
              <EmptyState className="min-h-0 py-6" title="No findings listed in this report" />
            ) : (
              <ul className="-mx-4 divide-y">
                {report.includedFindings.map((finding) => (
                  <ClientFindingItem key={finding.id} finding={finding} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <aside className="space-y-6">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading icon={FileText} title="Report" />
            </CardHeader>
            <CardContent className="space-y-5">
              <dl className="grid gap-4">
                <DetailItem label="Version">{report.versionNo}</DetailItem>
                <DetailItem label="Released">
                  {formatConsultingDateTime(report.releasedAt) ?? "—"}
                </DetailItem>
                <DetailItem label="Assessment">
                  <Link
                    href={businessSecurityHref.assessment(report.assessmentId)}
                    className="font-mono text-[0.8rem] underline-offset-4 hover:underline"
                  >
                    Ref {shortReference(report.assessmentId)}
                  </Link>
                </DetailItem>
              </dl>
              <ReportDownloadControl report={report} />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
