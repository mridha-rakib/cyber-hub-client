"use client";

import { Ban, CheckCheck, CirclePlay, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmPanel } from "@/features/consulting/lifecycle-actions";
import type { OperationalAudience } from "@/hooks/use-consulting";
import {
  type AssessmentTransitionInput,
  useAssessmentTransition,
  useRefreshAssessment,
} from "@/hooks/use-security-work";
import { showNotification } from "@/stores/notification.store";
import type { Assessment } from "@/types/security-work";
import { describeSecurityWorkError, type SecurityWorkFailure } from "./security-work-errors";
import { ASSESSMENT_STATUS_MEANING, assessmentsHref } from "./security-work-labels";
import { assessmentActionsFor } from "./security-work-rules";
import { FailureAlert, ReasonCommandPanel } from "./security-work-ui";

type Pending = "start" | "complete" | "cancel";

const SUCCESS_MESSAGES: Record<Pending, string> = {
  start: "Assessment started.",
  complete: "Assessment completed.",
  cancel: "Assessment cancelled.",
};

const ACTION_COPY: Record<Pending, string> = {
  start: "start this assessment",
  complete: "complete this assessment",
  cancel: "cancel this assessment",
};

/**
 * CMP-026 AssessmentActionBar (UI-CON-005 / UI-ADM-022): only the next valid
 * WF-ASM commands, each confirmed and sent with the `stateVersion` from the
 * latest server read. Cancel (API-ASM-006) is offered to Admin only.
 */
export function AssessmentActions({
  audience,
  assessment,
}: {
  audience: OperationalAudience;
  assessment: Assessment;
}) {
  const transition = useAssessmentTransition(audience, assessment.id);
  const refreshAssessment = useRefreshAssessment(audience, assessment.id);
  const [confirming, setConfirming] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);
  const actions = assessmentActionsFor(assessment.status, audience);
  const pending = transition.isPending;

  const run = async (input: AssessmentTransitionInput) => {
    setFailure(null);
    try {
      await transition.mutateAsync(input);
      setConfirming(null);
      if (input.command === "cancel") setReason("");
      showNotification({ type: "success", message: SUCCESS_MESSAGES[input.command] });
    } catch (error) {
      const next = describeSecurityWorkError(error, {
        subject: "assessment",
        action: ACTION_COPY[input.command],
        preserved: input.command === "cancel" ? "Your reason has been kept." : undefined,
      });
      setFailure(next);
      if (next.refresh) {
        // Close the confirmation so the user re-reviews the refreshed state
        // before deciding again; a typed reason stays in state.
        setConfirming(null);
        await refreshAssessment();
      }
    }
  };

  const open = (next: Pending) => {
    setFailure(null);
    setReasonError(null);
    setConfirming(next);
  };

  const submitCancel = () => {
    if (!reason.trim()) {
      setReasonError("Give a reason for cancelling this assessment.");
      return;
    }
    setReasonError(null);
    void run({
      command: "cancel",
      expectedStateVersion: assessment.stateVersion,
      reason: reason.trim(),
    });
  };

  const terminal = assessment.status === "COMPLETED" || assessment.status === "CANCELLED";

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        {ASSESSMENT_STATUS_MEANING[assessment.status]}
      </p>

      {terminal && (
        <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
          <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          No further assessment lifecycle actions.
        </p>
      )}

      {actions.start &&
        (confirming === "start" ? (
          <ConfirmPanel
            title="Start this assessment?"
            confirmLabel={pending ? "Starting…" : "Confirm start"}
            pending={pending}
            onConfirm={() =>
              run({ command: "start", expectedStateVersion: assessment.stateVersion })
            }
            onCancel={() => setConfirming(null)}
          >
            <p>
              Starting permits assessment activity within the authorised scope. The server re-checks
              the current scope authorisation and your assignment when you confirm.
            </p>
          </ConfirmPanel>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={pending || confirming !== null}
            onClick={() => open("start")}
          >
            <CirclePlay aria-hidden="true" /> Start assessment
          </Button>
        ))}

      {actions.complete &&
        (confirming === "complete" ? (
          <ConfirmPanel
            title="Complete this assessment?"
            confirmLabel={pending ? "Completing…" : "Confirm completion"}
            pending={pending}
            onConfirm={() =>
              run({ command: "complete", expectedStateVersion: assessment.stateVersion })
            }
            onCancel={() => setConfirming(null)}
          >
            <p>
              Completion is final: no new findings can be recorded and finding details become
              locked. Remediation, resolution and reopening of findings remain available.
            </p>
          </ConfirmPanel>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={pending || confirming !== null}
            onClick={() => open("complete")}
          >
            <CheckCheck aria-hidden="true" /> Complete assessment
          </Button>
        ))}

      {actions.cancel &&
        (confirming === "cancel" ? (
          <ReasonCommandPanel
            title="Cancel this assessment?"
            label="Reason for cancelling"
            help="Required. Recorded with the decision for audit purposes. Cancellation is final and freezes every finding on this assessment."
            value={reason}
            onChange={setReason}
            error={reasonError}
            confirmLabel="Confirm cancellation"
            pendingLabel="Cancelling…"
            pending={pending}
            destructive
            dismissLabel="Keep assessment"
            onConfirm={submitCancel}
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
            onClick={() => open("cancel")}
          >
            <Ban aria-hidden="true" /> Cancel assessment
          </Button>
        ))}

      {failure && (
        <FailureAlert
          failure={failure}
          onRefresh={refreshAssessment}
          backHref={assessmentsHref(audience)}
          backLabel="Back to assessments"
        />
      )}
    </div>
  );
}
