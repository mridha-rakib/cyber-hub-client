"use client";

import { ArrowLeft, FileText, ListChecks, Route, ScrollText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatConsultingDateTime, shortReference } from "@/features/consulting/consulting-labels";
import {
  ConsultingPageHeader,
  ConsultingQueryError,
  DetailItem,
  SectionHeading,
  WorkspaceSkeleton,
} from "@/features/consulting/consulting-ui";
import { assessmentHref } from "@/features/security-work/security-work-labels";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { useOperationalReport } from "@/hooks/use-security-reports";
import { useAssessment } from "@/hooks/use-security-work";
import type { OperationalReport } from "@/types/security-report";
import { ReportActions } from "./report-actions";
import { type DraftEditState, hasUnsavedDraft, ReportContentEditor } from "./report-editor";
import { hasUnsavedSelection, ReportFindingsPanel, type SelectionState } from "./report-findings";
import { reportActionsFor, reportHref } from "./report-rules";
import { ReportStatusBadge } from "./report-status";

const cardSpacing = "gap-5 py-5 [--card-spacing:--spacing(5)]";

/** UI-CON-008 / UI-ADM-025 — operational report editor and review (API-RPT-002). */
export function ReportWorkspace({
  audience,
  reportId,
}: {
  audience: OperationalAudience;
  reportId: string;
}) {
  const query = useOperationalReport(audience, reportId);

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
  return <ReportWorkspaceBody audience={audience} report={query.data} />;
}

function ReportWorkspaceBody({
  audience,
  report,
}: {
  audience: OperationalAudience;
  report: OperationalReport;
}) {
  // Parent assessment status is shown only to explain D6-5 guards; the API
  // remains authoritative.
  const parent = useAssessment(audience, report.assessmentId);
  const [draft, setDraft] = useState<DraftEditState>({ edits: null, base: null });
  const [selection, setSelection] = useState<SelectionState>({
    findingIds: null,
    baseVersion: null,
  });
  const actions = reportActionsFor(report.status, audience);
  const unsavedChanges = hasUnsavedDraft(draft) || hasUnsavedSelection(selection, report);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={assessmentHref(audience, report.assessmentId)}>
          <ArrowLeft aria-hidden="true" /> Back to assessment
        </Link>
      </Button>
      <ConsultingPageHeader
        eyebrow={<span className="font-mono">Report · Ref {shortReference(report.id)}</span>}
        title={`Security report · Version ${report.versionNo}`}
        meta={
          <p className="text-sm text-muted-foreground">
            Last updated {formatConsultingDateTime(report.updatedAt)}
          </p>
        }
        actions={<ReportStatusBadge status={report.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <aside className="order-first space-y-6 lg:order-last lg:sticky lg:top-6 lg:self-start">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading icon={Route} title="Workflow" />
            </CardHeader>
            <CardContent>
              <ReportActions
                audience={audience}
                report={report}
                parentStatus={parent.data?.status}
                unsavedChanges={unsavedChanges}
              />
            </CardContent>
          </Card>
          <ReportRecordCard audience={audience} report={report} />
        </aside>

        <div className="min-w-0 space-y-6">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading
                icon={ScrollText}
                title="Report content"
                description="Plain text only. Each section is optional while the report is a draft."
              />
            </CardHeader>
            <CardContent>
              <ReportContentEditor
                audience={audience}
                report={report}
                editable={actions.editDraft}
                state={draft}
                onStateChange={setDraft}
              />
            </CardContent>
          </Card>
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading
                icon={ListChecks}
                title="Included findings"
                description="Findings listed in this report, in report order."
              />
            </CardHeader>
            <CardContent>
              <ReportFindingsPanel
                audience={audience}
                report={report}
                editable={actions.editDraft}
                state={selection}
                onStateChange={setSelection}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReportRecordCard({
  audience,
  report,
}: {
  audience: OperationalAudience;
  report: OperationalReport;
}) {
  const notYet = <span className="text-muted-foreground">Not yet</span>;
  return (
    <Card className={cardSpacing}>
      <CardHeader className="border-b">
        <SectionHeading icon={FileText} title="Report record" />
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4">
          <DetailItem label="Version">{report.versionNo}</DetailItem>
          <DetailItem label="Created">{formatConsultingDateTime(report.createdAt)}</DetailItem>
          <DetailItem label="Human review recorded">
            {report.reviewedByUserId ? "Yes" : notYet}
          </DetailItem>
          <DetailItem label="Released">
            {formatConsultingDateTime(report.releasedAt) ?? notYet}
          </DetailItem>
          {report.supersedesReportId && (
            <DetailItem label="Replaces">
              <Link
                href={reportHref(audience, report.supersedesReportId)}
                className="font-mono text-[0.8rem] underline-offset-4 hover:underline"
              >
                Ref {shortReference(report.supersedesReportId)}
              </Link>
            </DetailItem>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
