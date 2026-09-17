"use client";

import Link from "next/link";

import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/features/internship/status-badge";
import { useReviewQueue } from "@/hooks/use-internship";

export default function MentorReviewQueuePage() {
  const { data, isPending, isError, refetch } = useReviewQueue({ limit: 20 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Submission Review Queue</h1>

      {isPending && <PageLoading />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isPending && !isError && data?.length === 0 && (
        <EmptyState
          title="Nothing to review"
          description="Claimed and unclaimed submissions will appear here."
        />
      )}
      {!isPending &&
        !isError &&
        data?.map((submission) => (
          <Link key={submission.id} href={`/mentor/submissions/${submission.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Submission</CardTitle>
                  <CardDescription>
                    Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                    {!submission.reviewerId && " · unclaimed"}
                  </CardDescription>
                </div>
                <StatusBadge status={submission.status} />
              </CardHeader>
            </Card>
          </Link>
        ))}
    </div>
  );
}
