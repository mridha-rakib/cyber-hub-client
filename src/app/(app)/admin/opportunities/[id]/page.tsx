"use client";

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
  useAdminCloseOpportunity,
  useAdminOpportunities,
  usePublishOpportunity,
  useRejectOpportunity,
  useStartReviewOpportunity,
} from "@/hooks/use-employer-opportunity";
import { isApiError } from "@/lib/errors/api-error";
import { EMPLOYER_OPPORTUNITY_TYPE_LABELS } from "@/types/employer-opportunity";

/**
 * Same documented constraint as the Career Listing admin detail page: no
 * dedicated GET-by-id endpoint exists (UI-ADM-011) — sourced from the
 * moderation queue's own list query.
 */
export default function AdminOpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError, error, refetch } = useAdminOpportunities({ limit: 100 });
  const opportunity = data?.find((o) => o.id === id);

  const startReview = useStartReviewOpportunity(id);
  const publish = usePublishOpportunity(id);
  const reject = useRejectOpportunity(id);
  const close = useAdminCloseOpportunity(id);

  const [conflict, setConflict] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  if (isPending) return <PageLoading />;
  if (isError && isApiError(error) && error.status === 403) return <ForbiddenState />;
  if (isError && !data) return <ErrorState onRetry={() => refetch()} />;
  if (!opportunity) return <NotFoundState />;

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
      reject.mutateAsync({ expectedStateVersion: opportunity.stateVersion, reason: reason.trim() }),
    );
    setRejecting(false);
    setReason("");
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/admin/opportunities"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Back to moderation queue
      </Link>

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

          <p className="text-sm whitespace-pre-wrap text-foreground">{opportunity.description}</p>

          {opportunity.skills && opportunity.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {opportunity.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          )}

          {opportunity.moderationReason && (
            <div className="rounded-lg border p-3 text-sm">
              <p className="font-medium text-foreground">Previous rejection reason</p>
              <p className="mt-1 text-muted-foreground">{opportunity.moderationReason}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t pt-4">
            {opportunity.status === "SUBMITTED" && (
              <Button
                onClick={() =>
                  runTransition(() => startReview.mutateAsync(opportunity.stateVersion))
                }
                disabled={startReview.isPending}
              >
                {startReview.isPending ? "Starting…" : "Start review"}
              </Button>
            )}
            {opportunity.status === "UNDER_REVIEW" && (
              <>
                <Button
                  onClick={() => runTransition(() => publish.mutateAsync(opportunity.stateVersion))}
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
            {opportunity.status === "PUBLISHED" && (
              <Button
                variant="outline"
                onClick={() => runTransition(() => close.mutateAsync(opportunity.stateVersion))}
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
