"use client";

import { ArrowLeft, CircleCheck, FileLock2, Info, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ErrorState } from "@/components/common/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessConsultingRequest, useCurrentScopeAuthorization } from "@/hooks/use-consulting";
import type { ConsultingRequestClient, ScopeAuthorization } from "@/types/consulting";
import {
  CONSULTING_SERVICE_LABELS,
  CONSULTING_STATUS_BUSINESS_MEANING,
  companyNameOf,
  formatConsultingDateTime,
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
import { ScopeAuthorizationForm } from "./scope-form";
import { ScopeAuthorizationSummary } from "./scope-summary";

/** UI-BIZ-010 — own request (API-CON-003) + current scope (API-CON-005/004). */
export function BusinessRequestDetail({ requestId }: { requestId: string }) {
  const requestQuery = useBusinessConsultingRequest(requestId);

  if (requestQuery.isPending) return <WorkspaceSkeleton />;
  if (requestQuery.isError) {
    return <ConsultingQueryError error={requestQuery.error} onRetry={requestQuery.refetch} />;
  }
  const request = requestQuery.data;
  const company = companyNameOf(request.companyDetails);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/business/consulting">
          <ArrowLeft aria-hidden="true" /> All consulting requests
        </Link>
      </Button>

      <ConsultingPageHeader
        eyebrow={company ? `Consulting request · ${company}` : "Consulting request"}
        title={CONSULTING_SERVICE_LABELS[request.requestedService]}
        meta={
          <p className="text-sm text-muted-foreground">
            Submitted {formatConsultingDateTime(request.submittedAt)}
          </p>
        }
        actions={<ConsultingStatusBadge status={request.status} />}
      />

      <Card className="gap-5 py-5 [--card-spacing:--spacing(5)]">
        <CardContent className="space-y-5">
          <ConsultingLifecycle status={request.status} />
          <p className="border-t pt-4 text-sm leading-6 text-muted-foreground">
            {CONSULTING_STATUS_BUSINESS_MEANING[request.status]}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-6">
          <AuthorisationCard request={request} />
          <Card className="gap-5 py-5 [--card-spacing:--spacing(5)]">
            <CardHeader className="border-b">
              <SectionHeading
                title="Request details"
                description="What your organisation submitted, as recorded on this request."
              />
            </CardHeader>
            <CardContent className="space-y-6">
              <section aria-label="Company details">
                <RecordDetails value={request.companyDetails} />
              </section>
              <dl className="grid gap-x-6 gap-y-4 border-t pt-5 sm:grid-cols-3">
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
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card size="sm" className="gap-3">
            <CardHeader>
              <h2 className="flex items-center gap-2 font-medium">
                <Lock className="size-4" aria-hidden="true" /> How authorisation works
              </h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>
                Only the scope you explicitly confirm here permits technical work. Submitting,
                accepting or assigning a request never does.
              </p>
              <p>
                Each confirmation creates a new version that replaces the current one. Earlier
                versions are kept on record.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function AuthorisationCard({ request }: { request: ConsultingRequestClient }) {
  const scopeQuery = useCurrentScopeAuthorization(request.id);
  const [editing, setEditing] = useState(false);
  const [created, setCreated] = useState<ScopeAuthorization | null>(null);
  const closed = request.status === "DECLINED" || request.status === "COMPLETED";
  const current = scopeQuery.data ?? null;

  return (
    <Card className="gap-5 py-5 [--card-spacing:--spacing(5)]">
      <CardHeader className="border-b">
        <SectionHeading
          icon={FileLock2}
          title="Current scope authorisation"
          description="The targets, activities and dates consultants are permitted to work within."
        />
      </CardHeader>
      <CardContent className="space-y-5">
        {created && !editing && (
          <Alert className="gap-1 rounded-xl px-4 py-3">
            <CircleCheck aria-hidden="true" />
            <AlertTitle>Version {created.versionNo} is now current</AlertTitle>
            <AlertDescription>
              Your new authorisation replaced the previous version, which remains on record.
            </AlertDescription>
          </Alert>
        )}

        {scopeQuery.isPending ? (
          <div className="space-y-3" aria-busy="true">
            <span className="sr-only" role="status">
              Loading current authorisation…
            </span>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        ) : scopeQuery.isError ? (
          <ErrorState
            title="Couldn't load the current authorisation"
            description="Your request is unaffected. Try again in a moment."
            onRetry={() => scopeQuery.refetch()}
            className="min-h-0 rounded-xl border py-8"
          />
        ) : editing ? (
          <div className="space-y-5">
            {current && (
              <p className="flex gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Pre-filled from version {current.versionNo}. Review every entry before confirming.
              </p>
            )}
            <ScopeAuthorizationForm
              requestId={request.id}
              requestedService={request.requestedService}
              current={current}
              onCancel={() => setEditing(false)}
              onCreated={(scope) => {
                setCreated(scope);
                setEditing(false);
              }}
            />
          </div>
        ) : (
          <>
            <ScopeAuthorizationSummary scope={current} audience="business" />
            {closed ? (
              <p className="text-sm text-muted-foreground">
                This request is closed, so no further authorisation is needed.
              </p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {current
                    ? "Need to change the scope? Confirm a replacement version."
                    : "Confirm the scope when you are ready for technical work to be possible."}
                </p>
                <Button
                  size="lg"
                  variant={current ? "outline" : "default"}
                  onClick={() => {
                    setCreated(null);
                    setEditing(true);
                  }}
                >
                  <ShieldCheck aria-hidden="true" />
                  {current ? "Create replacement version" : "Authorise scope"}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
