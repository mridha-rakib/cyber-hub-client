"use client";

import { ArrowLeft, FileSearch, Pencil, Route, ScanSearch } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CONSULTING_SERVICE_LABELS,
  formatConsultingDateTime,
  shortReference,
} from "@/features/consulting/consulting-labels";
import {
  ConsultingPageHeader,
  ConsultingQueryError,
  DetailItem,
  SectionHeading,
  WorkspaceSkeleton,
} from "@/features/consulting/consulting-ui";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { useAssessment, useFinding } from "@/hooks/use-security-work";
import type { Assessment, Finding } from "@/types/security-work";
import { FindingActions } from "./finding-actions";
import { EditFindingForm } from "./finding-form";
import { assessmentHref, assessmentsHref } from "./security-work-labels";
import { findingActionsFor } from "./security-work-rules";
import { AssessmentStatusBadge, FindingStatusBadge, SeverityBadge } from "./security-work-status";

const cardSpacing = "gap-5 py-5 [--card-spacing:--spacing(5)]";

/**
 * UI-CON-006 (Consultant Finding Editor) and UI-ADM-023 (Admin Finding
 * Workspace). The parent assessment is read alongside the finding because
 * D-3 makes every finding action depend on the parent's state.
 */
export function FindingWorkspace({
  audience,
  findingId,
}: {
  audience: OperationalAudience;
  findingId: string;
}) {
  const findingQuery = useFinding(audience, findingId);
  const parentQuery = useAssessment(audience, findingQuery.data?.assessmentId);

  if (findingQuery.isPending) return <WorkspaceSkeleton label="Loading finding…" />;
  if (findingQuery.isError) {
    return (
      <ConsultingQueryError
        error={findingQuery.error}
        onRetry={() => findingQuery.refetch()}
        subject="this finding"
      />
    );
  }
  if (parentQuery.isPending) return <WorkspaceSkeleton label="Loading finding…" />;
  if (parentQuery.isError) {
    return (
      <ConsultingQueryError
        error={parentQuery.error}
        onRetry={() => parentQuery.refetch()}
        subject="this finding"
      />
    );
  }

  return (
    <FindingWorkspaceContent
      audience={audience}
      finding={findingQuery.data}
      parent={parentQuery.data}
    />
  );
}

function FindingWorkspaceContent({
  audience,
  finding,
  parent,
}: {
  audience: OperationalAudience;
  finding: Finding;
  parent: Assessment;
}) {
  const [editing, setEditing] = useState(false);
  const canEdit = findingActionsFor(parent.status, finding.status).edit;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="-ml-2 flex flex-wrap gap-1">
        <Button asChild variant="ghost" size="sm">
          <Link href={assessmentHref(audience, parent.id)}>
            <ArrowLeft aria-hidden="true" /> Back to the assessment
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href={assessmentsHref(audience)}>All assessments</Link>
        </Button>
      </div>

      <ConsultingPageHeader
        eyebrow={
          <>
            <span className="font-mono">Finding · Ref {shortReference(finding.id)}</span> ·{" "}
            {CONSULTING_SERVICE_LABELS[parent.service]}
          </>
        }
        title={<span className="break-words">{finding.title}</span>}
        meta={
          <p className="text-sm text-muted-foreground">
            Recorded {formatConsultingDateTime(finding.createdAt)}
          </p>
        }
        actions={
          <>
            <SeverityBadge severity={finding.severity} />
            <FindingStatusBadge status={finding.status} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <aside className="order-first space-y-6 lg:order-last lg:sticky lg:top-6 lg:self-start">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading icon={Route} title="Status commands" />
            </CardHeader>
            <CardContent>
              <FindingActions audience={audience} finding={finding} parent={parent} />
            </CardContent>
          </Card>

          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading icon={ScanSearch} title="Finding record" />
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4">
                <DetailItem label="Assessment">
                  <span className="flex flex-wrap items-center gap-2">
                    <Link
                      href={assessmentHref(audience, parent.id)}
                      className="font-mono text-[0.8rem] underline-offset-4 hover:underline"
                    >
                      Ref {shortReference(parent.id)}
                    </Link>
                    <AssessmentStatusBadge status={parent.status} />
                  </span>
                </DetailItem>
                {/* D-2: resolvedAt describes only the current RESOLVED state. */}
                {finding.status === "RESOLVED" && finding.resolvedAt && (
                  <DetailItem label="Resolved">
                    {formatConsultingDateTime(finding.resolvedAt)}
                  </DetailItem>
                )}
                <DetailItem label="Last updated">
                  {formatConsultingDateTime(finding.updatedAt)}
                </DetailItem>
              </dl>
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading
                icon={FileSearch}
                title={editing ? "Edit finding" : "Finding details"}
                description={
                  editing
                    ? "Only changed fields are sent. Status changes use the commands alongside."
                    : undefined
                }
                action={
                  canEdit && !editing ? (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                      <Pencil aria-hidden="true" /> Edit
                    </Button>
                  ) : undefined
                }
              />
            </CardHeader>
            <CardContent>
              {editing ? (
                <EditFindingForm
                  audience={audience}
                  finding={finding}
                  parent={parent}
                  onClose={() => setEditing(false)}
                />
              ) : (
                <FindingDetails finding={finding} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FindingDetails({ finding }: { finding: Finding }) {
  return (
    <div className="space-y-6">
      <TextSection title="Technical description" value={finding.description} />
      <TextSection title="Evidence summary" value={finding.evidenceSummary} />
      <TextSection title="Recommendation" value={finding.recommendation} />
    </div>
  );
}

function TextSection({ title, value }: { title: string; value: string | null }) {
  return (
    <section className="border-t pt-5 first:border-t-0 first:pt-0">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      {value ? (
        <p className="mt-1.5 text-sm leading-6 break-words whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="mt-1.5 text-sm text-muted-foreground">Not recorded.</p>
      )}
    </section>
  );
}
