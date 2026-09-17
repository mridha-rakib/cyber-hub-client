"use client";

import { useParams } from "next/navigation";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/features/internship/status-badge";
import { useCompletion, useEvaluateCompletion } from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";

export default function CompletionEvaluationPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const { data: enrollment, isPending, isError, error, refetch } = useCompletion(enrollmentId);
  const evaluate = useEvaluateCompletion(enrollmentId);

  if (isPending) return <PageLoading />;
  if (isError) {
    return isApiError(error) && error.status === 404 ? (
      <NotFoundState />
    ) : (
      <ErrorState onRetry={() => refetch()} />
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Completion Evaluation</CardTitle>
          <CardDescription>
            Eligibility is computed by the server from approved task submissions — it cannot be set
            directly.
          </CardDescription>
        </div>
        <StatusBadge status={enrollment.completionEligibility} />
      </CardHeader>
      <CardContent>
        <Button onClick={() => evaluate.mutate(undefined)} disabled={evaluate.isPending}>
          {evaluate.isPending ? "Evaluating…" : "Re-evaluate eligibility"}
        </Button>
      </CardContent>
    </Card>
  );
}
