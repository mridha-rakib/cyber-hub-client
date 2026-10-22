"use client";

import { ArrowRight, ClipboardList, FileText, Gauge, ListChecks, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  CONSULTING_SERVICE_LABELS,
  formatConsultingDate,
} from "@/features/consulting/consulting-labels";
import {
  ConsultingPageHeader,
  ConsultingQueryError,
  RequestListSkeleton,
  SectionHeading,
} from "@/features/consulting/consulting-ui";
import { AssessmentStatusBadge } from "@/features/security-work/security-work-status";
import { useBusinessSecurityDashboard } from "@/hooks/use-business-security";
import type { SecurityDashboardView } from "@/types/business-security";
import {
  businessSecurityHref,
  ClientFindingItem,
  RiskCounts,
  ScoreSnapshot,
  ScoreUnavailable,
  ViewAllLink,
} from "./business-security-ui";

const cardSpacing = "gap-5 py-5 [--card-spacing:--spacing(5)]";

/** UI-BIZ-011 — renders exactly the four SecurityDashboardView sections (D6C-1). */
export function SecurityDashboard() {
  const query = useBusinessSecurityDashboard();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <ConsultingPageHeader
        title="Security"
        description="Your organisation's current security picture, based on reports released to you."
      />
      {query.isPending ? (
        <RequestListSkeleton rows={4} label="Loading your security dashboard…" />
      ) : query.isError ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="your security dashboard"
        />
      ) : (
        <DashboardBody dashboard={query.data} />
      )}
    </div>
  );
}

function DashboardBody({ dashboard }: { dashboard: SecurityDashboardView }) {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className={cardSpacing}>
          <CardHeader className="border-b">
            <SectionHeading
              icon={Gauge}
              title="Current security score"
              action={<ViewAllLink href={businessSecurityHref.scores}>Score history</ViewAllLink>}
            />
          </CardHeader>
          <CardContent>
            {dashboard.currentScore ? (
              <ScoreSnapshot score={dashboard.currentScore} />
            ) : (
              <ScoreUnavailable />
            )}
          </CardContent>
        </Card>

        <Card className={cardSpacing}>
          <CardHeader className="border-b">
            <SectionHeading
              icon={ShieldCheck}
              title="Current open risks"
              description="Open and in-remediation findings from currently released reports."
            />
          </CardHeader>
          <CardContent>
            <RiskCounts counts={dashboard.openRiskCounts} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className={cardSpacing}>
          <CardHeader className="border-b">
            <SectionHeading
              icon={ListChecks}
              title="Recommended actions"
              description="The highest-severity open findings from currently released reports."
              action={<ViewAllLink href={businessSecurityHref.findings}>All findings</ViewAllLink>}
            />
          </CardHeader>
          <CardContent>
            {dashboard.recommendedActions.length === 0 ? (
              <EmptyState
                className="min-h-0 py-6"
                title="No recommended actions"
                description="Actions appear here when a released report includes open findings."
              />
            ) : (
              <ul className="-mx-4 divide-y">
                {dashboard.recommendedActions.map((finding) => (
                  <ClientFindingItem key={finding.id} finding={finding} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className={cardSpacing}>
          <CardHeader className="border-b">
            <SectionHeading
              icon={ClipboardList}
              title="Recent assessments"
              action={
                <ViewAllLink href={businessSecurityHref.assessments}>All assessments</ViewAllLink>
              }
            />
          </CardHeader>
          <CardContent>
            {dashboard.recentAssessments.length === 0 ? (
              <EmptyState
                className="min-h-0 py-6"
                title="No assessments yet"
                description="Assessments appear here once a consulting request becomes an assessment."
              />
            ) : (
              <ul className="-mx-4 divide-y">
                {dashboard.recentAssessments.map((assessment) => (
                  <li key={assessment.id}>
                    <Link
                      href={businessSecurityHref.assessment(assessment.id)}
                      className="flex items-center justify-between gap-3 px-4 py-3 outline-none hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
                    >
                      <span className="min-w-0">
                        <span className="block font-medium">
                          {CONSULTING_SERVICE_LABELS[assessment.service]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Created {formatConsultingDate(assessment.createdAt)}
                        </span>
                      </span>
                      <AssessmentStatusBadge status={assessment.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Button asChild variant="outline" className="self-start">
        <Link href={businessSecurityHref.reports}>
          <FileText aria-hidden="true" /> Released reports <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </>
  );
}

/** UI-BIZ-001 security summary on the existing Business landing page. */
export function SecuritySummaryModule() {
  const query = useBusinessSecurityDashboard();
  return (
    <Card className={`max-w-4xl ${cardSpacing}`}>
      <CardHeader className="border-b">
        <SectionHeading
          icon={ShieldCheck}
          title="Security"
          description="Your current score and open risks from released reports."
          action={
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href={businessSecurityHref.dashboard}>
                Open Security <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {query.isPending ? (
          <RequestListSkeleton rows={1} label="Loading security summary…" />
        ) : query.isError ? (
          <ConsultingQueryError
            error={query.error}
            onRetry={() => query.refetch()}
            subject="your security summary"
          />
        ) : (
          <>
            {query.data.currentScore ? (
              <ScoreSnapshot score={query.data.currentScore} heading="Current security score" />
            ) : (
              <ScoreUnavailable />
            )}
            <RiskCounts counts={query.data.openRiskCounts} />
          </>
        )}
        <Button asChild variant="outline" size="sm" className="sm:hidden">
          <Link href={businessSecurityHref.dashboard}>
            Open Security <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
