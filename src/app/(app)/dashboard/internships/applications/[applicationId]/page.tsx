"use client";

import { useParams } from "next/navigation";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnApplication } from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";

export default function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const {
    data: application,
    isPending,
    isError,
    error,
    refetch,
  } = useOwnApplication(applicationId);

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
          <CardTitle>Application</CardTitle>
          <CardDescription>
            Submitted {new Date(application.submittedAt).toLocaleDateString()}
          </CardDescription>
        </div>
        <StatusBadge status={application.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {application.status === "REJECTED" && application.decisionReason && (
          <p className="text-muted-foreground">Reason: {application.decisionReason}</p>
        )}
        {application.status === "ACCEPTED" && (
          <p className="text-muted-foreground">
            Your application was accepted — see your programme progress under &quot;My
            Programmes&quot;.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
