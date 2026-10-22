"use client";

import { Gauge } from "lucide-react";
import Link from "next/link";
import { formatConsultingDate } from "@/features/consulting/consulting-labels";
import { FINDING_SEVERITY_LABELS } from "@/features/security-work/security-work-labels";
import { FindingStatusBadge, SeverityBadge } from "@/features/security-work/security-work-status";
import { cn } from "@/lib/utils";
import {
  type FindingClientView,
  SCORE_CATEGORIES,
  type SecurityDashboardView,
  type SecurityScoreView,
} from "@/types/business-security";
import { FINDING_SEVERITIES } from "@/types/security-work";

export const BUSINESS_SECURITY_HREF = "/business/security";
export const businessSecurityHref = {
  dashboard: BUSINESS_SECURITY_HREF,
  assessments: `${BUSINESS_SECURITY_HREF}/assessments`,
  assessment: (id: string) => `${BUSINESS_SECURITY_HREF}/assessments/${id}`,
  findings: `${BUSINESS_SECURITY_HREF}/findings`,
  scores: `${BUSINESS_SECURITY_HREF}/scores`,
  reports: `${BUSINESS_SECURITY_HREF}/reports`,
  report: (id: string) => `${BUSINESS_SECURITY_HREF}/reports/${id}`,
};

/**
 * Score values are JSON numbers (D6C-3) shown as received: 87.5 stays 87.5,
 * a genuine 0 stays 0. Null is never passed here — callers render an
 * unavailable state instead.
 */
export function formatScore(value: number): string {
  return value.toLocaleString("en-GB", { maximumFractionDigits: 2 });
}

/** A simple 0-100 bar; no bands, grades or colour-coded risk levels. */
export function ScoreBar({ value }: { value: number | null }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
      {value !== null && (
        <div
          className="h-full rounded-full bg-foreground/60"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      )}
    </div>
  );
}

export function ScoreUnavailable({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex items-start gap-3 rounded-xl bg-muted/50 p-4", className)}
      role="status"
    >
      <Gauge className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">Security score unavailable</p>
        <p className="text-sm text-muted-foreground">
          A current score appears once a report including a scored assessment has been released to
          your organisation. This doesn&apos;t mean an assessment failed.
        </p>
      </div>
    </div>
  );
}

/** One score snapshot: overall plus the seven categories ("Not scored" for null). */
export function ScoreSnapshot({
  score,
  heading = "Overall score",
}: {
  score: SecurityScoreView;
  heading?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{heading}</p>
          <p className="text-3xl font-semibold tabular-nums">
            {formatScore(score.overallScore)}
            <span className="text-base font-normal text-muted-foreground"> / 100</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Calculated {formatConsultingDate(score.calculatedAt)} · Methodology{" "}
          <span className="font-mono">{score.methodologyVersion}</span>
        </p>
      </div>
      <ScoreBar value={score.overallScore} />
      <dl className="grid gap-3 sm:grid-cols-2">
        {SCORE_CATEGORIES.map(({ key, label }) => {
          const value = score[key];
          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="tabular-nums">
                  {value === null ? (
                    <span className="text-muted-foreground">Not scored</span>
                  ) : (
                    formatScore(value)
                  )}
                </dd>
              </div>
              <ScoreBar value={value} />
            </div>
          );
        })}
      </dl>
    </div>
  );
}

/** The four current open-risk counts (CRITICAL..LOW), each labelled in text. */
export function RiskCounts({ counts }: { counts: SecurityDashboardView["openRiskCounts"] }) {
  return (
    <ul
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      aria-label="Current open risks by severity"
    >
      {FINDING_SEVERITIES.map((severity) => (
        <li key={severity} className="rounded-xl border p-3">
          <SeverityBadge severity={severity} />
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {counts[severity]}
            <span className="sr-only"> open {FINDING_SEVERITY_LABELS[severity]} findings</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

/** FindingClientView row: title, severity, live status, recommendation and dates. */
export function ClientFindingItem({ finding }: { finding: FindingClientView }) {
  return (
    <li className="space-y-2 px-4 py-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 font-medium break-words">{finding.title}</p>
        <div className="flex flex-wrap gap-1.5">
          <SeverityBadge severity={finding.severity} />
          <FindingStatusBadge status={finding.status} />
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">Recommended action</p>
        <p className="mt-0.5 text-sm whitespace-pre-wrap break-words">{finding.recommendation}</p>
      </div>
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>Recorded {formatConsultingDate(finding.createdAt)}</span>
        {finding.resolvedAt && <span>Resolved {formatConsultingDate(finding.resolvedAt)}</span>}
      </p>
    </li>
  );
}

export function ViewAllLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium underline-offset-4 hover:underline">
      {children}
    </Link>
  );
}
