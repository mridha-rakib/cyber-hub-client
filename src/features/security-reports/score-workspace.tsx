"use client";

import { ArrowLeft, ArrowRight, Calculator, Gauge, History, Info } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScoreSnapshot } from "@/features/business-security/business-security-ui";
import { CONSULTING_SERVICE_LABELS, shortReference } from "@/features/consulting/consulting-labels";
import {
  ConsultingPageHeader,
  ConsultingQueryError,
  RequestListSkeleton,
  SectionHeading,
  WorkspaceSkeleton,
} from "@/features/consulting/consulting-ui";
import {
  describeSecurityWorkError,
  type SecurityWorkFailure,
} from "@/features/security-work/security-work-errors";
import { assessmentHref } from "@/features/security-work/security-work-labels";
import { AssessmentStatusBadge } from "@/features/security-work/security-work-status";
import { FailureAlert } from "@/features/security-work/security-work-ui";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { useAssessmentScores, useCalculateScore } from "@/hooks/use-security-reports";
import { useAssessment } from "@/hooks/use-security-work";
import { showNotification } from "@/stores/notification.store";
import type { Assessment } from "@/types/security-work";
import { scoreWorkspaceHref } from "./report-rules";

const cardSpacing = "gap-5 py-5 [--card-spacing:--spacing(5)]";

/** Assessment-workspace score panel (UI-CON-005 / UI-ADM-022): latest snapshot (API-SCR-002). */
export function ScorePanel({
  audience,
  assessment,
}: {
  audience: OperationalAudience;
  assessment: Assessment;
}) {
  const query = useAssessmentScores(audience, assessment.id, { limit: 1 });
  const latest = flattenCursorPages(query.data)[0];

  return (
    <div className="space-y-4">
      {query.isPending ? (
        <RequestListSkeleton rows={1} label="Loading score snapshots…" />
      ) : query.isError ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="score snapshots"
        />
      ) : latest ? (
        <ScoreSnapshot score={latest} heading="Latest score snapshot" />
      ) : (
        <p className="text-sm text-muted-foreground">No score snapshots yet.</p>
      )}
      <Button asChild variant="outline" size="sm">
        <Link href={scoreWorkspaceHref(audience, assessment.id)}>
          Open score workspace <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}

/** UI-CON-007 / UI-ADM-024 — score history and the methodology-gated calculation. */
export function ScoreWorkspace({
  audience,
  assessmentId,
}: {
  audience: OperationalAudience;
  assessmentId: string;
}) {
  const assessment = useAssessment(audience, assessmentId);

  if (assessment.isPending) return <WorkspaceSkeleton label="Loading assessment…" />;
  if (assessment.isError) {
    return (
      <ConsultingQueryError
        error={assessment.error}
        onRetry={() => assessment.refetch()}
        subject="this assessment"
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={assessmentHref(audience, assessmentId)}>
          <ArrowLeft aria-hidden="true" /> Back to assessment
        </Link>
      </Button>
      <ConsultingPageHeader
        eyebrow={
          <span className="font-mono">Assessment · Ref {shortReference(assessment.data.id)}</span>
        }
        title={`Security score · ${CONSULTING_SERVICE_LABELS[assessment.data.service]}`}
        actions={<AssessmentStatusBadge status={assessment.data.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <aside className="order-first lg:order-last">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading icon={Calculator} title="Calculate score" />
            </CardHeader>
            <CardContent>
              <CalculateScore audience={audience} assessmentId={assessmentId} />
            </CardContent>
          </Card>
        </aside>
        <Card className={`min-w-0 ${cardSpacing}`}>
          <CardHeader className="border-b">
            <SectionHeading
              icon={History}
              title="Score snapshots"
              description="Every snapshot recorded for this assessment, newest first."
            />
          </CardHeader>
          <CardContent>
            <ScoreHistory audience={audience} assessmentId={assessmentId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScoreHistory({
  audience,
  assessmentId,
}: {
  audience: OperationalAudience;
  assessmentId: string;
}) {
  const query = useAssessmentScores(audience, assessmentId, { limit: 10 });
  const scores = flattenCursorPages(query.data);

  if (query.isPending) return <RequestListSkeleton rows={2} label="Loading score snapshots…" />;
  if (query.isError && query.data === undefined) {
    return (
      <ConsultingQueryError
        error={query.error}
        onRetry={() => query.refetch()}
        subject="score snapshots"
      />
    );
  }
  if (scores.length === 0) {
    return (
      <EmptyState
        className="min-h-0 py-8"
        title="No score snapshots yet"
        description="Snapshots appear here once a score has been calculated with an approved methodology."
      />
    );
  }
  return (
    <div className="space-y-4">
      <ul className="divide-y">
        {scores.map((score) => (
          <li key={score.id} className="py-4 first:pt-0">
            <ScoreSnapshot score={score} />
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
    </div>
  );
}

/**
 * API-SCR-001 (D6D-2). While GAP-009 is open an authorised request answers
 * 409 SCORE_METHODOLOGY_NOT_CONFIGURED: the panel then shows "No methodology
 * configured" for as long as it is mounted, keeps the action disabled and
 * never retries or fabricates a score. There is no methodology-status call.
 */
function CalculateScore({
  audience,
  assessmentId,
}: {
  audience: OperationalAudience;
  assessmentId: string;
}) {
  const ids = useId();
  const mutation = useCalculateScore(audience, assessmentId);
  const [methodologyVersion, setMethodologyVersion] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  const submit = async () => {
    setFailure(null);
    if (!methodologyVersion.trim()) {
      setInputError("Enter the approved methodology version.");
      return;
    }
    setInputError(null);
    try {
      await mutation.mutateAsync(methodologyVersion.trim());
      showNotification({ type: "success", message: "Score snapshot recorded." });
      setMethodologyVersion("");
    } catch (error) {
      const next = describeSecurityWorkError(error, {
        subject: "score",
        action: "calculate the score",
      });
      if (next.kind === "methodology-unavailable") setUnavailable(true);
      else setFailure(next);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        A score is calculated by the platform from an approved methodology version. Numeric scores
        are never entered by hand.
      </p>
      {unavailable && (
        <div className="flex items-start gap-3 rounded-xl bg-muted/60 p-3.5" role="status">
          <Gauge className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="space-y-1 text-sm">
            <p id={`${ids}-unavailable`} className="font-medium">
              No methodology configured
            </p>
            <p className="text-muted-foreground">
              An approved scoring methodology isn&apos;t configured yet, so no score was calculated.
              Existing snapshots stay available.
            </p>
          </div>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor={`${ids}-methodology`}>Methodology version</Label>
        <Input
          id={`${ids}-methodology`}
          value={methodologyVersion}
          onChange={(event) => setMethodologyVersion(event.target.value)}
          disabled={unavailable || mutation.isPending}
          aria-invalid={Boolean(inputError)}
          aria-describedby={inputError ? `${ids}-methodology-error` : undefined}
        />
        {inputError && (
          <p id={`${ids}-methodology-error`} className="text-sm text-destructive" role="alert">
            {inputError}
          </p>
        )}
      </div>
      <Button
        className="w-full"
        disabled={unavailable || mutation.isPending}
        aria-describedby={unavailable ? `${ids}-unavailable` : undefined}
        onClick={submit}
      >
        <Calculator aria-hidden="true" />
        {mutation.isPending ? "Calculating…" : "Calculate score"}
      </Button>
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        Requires a current authorised scope for this assessment.
      </p>
      {failure && <FailureAlert failure={failure} />}
    </div>
  );
}
