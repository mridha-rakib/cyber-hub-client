"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import { ConflictState, ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/features/internship/status-badge";
import { useOwnSubmission, useResubmit } from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";

export default function SubmissionDetailPage() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { data, isPending, isError, error, refetch } = useOwnSubmission(submissionId);
  const resubmit = useResubmit(submissionId);
  const [evidenceText, setEvidenceText] = useState("");
  const [conflict, setConflict] = useState(false);

  if (isPending) return <PageLoading />;
  if (isError) {
    return isApiError(error) && error.status === 404 ? (
      <NotFoundState />
    ) : (
      <ErrorState onRetry={() => refetch()} />
    );
  }

  const { submission } = data;

  const handleResubmit = async () => {
    setConflict(false);
    try {
      await resubmit.mutateAsync({ expectedStateVersion: submission.stateVersion, evidenceText });
      setEvidenceText("");
    } catch (err) {
      if (isApiError(err) && err.status === 409) setConflict(true);
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Submission</CardTitle>
        <StatusBadge status={submission.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {submission.reviewFeedback && (
          <div className="rounded-lg border bg-muted/50 p-3 text-sm">
            <p className="font-medium">Mentor feedback</p>
            <p className="text-muted-foreground">{submission.reviewFeedback}</p>
          </div>
        )}

        {conflict && <ConflictState onRefresh={() => refetch()} />}

        {submission.status === "REVISION_REQUIRED" && !conflict && (
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium" htmlFor="revised-evidence">
              Revised evidence
            </label>
            <Textarea
              id="revised-evidence"
              rows={6}
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
            />
            <Button
              onClick={handleResubmit}
              disabled={resubmit.isPending || evidenceText.trim().length === 0}
            >
              {resubmit.isPending ? "Resubmitting…" : "Resubmit"}
            </Button>
          </div>
        )}

        {submission.status === "APPROVED" && (
          <p className="text-sm text-muted-foreground">
            This submission was approved and can no longer be edited.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
