"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import {
  ConflictState,
  ErrorState,
  ForbiddenState,
  NotFoundState,
  PageLoading,
} from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCloseOpportunity,
  useOwnOpportunity,
  useResubmitOpportunity,
  useUpdateOpportunity,
} from "@/hooks/use-employer-opportunity";
import { isApiError } from "@/lib/errors/api-error";
import { EMPLOYER_OPPORTUNITY_TYPE_LABELS } from "@/types/employer-opportunity";
import {
  OpportunityForm,
  type OpportunityFormValues,
  toOpportunityInput,
} from "../opportunity-form";

export default function BusinessOpportunityDetailPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const {
    data: opportunity,
    isPending,
    isError,
    error,
    refetch,
  } = useOwnOpportunity(opportunityId);
  const updateOpportunity = useUpdateOpportunity(opportunityId);
  const resubmit = useResubmitOpportunity(opportunityId);
  const close = useCloseOpportunity(opportunityId);

  const [conflict, setConflict] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [saved, setSaved] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isPending) return <PageLoading />;
  if (isError) {
    if (isApiError(error) && error.status === 404) return <NotFoundState />;
    if (isApiError(error) && error.status === 403) return <ForbiddenState />;
    if (!opportunity) return <ErrorState onRetry={() => refetch()} />;
  }
  if (!opportunity) return <PageLoading />;

  const runAction = async (fn: () => Promise<unknown>): Promise<boolean> => {
    setConflict(false);
    setActionError(null);
    try {
      await fn();
      return true;
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        setConflict(true);
      } else {
        setActionError(isApiError(err) ? err.message : "Something went wrong. Please try again.");
      }
      return false;
    }
  };

  const handleSave = async (values: OpportunityFormValues) => {
    setSaveError(null);
    setFieldErrors({});
    setSaved(false);
    setConflict(false);
    try {
      await updateOpportunity.mutateAsync({
        ...toOpportunityInput(values),
        expectedStateVersion: opportunity.stateVersion,
      });
      setSaved(true);
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        setConflict(true);
        return;
      }
      if (isApiError(err) && err.hasValidationErrors) {
        setFieldErrors({
          title: err.fieldError("title"),
          description: err.fieldError("description"),
          applicationUrl: err.fieldError("applicationUrl"),
        });
        setSaveError(err.message);
        return;
      }
      setSaveError(isApiError(err) ? err.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>
              <h1>{opportunity.title}</h1>
            </CardTitle>
            <Badge variant="outline" className="mt-1.5">
              {EMPLOYER_OPPORTUNITY_TYPE_LABELS[opportunity.type]}
            </Badge>
          </div>
          <StatusBadge status={opportunity.status} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isError && (
            <ErrorState
              title="Couldn't refresh this opportunity"
              description="Showing the last loaded details. Try again when the connection is available."
              onRetry={() => refetch()}
              className="min-h-0 rounded-lg border py-6"
            />
          )}
          {conflict && <ConflictState onRefresh={() => refetch()} />}
          {actionError && (
            <p className="text-sm text-destructive" role="alert">
              {actionError}
            </p>
          )}

          {opportunity.status === "REJECTED" && opportunity.moderationReason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-foreground">Feedback from review</p>
              <p className="mt-1 text-muted-foreground">{opportunity.moderationReason}</p>
            </div>
          )}

          {opportunity.status === "PUBLISHED" && (
            <div className="flex flex-col gap-2">
              {!confirmingClose ? (
                <Button
                  variant="outline"
                  className="w-fit"
                  onClick={() => setConfirmingClose(true)}
                >
                  Close opportunity
                </Button>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">
                    Closing stops new interest through this opportunity. It will no longer appear in
                    public search results. This cannot be undone from here.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      disabled={close.isPending}
                      onClick={async () => {
                        if (await runAction(() => close.mutateAsync(opportunity.stateVersion))) {
                          setConfirmingClose(false);
                        }
                      }}
                    >
                      {close.isPending ? "Closing…" : "Confirm close"}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={close.isPending}
                      onClick={() => setConfirmingClose(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {(opportunity.status === "SUBMITTED" ||
            opportunity.status === "UNDER_REVIEW" ||
            opportunity.status === "CLOSED") && (
            <p className="text-sm text-muted-foreground">
              {opportunity.status === "SUBMITTED" &&
                "This opportunity is waiting to be picked up for review."}
              {opportunity.status === "UNDER_REVIEW" &&
                "This opportunity is currently under admin review."}
              {opportunity.status === "CLOSED" &&
                "This opportunity is closed and no longer public."}
            </p>
          )}
        </CardContent>
      </Card>

      {opportunity.status === "REJECTED" && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-base">
              <h2>Edit and resubmit</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {saveError && (
              <p className="text-sm font-medium text-destructive" role="alert">
                {saveError}
              </p>
            )}
            {saved && (
              <p className="text-sm font-medium text-foreground">
                Changes saved. Resubmit when you&apos;re ready for another review.
              </p>
            )}
            <OpportunityForm
              initialValues={{
                type: opportunity.type,
                title: opportunity.title,
                description: opportunity.description,
                skills: (opportunity.skills ?? []).join(", "),
                applicationUrl: opportunity.applicationUrl ?? "",
              }}
              onSubmit={handleSave}
              submitting={updateOpportunity.isPending}
              submitLabel="Save changes"
              fieldErrors={fieldErrors}
            />
            <Button
              variant="outline"
              className="w-fit"
              disabled={resubmit.isPending}
              onClick={() => runAction(() => resubmit.mutateAsync(opportunity.stateVersion))}
            >
              {resubmit.isPending ? "Resubmitting…" : "Resubmit for review"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
