"use client";

import { CircleCheck, Lock, RotateCcw, Wrench } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmPanel } from "@/features/consulting/lifecycle-actions";
import type { OperationalAudience } from "@/hooks/use-consulting";
import {
  type FindingTransitionInput,
  useFindingTransition,
  useRefreshFinding,
} from "@/hooks/use-security-work";
import { showNotification } from "@/stores/notification.store";
import type { Assessment, Finding } from "@/types/security-work";
import { describeSecurityWorkError, type SecurityWorkFailure } from "./security-work-errors";
import { assessmentHref } from "./security-work-labels";
import { findingActionsFor, findingLockReason } from "./security-work-rules";
import { FailureAlert, ReasonCommandPanel } from "./security-work-ui";

type Command = FindingTransitionInput["command"];

const SUCCESS_MESSAGES: Record<Command, string> = {
  "start-remediation": "Remediation started.",
  resolve: "Finding resolved.",
  reopen: "Finding reopened.",
};

const ACTION_COPY: Record<Command, string> = {
  "start-remediation": "start remediation",
  resolve: "resolve this finding",
  reopen: "reopen this finding",
};

/**
 * WF-FND-02..05 commands for UI-CON-006 / UI-ADM-023. Availability comes
 * from the shared D-3 rules (Admin included); every command carries the
 * finding's latest `stateVersion`. The resolve note and reopen reason are
 * kept separately so a rejected attempt never loses what was typed.
 */
export function FindingActions({
  audience,
  finding,
  parent,
}: {
  audience: OperationalAudience;
  finding: Finding;
  parent: Assessment;
}) {
  const transition = useFindingTransition(audience, finding.id);
  const refreshFinding = useRefreshFinding(audience);
  const [confirming, setConfirming] = useState<Command | null>(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);
  const actions = findingActionsFor(parent.status, finding.status);
  const lockReason = findingLockReason(parent.status, finding.status);
  const pending = transition.isPending;
  const anyCommand = actions.startRemediation || actions.resolve || actions.reopen;

  const run = async (input: FindingTransitionInput) => {
    setFailure(null);
    try {
      await transition.mutateAsync(input);
      setConfirming(null);
      if (input.command === "resolve") setVerificationNote("");
      if (input.command === "reopen") setReopenReason("");
      showNotification({ type: "success", message: SUCCESS_MESSAGES[input.command] });
    } catch (error) {
      const next = describeSecurityWorkError(error, {
        subject: "finding",
        action: ACTION_COPY[input.command],
        preserved:
          input.command === "resolve"
            ? "Your verification note has been kept."
            : input.command === "reopen"
              ? "Your reason has been kept."
              : undefined,
      });
      setFailure(next);
      if (next.refresh) {
        // Re-read the finding and its parent; the user re-opens the command
        // after reviewing the refreshed state rather than replaying it.
        setConfirming(null);
        await refreshFinding(finding);
      }
    }
  };

  const open = (next: Command) => {
    setFailure(null);
    setNoteError(null);
    setConfirming(next);
  };

  const submitWithNote = (command: "resolve" | "reopen") => {
    const value = (command === "resolve" ? verificationNote : reopenReason).trim();
    if (!value) {
      setNoteError(
        command === "resolve"
          ? "Describe how the remediation was verified."
          : "Give a reason for reopening this finding.",
      );
      return;
    }
    setNoteError(null);
    void run(
      command === "resolve"
        ? { command, expectedStateVersion: finding.stateVersion, verificationNote: value }
        : { command, expectedStateVersion: finding.stateVersion, reason: value },
    );
  };

  const busy = pending || confirming !== null;

  return (
    <div className="space-y-4">
      {lockReason && (
        <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>{lockReason}</span>
        </p>
      )}
      {!anyCommand && !lockReason && (
        <p className="text-sm text-muted-foreground">
          No status commands are available for this finding right now.
        </p>
      )}

      {actions.startRemediation &&
        (confirming === "start-remediation" ? (
          <ConfirmPanel
            title="Start remediation?"
            confirmLabel={pending ? "Starting remediation…" : "Confirm start remediation"}
            pending={pending}
            onConfirm={() =>
              run({ command: "start-remediation", expectedStateVersion: finding.stateVersion })
            }
            onCancel={() => setConfirming(null)}
          >
            <p>
              Marks the finding as being remediated. It still counts as an open risk until it is
              resolved.
            </p>
          </ConfirmPanel>
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => open("start-remediation")}
          >
            <Wrench aria-hidden="true" /> Start remediation
          </Button>
        ))}

      {actions.resolve &&
        (confirming === "resolve" ? (
          <ReasonCommandPanel
            title="Resolve this finding?"
            label="Verification note"
            help="Required. How the remediation was verified. Recorded in the audit trail; the resolution time is set by the server."
            value={verificationNote}
            onChange={setVerificationNote}
            error={noteError}
            confirmLabel="Confirm resolution"
            pendingLabel="Resolving…"
            pending={pending}
            onConfirm={() => submitWithNote("resolve")}
            onCancel={() => {
              setConfirming(null);
              setNoteError(null);
            }}
          />
        ) : (
          <Button size="lg" className="w-full" disabled={busy} onClick={() => open("resolve")}>
            <CircleCheck aria-hidden="true" /> Resolve finding
          </Button>
        ))}

      {actions.reopen &&
        (confirming === "reopen" ? (
          <ReasonCommandPanel
            title="Reopen this finding?"
            label="Reason for reopening"
            help="Required. Why the issue is active again — for example, it recurred or the verification no longer holds. Recorded in the audit trail."
            value={reopenReason}
            onChange={setReopenReason}
            error={noteError}
            confirmLabel="Confirm reopen"
            pendingLabel="Reopening…"
            pending={pending}
            onConfirm={() => submitWithNote("reopen")}
            onCancel={() => {
              setConfirming(null);
              setNoteError(null);
            }}
          />
        ) : (
          <Button
            size="lg"
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => open("reopen")}
          >
            <RotateCcw aria-hidden="true" /> Reopen finding
          </Button>
        ))}

      {failure && (
        <FailureAlert
          failure={failure}
          onRefresh={() => refreshFinding(finding)}
          backHref={assessmentHref(audience, parent.id)}
          backLabel="Back to the assessment"
        />
      )}
    </div>
  );
}
