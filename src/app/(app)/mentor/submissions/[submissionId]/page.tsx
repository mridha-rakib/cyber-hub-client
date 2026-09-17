"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { ConflictState, ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  useApproveSubmission,
  useRequestRevision,
  useReviewSubmission,
  useStartReviewSubmission,
} from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";

export default function MentorReviewDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const {
    data: submission,
    isPending,
    isError,
    error,
    refetch,
  } = useReviewSubmission(submissionId);
  const startReview = useStartReviewSubmission(submissionId);
  const approve = useApproveSubmission(submissionId);
  const requestRevision = useRequestRevision(submissionId);
  const [reviewNote, setReviewNote] = useState("");
  const [feedback, setFeedback] = useState("");
  const [conflict, setConflict] = useState(false);

  if (isPending) return <PageLoading />;
  if (isError) {
    return isApiError(error) && error.status === 404 ? (
      <NotFoundState />
    ) : (
      <ErrorState onRetry={() => refetch()} />
    );
  }

  const runTransition = async (fn: () => Promise<unknown>) => {
    setConflict(false);
    try {
      await fn();
    } catch (err) {
      if (isApiError(err) && err.status === 409) setConflict(true);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Submission Review</CardTitle>
        <StatusBadge status={submission.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {conflict && <ConflictState onRefresh={() => refetch()} />}

        {!conflict && submission.status === "SUBMITTED" && (
          <Button
            onClick={() => runTransition(() => startReview.mutateAsync(submission.stateVersion))}
            disabled={startReview.isPending}
          >
            {startReview.isPending ? "Claiming…" : "Start review"}
          </Button>
        )}

        {!conflict && submission.status === "UNDER_REVIEW" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="review-note">
                Approval note (optional)
              </label>
              <Textarea
                id="review-note"
                rows={3}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
              />
              <Button
                onClick={() =>
                  runTransition(() =>
                    approve.mutateAsync({
                      expectedStateVersion: submission.stateVersion,
                      reviewNote: reviewNote || undefined,
                    }),
                  )
                }
                disabled={approve.isPending}
              >
                {approve.isPending ? "Approving…" : "Approve"}
              </Button>
            </div>

            <div className="flex flex-col gap-2 border-t pt-4">
              <label className="text-sm font-medium" htmlFor="feedback">
                Revision feedback (required to request changes)
              </label>
              <Textarea
                id="feedback"
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() =>
                  runTransition(() =>
                    requestRevision.mutateAsync({
                      expectedStateVersion: submission.stateVersion,
                      feedback,
                    }),
                  )
                }
                disabled={requestRevision.isPending || feedback.trim().length === 0}
              >
                {requestRevision.isPending ? "Requesting…" : "Request revision"}
              </Button>
            </div>
          </div>
        )}

        {submission.status === "APPROVED" && (
          <p className="text-sm text-muted-foreground">This submission is approved.</p>
        )}
      </CardContent>
    </Card>
  );
}
