"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSubmission, useOwnTaskAssignments } from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";

export default function TaskSubmissionPage() {
  const { enrollmentId, assignmentId } = useParams<{
    enrollmentId: string;
    assignmentId: string;
  }>();
  const router = useRouter();
  const assignmentsQuery = useOwnTaskAssignments(enrollmentId);
  const createSubmission = useCreateSubmission(assignmentId);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [duplicateNotice, setDuplicateNotice] = useState(false);

  if (assignmentsQuery.isPending) return <PageLoading />;
  if (assignmentsQuery.isError) {
    return isApiError(assignmentsQuery.error) && assignmentsQuery.error.status === 404 ? (
      <NotFoundState />
    ) : (
      <ErrorState onRetry={() => assignmentsQuery.refetch()} />
    );
  }

  const assignment = assignmentsQuery.data?.find((a) => a.id === assignmentId);
  if (!assignment) return <NotFoundState />;

  const handleSubmit = async () => {
    setDuplicateNotice(false);
    try {
      const submission = await createSubmission.mutateAsync(evidenceText);
      setSubmittedId(submission.id);
    } catch (err) {
      if (isApiError(err) && err.status === 409) {
        setDuplicateNotice(true);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Evidence Submission</CardTitle>
        <CardDescription>
          Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
          {assignment.dueAt && ` · due ${new Date(assignment.dueAt).toLocaleDateString()}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {submittedId ? (
          <p className="text-sm text-muted-foreground">
            Submission received. It will appear in your mentor&apos;s review queue. View it{" "}
            <Link
              href={`/dashboard/submissions/${submittedId}`}
              className="underline underline-offset-4"
            >
              here
            </Link>
            .
          </p>
        ) : duplicateNotice ? (
          <p className="text-sm text-muted-foreground">
            You&apos;ve already submitted evidence for this task. Check back after it&apos;s
            reviewed — if revision is requested, you&apos;ll be able to resubmit.
          </p>
        ) : (
          <>
            <label className="text-sm font-medium" htmlFor="evidence">
              Evidence
            </label>
            <Textarea
              id="evidence"
              rows={6}
              value={evidenceText}
              onChange={(e) => setEvidenceText(e.target.value)}
              placeholder="Describe what you did and how it satisfies this task's requirements."
            />
            <Button
              onClick={handleSubmit}
              disabled={createSubmission.isPending || evidenceText.trim().length === 0}
            >
              {createSubmission.isPending ? "Submitting…" : "Submit evidence"}
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={() => router.back()}>
          Back to programme
        </Button>
      </CardContent>
    </Card>
  );
}
