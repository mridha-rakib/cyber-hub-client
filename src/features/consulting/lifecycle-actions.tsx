"use client";

import {
  AlertTriangle,
  CheckCheck,
  CircleCheck,
  CirclePlay,
  CircleX,
  Lock,
  RefreshCw,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type OperationalAudience,
  useConsultingTransition,
  useDeclineConsultingRequest,
} from "@/hooks/use-consulting";
import { isApiError } from "@/lib/errors/api-error";
import { consultingService } from "@/services/consulting.service";
import { showNotification } from "@/stores/notification.store";
import type { ConsultingRequestDetail, ConsultingTransitionAction } from "@/types/consulting";
import { describeConsultingError } from "./consulting-errors";
import { CONSULTING_STATUS_OPERATIONAL_MEANING } from "./consulting-labels";

type Failure = {
  title: string;
  description: string;
  /** Offer a controlled reload — never an automatic replay of the command. */
  refresh?: boolean;
  /** The request is no longer visible to this user. */
  unavailable?: boolean;
};

const SUCCESS_MESSAGES: Record<ConsultingTransitionAction, string> = {
  "start-review": "Review started.",
  accept: "Request accepted.",
  "start-delivery": "Delivery started.",
  complete: "Request completed.",
};

/**
 * Explains a rejected command. The API deliberately answers an AUTH_SCOPE
 * denial on start-delivery with a non-disclosing 404, and a blocked
 * completion with the same 409 as a stale version — so the request is
 * re-read (without touching the cache or replaying the command) to tell
 * the user which situation they are in.
 */
async function explainFailure(
  error: unknown,
  action: ConsultingTransitionAction | "decline",
  request: ConsultingRequestDetail,
): Promise<Failure> {
  const status = isApiError(error) ? error.status : undefined;

  if (
    (action === "start-delivery" && status === 404) ||
    (action === "complete" && status === 409)
  ) {
    let latest: ConsultingRequestDetail | null = null;
    try {
      latest = await consultingService.getOperational(request.id);
    } catch {
      latest = null;
    }
    if (!latest) {
      return {
        title: "Request unavailable",
        description:
          "This request is no longer available to you. It may have been reassigned to someone else.",
        unavailable: true,
      };
    }
    const unchanged = latest.stateVersion === request.stateVersion;
    if (action === "start-delivery" && unchanged) {
      return {
        title: "Delivery needs a current scope authorisation",
        description:
          "The server did not find a current, valid scope authorisation from the Business for this request — none may be confirmed yet, or it may not be in effect yet or may have ended. Ask the Business to confirm the scope, then try again.",
        refresh: true,
      };
    }
    if (action === "complete" && unchanged && latest.status === "IN_PROGRESS") {
      return {
        title: "Completion is blocked",
        description:
          "This request can only be completed once its linked delivery work exists and is complete. It stays in progress until then.",
      };
    }
    return {
      title: "This request has changed",
      description:
        "The request changed since you opened it. Refresh the latest state before continuing.",
      refresh: true,
    };
  }

  const copy = describeConsultingError(error, {
    action: "update this request",
    preserved: action === "decline" ? "Your reason is still here." : undefined,
  });
  return { title: copy.title, description: copy.description, refresh: copy.conflict };
}

/** UI-CON-003 / UI-ADM-020 lifecycle bar: only the next valid WF-REQ commands. */
export function ConsultingLifecycleActions({
  audience,
  request,
  onRefresh,
}: {
  audience: OperationalAudience;
  request: ConsultingRequestDetail;
  onRefresh: () => Promise<unknown>;
}) {
  const ids = useId();
  const transition = useConsultingTransition(audience, request.id);
  const decline = useDeclineConsultingRequest(audience, request.id);
  const [confirming, setConfirming] = useState<"start-delivery" | "complete" | "decline" | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const pending = transition.isPending || decline.isPending;

  useEffect(() => {
    if (confirming === "decline") reasonRef.current?.focus();
  }, [confirming]);

  const run = async (action: ConsultingTransitionAction) => {
    setFailure(null);
    try {
      await transition.mutateAsync({ action, expectedStateVersion: request.stateVersion });
      setConfirming(null);
      showNotification({ type: "success", message: SUCCESS_MESSAGES[action] });
    } catch (error) {
      setFailure(await explainFailure(error, action, request));
    }
  };

  const submitDecline = async () => {
    setFailure(null);
    if (!reason.trim()) {
      setReasonError("Give a reason for declining this request.");
      reasonRef.current?.focus();
      return;
    }
    setReasonError(null);
    try {
      await decline.mutateAsync({
        expectedStateVersion: request.stateVersion,
        reason: reason.trim(),
      });
      setReason("");
      setConfirming(null);
      showNotification({ type: "success", message: "Request declined." });
    } catch (error) {
      setFailure(await explainFailure(error, "decline", request));
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      setFailure(null);
    } finally {
      setRefreshing(false);
    }
  };

  const terminal = request.status === "DECLINED" || request.status === "COMPLETED";

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        {CONSULTING_STATUS_OPERATIONAL_MEANING[request.status]}
      </p>

      {terminal && (
        <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm">
          <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          Read-only — no further lifecycle actions.
        </p>
      )}

      {request.status === "SUBMITTED" && (
        <Button size="lg" className="w-full" disabled={pending} onClick={() => run("start-review")}>
          <Search aria-hidden="true" />
          {transition.isPending ? "Starting review…" : "Start review"}
        </Button>
      )}

      {request.status === "UNDER_REVIEW" && confirming !== "decline" && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <Button size="lg" disabled={pending} onClick={() => run("accept")}>
            <CircleCheck aria-hidden="true" />
            {transition.isPending ? "Accepting…" : "Accept"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setFailure(null);
              setConfirming("decline");
            }}
          >
            <CircleX aria-hidden="true" /> Decline
          </Button>
        </div>
      )}

      {request.status === "UNDER_REVIEW" && confirming === "decline" && (
        <div className="space-y-3 rounded-xl border p-4">
          <div className="space-y-1">
            <Label htmlFor={`${ids}-reason`}>Reason for declining</Label>
            <p id={`${ids}-reason-help`} className="text-xs leading-5 text-muted-foreground">
              Recorded with the decision for audit purposes.
            </p>
          </div>
          <Textarea
            ref={reasonRef}
            id={`${ids}-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            aria-invalid={Boolean(reasonError)}
            aria-describedby={`${ids}-reason-help${reasonError ? ` ${ids}-reason-error` : ""}`}
            className="min-h-24"
          />
          {reasonError && (
            <p id={`${ids}-reason-error`} className="text-sm text-destructive" role="alert">
              {reasonError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" disabled={pending} onClick={submitDecline}>
              {decline.isPending ? "Declining…" : "Confirm decline"}
            </Button>
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setConfirming(null);
                setReason("");
                setReasonError(null);
                setFailure(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {request.status === "ACCEPTED" &&
        (confirming === "start-delivery" ? (
          <ConfirmPanel
            title="Start delivery?"
            confirmLabel={transition.isPending ? "Starting delivery…" : "Confirm start delivery"}
            pending={pending}
            onConfirm={() => run("start-delivery")}
            onCancel={() => setConfirming(null)}
          >
            <p>
              Technical delivery requires a current explicit scope authorisation from the Business.
              The server checks this when you confirm — assignment and acceptance alone are not
              authorisation.
            </p>
            <p className="font-medium text-foreground">
              {request.currentAuthorization
                ? `Recorded scope: version ${request.currentAuthorization.versionNo} (see Authorised scope).`
                : "No current scope authorisation is recorded for this request."}
            </p>
          </ConfirmPanel>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() => {
              setFailure(null);
              setConfirming("start-delivery");
            }}
          >
            <CirclePlay aria-hidden="true" /> Start delivery
          </Button>
        ))}

      {request.status === "IN_PROGRESS" &&
        (confirming === "complete" ? (
          <ConfirmPanel
            title="Complete this request?"
            confirmLabel={transition.isPending ? "Completing…" : "Confirm completion"}
            pending={pending}
            onConfirm={() => run("complete")}
            onCancel={() => setConfirming(null)}
          >
            <p>
              Completion is final. The server only allows it once the request's linked delivery work
              is complete.
            </p>
          </ConfirmPanel>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={pending}
            onClick={() => {
              setFailure(null);
              setConfirming("complete");
            }}
          >
            <CheckCheck aria-hidden="true" /> Complete request
          </Button>
        ))}

      {failure && (
        <Alert variant="destructive" className="gap-1 rounded-xl px-4 py-3.5">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>{failure.title}</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{failure.description}</p>
            {failure.refresh && (
              <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
                <RefreshCw aria-hidden="true" className={refreshing ? "animate-spin" : undefined} />
                {refreshing ? "Refreshing…" : "Refresh latest state"}
              </Button>
            )}
            {failure.unavailable && (
              <Button asChild size="sm" variant="outline">
                <Link href={audience === "admin" ? "/admin/consulting" : "/consultant/requests"}>
                  Back to the queue
                </Link>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function ConfirmPanel({
  title,
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
  children,
}: {
  title: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={title} className="space-y-3 rounded-xl border p-4">
      <h3 className="font-medium">{title}</h3>
      <div className="space-y-2 text-sm leading-6 text-muted-foreground">{children}</div>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button disabled={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </section>
  );
}
