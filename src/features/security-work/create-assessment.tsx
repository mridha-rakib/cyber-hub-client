"use client";

import { ArrowRight, ClipboardPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmPanel } from "@/features/consulting/lifecycle-actions";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { useCreateAssessment } from "@/hooks/use-security-work";
import { showNotification } from "@/stores/notification.store";
import type { ConsultingRequestDetail } from "@/types/consulting";
import { describeSecurityWorkError, type SecurityWorkFailure } from "./security-work-errors";
import { assessmentHref, assessmentsHref } from "./security-work-labels";
import { FailureAlert } from "./security-work-ui";

/**
 * API-ASM-001 entry from the accepted request context (UI-CON-005 /
 * UI-ADM-022 "create assessment from accepted request context"). The body is
 * empty by contract: the server derives the business, service, current scope
 * authorisation, assigned consultant, initial status and version from the
 * request, so nothing here can choose or override them.
 */
export function CreateAssessmentAction({
  audience,
  request,
  onRefresh,
}: {
  audience: OperationalAudience;
  request: ConsultingRequestDetail;
  onRefresh: () => Promise<unknown>;
}) {
  const router = useRouter();
  const mutation = useCreateAssessment(audience, request.id);
  const [confirming, setConfirming] = useState(false);
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);

  if (request.status !== "ACCEPTED") {
    return (
      <div className="space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          {request.status === "SUBMITTED" || request.status === "UNDER_REVIEW"
            ? "An assessment can be created once this request is accepted."
            : request.status === "DECLINED"
              ? "This request was declined, so no assessment can be created."
              : "Assessments are created while a request is accepted. Existing assessments are listed under Assessments."}
        </p>
        {request.status !== "DECLINED" && (
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href={assessmentsHref(audience)}>
              View assessments <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        )}
      </div>
    );
  }

  // Usability hints only — the server is the authority on both conditions.
  const blocker = !request.currentAuthorization
    ? "The Business must confirm a current scope authorisation before an assessment can be created."
    : audience === "admin" && !request.assignedConsultantId
      ? "Assign a consultant before creating an assessment."
      : null;

  const create = async () => {
    setFailure(null);
    try {
      const created = await mutation.mutateAsync();
      showNotification({ type: "success", message: "Assessment created." });
      router.push(assessmentHref(audience, created.id));
    } catch (error) {
      const next = describeSecurityWorkError(error, {
        subject: "request",
        action: "create the assessment",
      });
      setFailure(next);
      if (next.refresh) {
        setConfirming(false);
        await onRefresh();
      }
    }
  };

  return (
    <div className="space-y-4">
      {blocker ? (
        <p className="text-sm leading-6 text-muted-foreground">{blocker}</p>
      ) : confirming ? (
        <ConfirmPanel
          title="Create an assessment?"
          confirmLabel={mutation.isPending ? "Creating assessment…" : "Confirm create assessment"}
          pending={mutation.isPending}
          onConfirm={create}
          onCancel={() => setConfirming(false)}
        >
          <p>
            Creates a planned assessment for this request. The service, business, authorised scope
            and assigned consultant are taken from the request by the server.
          </p>
          <p className="font-medium text-foreground">
            Testing does not start until the assessment itself is started.
          </p>
        </ConfirmPanel>
      ) : (
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          disabled={mutation.isPending}
          onClick={() => {
            setFailure(null);
            setConfirming(true);
          }}
        >
          <ClipboardPlus aria-hidden="true" /> Create assessment
        </Button>
      )}
      {failure && (
        <FailureAlert
          failure={failure}
          onRefresh={onRefresh}
          backHref={audience === "admin" ? "/admin/consulting" : "/consultant/requests"}
          backLabel="Back to the queue"
        />
      )}
    </div>
  );
}
