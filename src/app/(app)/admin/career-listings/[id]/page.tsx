"use client";

import { MapPinIcon } from "lucide-react";
import Link from "next/link";
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
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminCareerListings,
  useAdminCloseCareerListing,
  usePublishCareerListing,
  useRejectCareerListing,
  useStartReviewCareerListing,
} from "@/hooks/use-career";
import { isApiError } from "@/lib/errors/api-error";
import { CAREER_LISTING_TYPE_LABELS } from "@/types/career";

/**
 * No dedicated admin GET-by-id endpoint exists for career listings (UI
 * Screen Inventory v1.1, UI-ADM-009: "Detail record may be sourced from
 * list result/current API context; a dedicated admin GET-by-id endpoint is
 * not present") — this deliberately reuses the moderation queue's own list
 * query (unfiltered by status, generously sized) rather than inventing a
 * new backend call.
 */
export default function AdminCareerListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError, error, refetch } = useAdminCareerListings({ limit: 100 });
  const listing = data?.find((l) => l.id === id);

  const startReview = useStartReviewCareerListing(id);
  const publish = usePublishCareerListing(id);
  const reject = useRejectCareerListing(id);
  const close = useAdminCloseCareerListing(id);

  const [conflict, setConflict] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  if (isPending) return <PageLoading />;
  if (isError && isApiError(error) && error.status === 403) return <ForbiddenState />;
  if (isError && !data) return <ErrorState onRetry={() => refetch()} />;
  if (!listing) return <NotFoundState />;

  const runTransition = async (fn: () => Promise<unknown>) => {
    setConflict(false);
    try {
      await fn();
    } catch (err) {
      if (isApiError(err) && err.status === 409) setConflict(true);
    }
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      setReasonError("A reason is required.");
      return;
    }
    setReasonError(null);
    await runTransition(() =>
      reject.mutateAsync({ expectedStateVersion: listing.stateVersion, reason: reason.trim() }),
    );
    setRejecting(false);
    setReason("");
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/career-listings"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to moderation queue
      </Link>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>
              <h1>{listing.title}</h1>
            </CardTitle>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{listing.employerName}</span>
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

          {listing.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {listing.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {listing.moderationReason && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium text-foreground">Previous rejection reason</p>
              <p className="mt-1 text-muted-foreground">{listing.moderationReason}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {listing.status === "SUBMITTED" && (
              <Button
                onClick={() => runTransition(() => startReview.mutateAsync(listing.stateVersion))}
                disabled={startReview.isPending}
              >
                {startReview.isPending ? "Starting…" : "Start review"}
              </Button>
            )}
            {listing.status === "UNDER_REVIEW" && (
              <>
                <Button
                  onClick={() => runTransition(() => publish.mutateAsync(listing.stateVersion))}
                  disabled={publish.isPending}
                >
                  {publish.isPending ? "Publishing…" : "Publish"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setRejecting((v) => !v)}
                  disabled={reject.isPending}
                >
                  Reject
                </Button>
              </>
            )}
            {listing.status === "PUBLISHED" && (
              <Button
                variant="outline"
                onClick={() => runTransition(() => close.mutateAsync(listing.stateVersion))}
                disabled={close.isPending}
              >
                {close.isPending ? "Closing…" : "Close"}
              </Button>
            )}
          </div>

          {rejecting && (
            <div className="flex flex-col gap-2 rounded-lg border p-3">
              <label htmlFor="reject-reason" className="text-sm font-medium">
                Reason for rejection
              </label>
              <Textarea
                id="reject-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-invalid={Boolean(reasonError)}
                aria-describedby={reasonError ? "reject-reason-error" : undefined}
              />
              {reasonError && (
                <p id="reject-reason-error" className="text-sm text-destructive" role="alert">
                  {reasonError}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleReject} disabled={reject.isPending}>
                  {reject.isPending ? "Rejecting…" : "Confirm rejection"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setRejecting(false);
                    setReason("");
                    setReasonError(null);
                  }}
                  disabled={reject.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
