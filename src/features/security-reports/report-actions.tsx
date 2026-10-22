"use client";

import { Archive, ClipboardCheck, Lock, Send, Undo2, Upload } from "lucide-react";
import { useId, useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { Button } from "@/components/ui/button";
import { formatConsultingDate } from "@/features/consulting/consulting-labels";
import { ConsultingQueryError, RequestListSkeleton } from "@/features/consulting/consulting-ui";
import { ConfirmPanel } from "@/features/consulting/lifecycle-actions";
import {
  describeSecurityWorkError,
  type SecurityWorkFailure,
} from "@/features/security-work/security-work-errors";
import { FailureAlert, ReasonCommandPanel } from "@/features/security-work/security-work-ui";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import {
  type ReportTransitionInput,
  useAssessmentReports,
  useRefreshReport,
  useReportTransition,
} from "@/hooks/use-security-reports";
import { showNotification } from "@/stores/notification.store";
import type { OperationalReport } from "@/types/security-report";
import type { AssessmentStatus } from "@/types/security-work";
import { analyseDraftContent, hasNarrativeText } from "./report-content";
import {
  markReadyParentLockReason,
  REPORT_STATUS_MEANING,
  reportActionsFor,
  submitParentLockReason,
} from "./report-rules";

type Pending = "submit" | "ready" | "return" | "supersede";

const SUCCESS: Record<ReportTransitionInput["command"], string> = {
  "submit-review": "Report submitted for review.",
  "mark-ready": "Report marked ready for release.",
  "return-to-draft": "Report returned to draft.",
  supersede: "Report superseded.",
};

const ACTION_COPY: Record<ReportTransitionInput["command"], string> = {
  "submit-review": "submit this report for review",
  "mark-ready": "mark this report ready for release",
  "return-to-draft": "return this report to draft",
  supersede: "supersede this report",
};

function LockNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
      <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Report workflow actions (API-RPT-005/006/007, disabled API-RPT-008,
 * API-RPT-009). Only actions the actor may take in the current state are
 * offered; each sends the loaded stateVersion and, on a conflict, the report
 * is re-read for the user to review — never resubmitted automatically.
 */
export function ReportActions({
  audience,
  report,
  parentStatus,
  unsavedChanges,
}: {
  audience: OperationalAudience;
  report: OperationalReport;
  parentStatus: AssessmentStatus | undefined;
  unsavedChanges: boolean;
}) {
  const releaseReasonId = useId();
  const transition = useReportTransition(audience, report.id);
  const refreshReport = useRefreshReport(audience, report.id);
  const [confirming, setConfirming] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);
  const actions = reportActionsFor(report.status, audience);
  const pending = transition.isPending;

  const hasText = hasNarrativeText(analyseDraftContent(report.draftContent).values);
  const hasFindings = report.includedFindings.length > 0;
  const submitBlocker = unsavedChanges
    ? "Save or discard your unsaved changes before submitting."
    : !hasText
      ? "Write and save at least one of Executive summary, Scope or Remediation plan before submitting."
      : !hasFindings
        ? "Include at least one finding before submitting."
        : submitParentLockReason(parentStatus);
  const readyBlocker =
    markReadyParentLockReason(parentStatus) ??
    (!hasText || !hasFindings
      ? "The report needs saved content and at least one included finding before it can be marked ready."
      : null);

  const run = async (input: ReportTransitionInput) => {
    setFailure(null);
    try {
      await transition.mutateAsync(input);
      setConfirming(null);
      if (input.command === "return-to-draft") setReason("");
      showNotification({ type: "success", message: SUCCESS[input.command] });
    } catch (error) {
      const next = describeSecurityWorkError(error, {
        subject: "report",
        action: ACTION_COPY[input.command],
        preserved: input.command === "return-to-draft" ? "Your reason has been kept." : undefined,
      });
      setFailure(next);
      if (next.refresh) {
        // Close the confirmation so the user re-reviews the refreshed report.
        setConfirming(null);
        await refreshReport();
      }
    }
  };

  const open = (next: Pending) => {
    setFailure(null);
    setReasonError(null);
    setConfirming(next);
  };

  const nothingToDo =
    !actions.submitReview &&
    !actions.markReady &&
    !actions.returnToDraft &&
    !actions.release &&
    !actions.supersede;

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        {REPORT_STATUS_MEANING[report.status]}
      </p>
      {nothingToDo && (
        <LockNote>No workflow actions are available to you for this report now.</LockNote>
      )}

      {actions.submitReview &&
        (submitBlocker ? (
          <LockNote>{submitBlocker}</LockNote>
        ) : confirming === "submit" ? (
          <ConfirmPanel
            title="Submit this report for review?"
            confirmLabel={pending ? "Submitting…" : "Confirm submission"}
            pending={pending}
            onConfirm={() =>
              run({ command: "submit-review", expectedStateVersion: report.stateVersion })
            }
            onCancel={() => setConfirming(null)}
          >
            <p>Content and included findings are locked while the report is in review.</p>
          </ConfirmPanel>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={pending || confirming !== null}
            onClick={() => open("submit")}
          >
            <Send aria-hidden="true" /> Submit for review
          </Button>
        ))}

      {actions.markReady &&
        (readyBlocker ? (
          <LockNote>{readyBlocker}</LockNote>
        ) : confirming === "ready" ? (
          <ConfirmPanel
            title="Mark this report ready for release?"
            confirmLabel={pending ? "Marking ready…" : "Confirm human review"}
            pending={pending}
            onConfirm={() =>
              run({ command: "mark-ready", expectedStateVersion: report.stateVersion })
            }
            onCancel={() => setConfirming(null)}
          >
            <p>
              Confirm you have reviewed the content and included findings. You are recorded as the
              reviewer; an Admin decides on release.
            </p>
          </ConfirmPanel>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={pending || confirming !== null}
            onClick={() => open("ready")}
          >
            <ClipboardCheck aria-hidden="true" /> Mark ready for release
          </Button>
        ))}

      {actions.returnToDraft &&
        (confirming === "return" ? (
          <ReasonCommandPanel
            title="Return this report to draft?"
            label="Reason for returning"
            help="Required. Recorded with the decision for audit purposes."
            value={reason}
            onChange={setReason}
            error={reasonError}
            confirmLabel="Return to draft"
            pendingLabel="Returning…"
            pending={pending}
            dismissLabel="Keep current state"
            onConfirm={() => {
              if (!reason.trim()) {
                setReasonError("Give a reason for returning this report to draft.");
                return;
              }
              setReasonError(null);
              void run({
                command: "return-to-draft",
                expectedStateVersion: report.stateVersion,
                reason: reason.trim(),
              });
            }}
            onCancel={() => {
              setConfirming(null);
              setReasonError(null);
            }}
          />
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={pending || confirming !== null}
            onClick={() => open("return")}
          >
            <Undo2 aria-hidden="true" /> Return to draft
          </Button>
        ))}

      {actions.release && (
        <div className="space-y-2">
          <Button
            size="lg"
            className="w-full"
            disabled
            aria-describedby={releaseReasonId}
            type="button"
          >
            <Upload aria-hidden="true" /> Release to client
          </Button>
          <p id={releaseReasonId} className="text-sm text-muted-foreground">
            Report file policy not configured.
          </p>
        </div>
      )}

      {actions.supersede &&
        (confirming === "supersede" ? (
          <SupersedePanel
            audience={audience}
            report={report}
            pending={pending}
            onConfirm={(replacementReportId) =>
              run({
                command: "supersede",
                expectedStateVersion: report.stateVersion,
                replacementReportId,
              })
            }
            onCancel={() => setConfirming(null)}
          />
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={pending || confirming !== null}
            onClick={() => open("supersede")}
          >
            <Archive aria-hidden="true" /> Supersede with a newer version
          </Button>
        ))}

      {failure && <FailureAlert failure={failure} onRefresh={refreshReport} />}
    </div>
  );
}

/**
 * API-RPT-009 replacement choice: a RELEASED report of the same assessment
 * with a higher version and no recorded predecessor. The API re-checks every
 * condition atomically.
 */
function SupersedePanel({
  audience,
  report,
  pending,
  onConfirm,
  onCancel,
}: {
  audience: OperationalAudience;
  report: OperationalReport;
  pending: boolean;
  onConfirm: (replacementReportId: string) => void;
  onCancel: () => void;
}) {
  const ids = useId();
  const query = useAssessmentReports(audience, report.assessmentId, {
    status: "RELEASED",
    limit: 25,
  });
  const candidates = flattenCursorPages(query.data).filter(
    (candidate) =>
      candidate.id !== report.id &&
      candidate.versionNo > report.versionNo &&
      candidate.supersedesReportId === null,
  );
  const [choice, setChoice] = useState<string | null>(null);

  return (
    <section aria-label="Supersede this report" className="space-y-3 rounded-xl border p-4">
      <h3 className="font-medium">Supersede this report</h3>
      <p className="text-sm text-muted-foreground">
        Choose the newer released version that replaces this one. This report stays available as
        history.
      </p>
      {query.isPending ? (
        <RequestListSkeleton rows={1} label="Loading released versions…" />
      ) : query.isError && query.data === undefined ? (
        <ConsultingQueryError
          error={query.error}
          onRetry={() => query.refetch()}
          subject="released versions"
        />
      ) : candidates.length === 0 && !query.hasNextPage ? (
        <p className="text-sm" role="status">
          No eligible replacement. A newer released version of this assessment&apos;s report, not
          already linked to another report, is required.
        </p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="sr-only">Replacement version</legend>
          {candidates.map((candidate) => (
            <label
              key={candidate.id}
              htmlFor={`${ids}-${candidate.id}`}
              className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <input
                id={`${ids}-${candidate.id}`}
                type="radio"
                name={`${ids}-replacement`}
                value={candidate.id}
                checked={choice === candidate.id}
                onChange={() => setChoice(candidate.id)}
                className="size-4"
              />
              Version {candidate.versionNo}
              {candidate.releasedAt && (
                <span className="text-muted-foreground">
                  · Released {formatConsultingDate(candidate.releasedAt)}
                </span>
              )}
            </label>
          ))}
          <LoadMore
            hasMore={Boolean(query.hasNextPage)}
            isLoading={query.isFetchingNextPage}
            isError={query.isFetchNextPageError}
            onLoadMore={() => query.fetchNextPage()}
            onRetry={() => query.fetchNextPage()}
          />
        </fieldset>
      )}
      <div className="flex flex-wrap gap-2">
        <Button disabled={pending || choice === null} onClick={() => choice && onConfirm(choice)}>
          {pending ? "Superseding…" : "Confirm supersede"}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
