"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ConflictState, ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/features/internship/status-badge";
import {
  useAcceptApplication,
  useAdminApplication,
  useRejectApplication,
  useStartReviewApplication,
} from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";

export default function AdminApplicationReviewPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const router = useRouter();
  const {
    data: application,
    isPending,
    isError,
    error,
    refetch,
  } = useAdminApplication(applicationId);
  const startReview = useStartReviewApplication(applicationId);
  const accept = useAcceptApplication(applicationId);
  const reject = useRejectApplication(applicationId);
  const [reason, setReason] = useState("");
  const [conflict, setConflict] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);

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

  const handleAccept = () =>
    runTransition(async () => {
      const result = await accept.mutateAsync(application.stateVersion);
      setEnrollmentId(result.enrollment.id);
    });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Application Review</CardTitle>
          <CardDescription>{JSON.stringify(application.applicationData)}</CardDescription>
        </div>
        <StatusBadge status={application.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {conflict && <ConflictState onRefresh={() => refetch()} />}

        {enrollmentId && (
          <p className="text-sm text-muted-foreground">
            Application accepted. Assign tasks{" "}
            <Link
              href={`/admin/internship-enrollments/${enrollmentId}`}
              className="underline underline-offset-4"
            >
              here
            </Link>
            .
          </p>
        )}

        {!conflict && !enrollmentId && application.status === "SUBMITTED" && (
          <Button
            onClick={() => runTransition(() => startReview.mutateAsync(application.stateVersion))}
            disabled={startReview.isPending}
          >
            {startReview.isPending ? "Starting…" : "Start review"}
          </Button>
        )}

        {!conflict && !enrollmentId && application.status === "UNDER_REVIEW" && (
          <div className="flex flex-col gap-4">
            <Button onClick={handleAccept} disabled={accept.isPending}>
              {accept.isPending ? "Accepting…" : "Accept"}
            </Button>

            <div className="flex flex-col gap-2 border-t pt-4">
              <label className="text-sm font-medium" htmlFor="reject-reason">
                Rejection reason (required to reject)
              </label>
              <Textarea
                id="reject-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                variant="destructive"
                onClick={() =>
                  runTransition(() =>
                    reject.mutateAsync({ expectedStateVersion: application.stateVersion, reason }),
                  )
                }
                disabled={reject.isPending || reason.trim().length === 0}
              >
                {reject.isPending ? "Rejecting…" : "Reject"}
              </Button>
            </div>
          </div>
        )}

        {application.status === "ACCEPTED" && !enrollmentId && (
          <p className="text-sm text-muted-foreground">This application has been accepted.</p>
        )}
        {application.status === "REJECTED" && (
          <p className="text-sm text-muted-foreground">
            Rejected{application.decisionReason ? `: ${application.decisionReason}` : ""}.
          </p>
        )}

        <Button variant="ghost" onClick={() => router.back()}>
          Back
        </Button>
      </CardContent>
    </Card>
  );
}
