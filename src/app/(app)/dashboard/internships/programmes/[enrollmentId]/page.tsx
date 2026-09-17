"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { EmptyState, ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/features/internship/status-badge";
import { useOwnEnrollment, useOwnTaskAssignments } from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";

export default function ProgrammeProgressPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const enrollmentQuery = useOwnEnrollment(enrollmentId);
  const assignmentsQuery = useOwnTaskAssignments(enrollmentId);

  if (enrollmentQuery.isPending) return <PageLoading />;
  if (enrollmentQuery.isError) {
    return isApiError(enrollmentQuery.error) && enrollmentQuery.error.status === 404 ? (
      <NotFoundState />
    ) : (
      <ErrorState onRetry={() => enrollmentQuery.refetch()} />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Programme Progress</CardTitle>
            <CardDescription>
              Completion eligibility is determined by your mentor/admin as tasks are approved.
            </CardDescription>
          </div>
          <StatusBadge status={enrollmentQuery.data.completionEligibility} />
        </CardHeader>
      </Card>

      <h2 className="text-lg font-medium">Assigned Tasks</h2>
      {assignmentsQuery.isPending && <PageLoading />}
      {assignmentsQuery.isError && <ErrorState onRetry={() => assignmentsQuery.refetch()} />}
      {!assignmentsQuery.isPending &&
        !assignmentsQuery.isError &&
        assignmentsQuery.data?.length === 0 && (
          <EmptyState
            title="No tasks assigned yet"
            description="Your admin will assign tasks once your enrollment is set up."
          />
        )}
      {!assignmentsQuery.isPending &&
        !assignmentsQuery.isError &&
        assignmentsQuery.data?.map((assignment) => (
          <Link
            key={assignment.id}
            href={`/dashboard/internships/programmes/${enrollmentId}/tasks/${assignment.id}`}
          >
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Task</CardTitle>
                <CardDescription>
                  Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                  {assignment.dueAt && ` · due ${new Date(assignment.dueAt).toLocaleDateString()}`}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
    </div>
  );
}
