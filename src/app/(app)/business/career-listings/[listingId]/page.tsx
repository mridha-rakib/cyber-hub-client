"use client";

import { MapPinIcon } from "lucide-react";
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
  useCloseCareerListing,
  useOwnCareerListing,
  useResubmitCareerListing,
  useUpdateCareerListing,
} from "@/hooks/use-career";
import { isApiError } from "@/lib/errors/api-error";
import { CAREER_LISTING_TYPE_LABELS } from "@/types/career";
import { CareerListingForm, type CareerListingFormValues, toListingInput } from "../listing-form";

export default function BusinessCareerListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const { data: listing, isPending, isError, error, refetch } = useOwnCareerListing(listingId);
  const updateListing = useUpdateCareerListing(listingId);
  const resubmit = useResubmitCareerListing(listingId);
  const close = useCloseCareerListing(listingId);

  const [conflict, setConflict] = useState(false);
  const [confirmingClose, setConfirmingClose] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});
  const [saved, setSaved] = useState(false);

  if (isPending) return <PageLoading />;
  if (isError) {
    if (isApiError(error) && error.status === 404) return <NotFoundState />;
    if (isApiError(error) && error.status === 403) return <ForbiddenState />;
    if (!listing) return <ErrorState onRetry={() => refetch()} />;
  }
  if (!listing) return <PageLoading />;

  const runAction = async (fn: () => Promise<unknown>) => {
    setConflict(false);
    try {
      await fn();
    } catch (err) {
      if (isApiError(err) && err.status === 409) setConflict(true);
    }
  };

  const handleSave = async (values: CareerListingFormValues) => {
    setSaveError(null);
    setFieldErrors({});
    setSaved(false);
    setConflict(false);
    try {
      await updateListing.mutateAsync({
        ...toListingInput(values),
        expectedStateVersion: listing.stateVersion,
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
          location: err.fieldError("location"),
          level: err.fieldError("level"),
          skills: err.fieldError("skills"),
          applicationUrl: err.fieldError("applicationUrl"),
        });
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
              <h1>{listing.title}</h1>
            </CardTitle>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPinIcon className="size-3.5" aria-hidden="true" />
                {listing.location}
              </span>
              <span>{listing.level}</span>
              <Badge variant="outline">{CAREER_LISTING_TYPE_LABELS[listing.listingType]}</Badge>
              {listing.remoteUk && <Badge variant="secondary">Remote UK</Badge>}
            </div>
          </div>
          <StatusBadge status={listing.status} />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {isError && (
            <ErrorState
              title="Couldn't refresh this listing"
              description="Showing the last loaded details. Try again when the connection is available."
              onRetry={() => refetch()}
              className="min-h-0 rounded-lg border py-6"
            />
          )}
          {conflict && <ConflictState onRefresh={() => refetch()} />}

          {listing.status === "REJECTED" && listing.moderationReason && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-medium text-foreground">Feedback from review</p>
              <p className="mt-1 text-muted-foreground">{listing.moderationReason}</p>
            </div>
          )}

          {listing.status === "PUBLISHED" && (
            <div className="flex flex-col gap-2">
              {!confirmingClose ? (
                <Button
                  variant="outline"
                  className="w-fit"
                  onClick={() => setConfirmingClose(true)}
                >
                  Close listing
                </Button>
              ) : (
                <div className="flex flex-col gap-2 rounded-lg border p-3">
                  <p className="text-sm text-muted-foreground">
                    Closing stops new applications through this listing. It will no longer appear in
                    public search results. This cannot be undone from here.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      disabled={close.isPending}
                      onClick={() =>
                        runAction(() => close.mutateAsync(listing.stateVersion)).then(() =>
                          setConfirmingClose(false),
                        )
                      }
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

          {(listing.status === "SUBMITTED" ||
            listing.status === "UNDER_REVIEW" ||
            listing.status === "CLOSED") && (
            <p className="text-sm text-muted-foreground">
              {listing.status === "SUBMITTED" &&
                "This listing is waiting to be picked up for review."}
              {listing.status === "UNDER_REVIEW" && "This listing is currently under admin review."}
              {listing.status === "CLOSED" && "This listing is closed and no longer public."}
            </p>
          )}
        </CardContent>
      </Card>

      {listing.status === "REJECTED" && (
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
            <CareerListingForm
              initialValues={{
                title: listing.title,
                location: listing.location,
                level: listing.level,
                skills: listing.skills.join(", "),
                applicationUrl: listing.applicationUrl,
                listingType: listing.listingType,
                remoteUk: listing.remoteUk,
              }}
              onSubmit={handleSave}
              submitting={updateListing.isPending}
              submitLabel="Save changes"
              fieldErrors={fieldErrors}
            />
            <Button
              variant="outline"
              className="w-fit"
              disabled={resubmit.isPending}
              onClick={() => runAction(() => resubmit.mutateAsync(listing.stateVersion))}
            >
              {resubmit.isPending ? "Resubmitting…" : "Resubmit for review"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
