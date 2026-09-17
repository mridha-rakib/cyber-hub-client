"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { EmptyState, ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/features/internship/status-badge";
import { useAdminEnrollment, useAssignTasks, useInternshipTasks } from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";

export default function AdminEnrollmentDetailPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const { data: enrollment, isPending, isError, error, refetch } = useAdminEnrollment(enrollmentId);
  const tasksQuery = useInternshipTasks(enrollment?.internshipId ?? "");
  const assignTasks = useAssignTasks(enrollmentId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigned, setAssigned] = useState(false);

  if (isPending) return <PageLoading />;
  if (isError) {
    return isApiError(error) && error.status === 404 ? (
      <NotFoundState />
    ) : (
      <ErrorState onRetry={() => refetch()} />
    );
  }

  const toggle = (taskId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleAssign = async () => {
    await assignTasks.mutateAsync([...selected]);
    setSelected(new Set());
    setAssigned(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Enrollment</CardTitle>
          <StatusBadge status={enrollment.completionEligibility} />
        </CardHeader>
        <CardContent>
          <Link
            href={`/mentor/enrollments/${enrollmentId}/completion`}
            className="text-sm underline underline-offset-4"
          >
            View completion evaluation
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assign Tasks</CardTitle>
          <CardDescription>
            Only tasks from this enrollment&apos;s own internship are assignable.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {tasksQuery.isPending && <PageLoading />}
          {tasksQuery.isError && <ErrorState onRetry={() => tasksQuery.refetch()} />}
          {!tasksQuery.isPending && !tasksQuery.isError && tasksQuery.data?.length === 0 && (
            <EmptyState title="This programme has no tasks yet" />
          )}
          {tasksQuery.data?.map((task) => (
            <div key={task.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                id={`task-${task.id}`}
                checked={selected.has(task.id)}
                onCheckedChange={() => toggle(task.id)}
              />
              <label htmlFor={`task-${task.id}`}>{task.title}</label>
            </div>
          ))}
          {assigned && (
            <p className="text-sm text-muted-foreground">Tasks assigned successfully.</p>
          )}
          <Button onClick={handleAssign} disabled={assignTasks.isPending || selected.size === 0}>
            {assignTasks.isPending ? "Assigning…" : "Assign selected tasks"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
