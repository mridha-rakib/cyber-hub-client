"use client";

import { ArrowLeft, FileLock2, ListChecks, Route, UserRoundCheck } from "lucide-react";
import Link from "next/link";
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
import { useAssessment } from "@/hooks/use-security-work";
import type { Assessment } from "@/types/security-work";
import { AssessmentActions } from "./assessment-actions";
import { FindingsPanel } from "./finding-list";
import { assessmentsHref, requestWorkspaceHref } from "./security-work-labels";
import { AssessmentLifecycle, AssessmentStatusBadge } from "./security-work-status";
import { ScopeSnapshotSummary } from "./security-work-ui";

const cardSpacing = "gap-5 py-5 [--card-spacing:--spacing(5)]";

/**
 * UI-CON-005 (Consultant) and UI-ADM-022 (Admin) assessment workspace:
 * operational metadata, the scope snapshot, WF-ASM commands and the linked
 * findings. Score and report controls belong to Wave 6 and are not mounted.
 *
 * Any read failure (including a 404 after reassignment or a concealed
 * record) replaces the whole workspace, so no stale actions remain on screen.
 */
export function AssessmentWorkspace({
  audience,
  assessmentId,
}: {
  audience: OperationalAudience;
  assessmentId: string;
}) {
  const query = useAssessment(audience, assessmentId);

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

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={assessmentsHref(audience)}>
          <ArrowLeft aria-hidden="true" /> Back to assessments
        </Link>
      </Button>

      <ConsultingPageHeader
        eyebrow={
          <span className="font-mono">Assessment · Ref {shortReference(assessment.id)}</span>
        }
        title={CONSULTING_SERVICE_LABELS[assessment.service]}
        meta={
          <p className="text-sm text-muted-foreground">
            Created {formatConsultingDateTime(assessment.createdAt)}
          </p>
        }
        actions={<AssessmentStatusBadge status={assessment.status} />}
      />

      <Card className={cardSpacing}>
        <CardContent>
          <AssessmentLifecycle status={assessment.status} started={Boolean(assessment.startedAt)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <aside className="order-first space-y-6 lg:order-last lg:sticky lg:top-6 lg:self-start">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading icon={Route} title="Next step" />
            </CardHeader>
            <CardContent>
              <AssessmentActions audience={audience} assessment={assessment} />
            </CardContent>
          </Card>
          <AssessmentContextCard audience={audience} assessment={assessment} />
        </aside>

        <div className="min-w-0 space-y-6">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading
                icon={ListChecks}
                title="Findings"
                description="Security findings recorded on this assessment."
              />
            </CardHeader>
            <CardContent>
              <FindingsPanel audience={audience} assessment={assessment} />
            </CardContent>
          </Card>

          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading
                icon={FileLock2}
                title="Authorised scope at creation"
                description="Copied from the Business's explicit authorisation when this assessment was created. Read-only — the server re-checks the current authorisation on technical actions."
              />
            </CardHeader>
            <CardContent>
              <ScopeSnapshotSummary snapshot={assessment.scopeSnapshot} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AssessmentContextCard({
  audience,
  assessment,
}: {
  audience: OperationalAudience;
  assessment: Assessment;
}) {
  const notYet = <span className="text-muted-foreground">Not yet</span>;
  return (
    <Card className={cardSpacing}>
      <CardHeader className="border-b">
        <SectionHeading icon={UserRoundCheck} title="Assessment record" />
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4">
          <DetailItem label="Consulting request">
            <Link
              href={requestWorkspaceHref(audience, assessment.consultingRequestId)}
              className="font-mono text-[0.8rem] underline-offset-4 hover:underline"
            >
              Ref {shortReference(assessment.consultingRequestId)}
            </Link>
          </DetailItem>
          <DetailItem label="Assigned consultant">
            {audience === "admin" ? (
              <span className="font-mono text-[0.8rem] break-all">
                {assessment.assignedConsultantId}
              </span>
            ) : (
              "You"
            )}
          </DetailItem>
          <DetailItem label="Started">
            {formatConsultingDateTime(assessment.startedAt) ?? notYet}
          </DetailItem>
          {assessment.cancelledAt ? (
            <DetailItem label="Cancelled">
              {formatConsultingDateTime(assessment.cancelledAt)}
            </DetailItem>
          ) : (
            <DetailItem label="Completed">
              {formatConsultingDateTime(assessment.completedAt) ?? notYet}
            </DetailItem>
          )}
          <DetailItem label="Last updated">
            {formatConsultingDateTime(assessment.updatedAt)}
          </DetailItem>
        </dl>
      </CardContent>
    </Card>
  );
}
