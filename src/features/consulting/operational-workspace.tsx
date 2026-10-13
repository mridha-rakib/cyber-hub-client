"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  ClipboardCheck,
  FileLock2,
  Route,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreateAssessmentAction } from "@/features/security-work/create-assessment";
import {
  type OperationalAudience,
  useAssignConsultant,
  useOperationalRequest,
} from "@/hooks/use-consulting";
import { isApiError } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import { showNotification } from "@/stores/notification.store";
import type { ConsultingRequestDetail } from "@/types/consulting";
import { describeConsultingError } from "./consulting-errors";
import {
  CONSULTING_SERVICE_LABELS,
  companyNameOf,
  formatConsultingDateTime,
  shortReference,
} from "./consulting-labels";
import { ConsultingLifecycle, ConsultingStatusBadge } from "./consulting-status";
import {
  ConsultingPageHeader,
  ConsultingQueryError,
  DetailItem,
  RecordDetails,
  SectionHeading,
  WorkspaceSkeleton,
} from "./consulting-ui";
import { InternalNotesPanel } from "./internal-notes";
import { ConsultingLifecycleActions } from "./lifecycle-actions";
import { ScopeAuthorizationSummary } from "./scope-summary";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cardSpacing = "gap-5 py-5 [--card-spacing:--spacing(5)]";

/** UI-CON-003 (Consultant) and UI-ADM-020 (Admin) request workspace. */
export function OperationalWorkspace({
  audience,
  requestId,
}: {
  audience: OperationalAudience;
  requestId: string;
}) {
  const query = useOperationalRequest(audience, requestId);

  if (query.isPending) return <WorkspaceSkeleton />;
  if (query.isError) return <ConsultingQueryError error={query.error} onRetry={query.refetch} />;

  const request = query.data;
  const company = companyNameOf(request.companyDetails);
  const queueHref = audience === "admin" ? "/admin/consulting" : "/consultant/requests";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={queueHref}>
          <ArrowLeft aria-hidden="true" /> Back to the queue
        </Link>
      </Button>

      <ConsultingPageHeader
        eyebrow={
          <>
            <span className="font-mono">Ref {shortReference(request.id)}</span>
            {company && <> · {company}</>}
          </>
        }
        title={CONSULTING_SERVICE_LABELS[request.requestedService]}
        meta={
          <p className="text-sm text-muted-foreground">
            Submitted {formatConsultingDateTime(request.submittedAt)}
          </p>
        }
        actions={<ConsultingStatusBadge status={request.status} />}
      />

      <Card className={cardSpacing}>
        <CardContent>
          <ConsultingLifecycle status={request.status} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <aside className="order-first space-y-6 lg:order-last lg:sticky lg:top-6 lg:self-start">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading icon={Route} title="Next step" />
            </CardHeader>
            <CardContent>
              <ConsultingLifecycleActions
                audience={audience}
                request={request}
                onRefresh={query.refetch}
              />
            </CardContent>
          </Card>
          {request.status !== "DECLINED" && (
            <Card className={cardSpacing}>
              <CardHeader className="border-b">
                <SectionHeading icon={ClipboardCheck} title="Security assessment" />
              </CardHeader>
              <CardContent>
                <CreateAssessmentAction
                  audience={audience}
                  request={request}
                  onRefresh={query.refetch}
                />
              </CardContent>
            </Card>
          )}
          {audience === "admin" ? (
            <AssignmentCard request={request} />
          ) : (
            <Card size="sm" className="gap-2">
              <CardContent className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <UserRoundCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Assigned to you. Assignment gives you access to this request — not permission to
                test.
              </CardContent>
            </Card>
          )}
        </aside>

        <div className="min-w-0 space-y-6">
          <Card className={cardSpacing}>
            <CardHeader className="border-b">
              <SectionHeading
                icon={FileLock2}
                title="Authorised scope"
                description="The current explicit authorisation confirmed by the Business. Read-only."
              />
            </CardHeader>
            <CardContent>
              <ScopeAuthorizationSummary
                scope={request.currentAuthorization}
                audience="operational"
              />
            </CardContent>
          </Card>

          <RequestContextCard request={request} />

          <Card className={cardSpacing}>
            <CardContent>
              <InternalNotesPanel audience={audience} requestId={request.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RequestContextCard({ request }: { request: ConsultingRequestDetail }) {
  return (
    <Card className={cardSpacing}>
      <CardHeader className="border-b">
        <SectionHeading
          icon={BriefcaseBusiness}
          title="Request and business context"
          description="What the Business told us when submitting this request."
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <section aria-labelledby="concern-heading">
          <h3 id="concern-heading" className="text-xs font-medium text-muted-foreground">
            Security concern
          </h3>
          <p className="mt-1.5 text-sm leading-6 break-words whitespace-pre-wrap">
            {request.securityConcern}
          </p>
        </section>
        {request.businessImpact && (
          <section aria-labelledby="impact-heading">
            <h3 id="impact-heading" className="text-xs font-medium text-muted-foreground">
              Business impact
            </h3>
            <p className="mt-1.5 text-sm leading-6 break-words whitespace-pre-wrap">
              {request.businessImpact}
            </p>
          </section>
        )}

        <ContextGroup title="Company">
          <RecordDetails value={request.companyDetails} />
          <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-3">
            <DetailItem label="Business size">{request.businessSize}</DetailItem>
            <DetailItem label="Accepted">
              {formatConsultingDateTime(request.acceptedAt) ?? (
                <span className="text-muted-foreground">Not yet</span>
              )}
            </DetailItem>
            <DetailItem label="Completed">
              {formatConsultingDateTime(request.completedAt) ?? (
                <span className="text-muted-foreground">Not yet</span>
              )}
            </DetailItem>
          </dl>
        </ContextGroup>

        <ContextGroup
          title="Environment context"
          note="Informational only — this is not an authorised scope."
        >
          <RecordDetails value={request.environmentDetails} empty="No environment details given." />
        </ContextGroup>

        <ContextGroup title="Contact">
          <RecordDetails value={request.contactInformation} />
        </ContextGroup>
      </CardContent>
    </Card>
  );
}

function ContextGroup({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t pt-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  );
}

/**
 * API-CON-008. No Consultant directory API exists yet, so assignment takes
 * the Consultant's account ID; the server verifies the account really holds
 * ROLE_CONSULTANT. Nothing here touches scope authorisation.
 */
function AssignmentCard({ request }: { request: ConsultingRequestDetail }) {
  const ids = useId();
  const mutation = useAssignConsultant(request.id);
  const current = request.assignedConsultantId;
  const [value, setValue] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ title: string; description: string } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFailure(null);
    const candidate = value.trim();
    if (!UUID_PATTERN.test(candidate)) {
      setFieldError(
        "Enter a Consultant account ID in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.",
      );
      return;
    }
    if (candidate.toLowerCase() === current?.toLowerCase()) {
      setFieldError("This Consultant is already assigned.");
      return;
    }
    setFieldError(null);
    try {
      await mutation.mutateAsync(candidate);
      setValue("");
      showNotification({
        type: "success",
        message: current ? "Consultant reassigned." : "Consultant assigned.",
      });
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        setFailure({
          title: "Consultant not found",
          description:
            "No active Consultant account matches that ID. Check the ID and try again — your entry is still here.",
        });
        return;
      }
      setFailure(
        describeConsultingError(error, {
          action: "assign this Consultant",
          preserved: "Your entry is still here.",
        }),
      );
    }
  };

  return (
    <Card className={cardSpacing}>
      <CardHeader className="border-b">
        <SectionHeading icon={UserRoundCheck} title="Consultant assignment" />
      </CardHeader>
      <CardContent className="space-y-5">
        <dl>
          <DetailItem label="Assigned consultant">
            {current ? (
              <span className="font-mono text-[0.8rem] break-all">{current}</span>
            ) : (
              <span className="text-muted-foreground">No consultant assigned yet</span>
            )}
          </DetailItem>
        </dl>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="space-y-2">
            <Label htmlFor={`${ids}-consultant`}>
              {current ? "Reassign to Consultant account ID" : "Consultant account ID"}
            </Label>
            <Input
              id={`${ids}-consultant`}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              spellCheck={false}
              autoComplete="off"
              aria-invalid={Boolean(fieldError)}
              aria-describedby={`${ids}-consultant-help${fieldError ? ` ${ids}-consultant-error` : ""}`}
              className={cn("h-10 font-mono text-[0.8rem] md:text-[0.8rem]")}
            />
            <p id={`${ids}-consultant-help`} className="text-xs leading-5 text-muted-foreground">
              A consultant directory isn&apos;t available yet, so assignment uses the account ID.
              The server confirms it belongs to a Consultant.
            </p>
            {fieldError && (
              <p id={`${ids}-consultant-error`} className="text-sm text-destructive" role="alert">
                {fieldError}
              </p>
            )}
          </div>
          {failure && (
            <Alert variant="destructive" className="gap-1 rounded-xl px-4 py-3">
              <AlertTriangle aria-hidden="true" />
              <AlertTitle>{failure.title}</AlertTitle>
              <AlertDescription>{failure.description}</AlertDescription>
            </Alert>
          )}
          <Button
            type="submit"
            variant={current ? "outline" : "default"}
            disabled={mutation.isPending || !value.trim()}
            className="w-full"
            size="lg"
          >
            {mutation.isPending ? "Saving assignment…" : current ? "Reassign" : "Assign consultant"}
          </Button>
        </form>

        <div className="flex gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          <p>
            <span className="font-medium text-foreground">Assignment is not authorisation.</span> It
            routes the request to a consultant. Technical work is permitted only by the
            Business&apos;s explicit scope authorisation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
