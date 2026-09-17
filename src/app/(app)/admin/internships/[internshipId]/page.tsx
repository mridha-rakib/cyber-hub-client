"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import {
  ConflictState,
  EmptyState,
  ErrorState,
  NotFoundState,
  PageLoading,
} from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useAdminInternship,
  useArchiveInternship,
  useCloseInternship,
  useCreateTask,
  useDeleteTask,
  useInternshipTasks,
  usePublishInternship,
  useReturnInternshipToDraft,
} from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";

export default function AdminInternshipDetailPage() {
  const { internshipId } = useParams<{ internshipId: string }>();
  const { data: internship, isPending, isError, error, refetch } = useAdminInternship(internshipId);
  const tasksQuery = useInternshipTasks(internshipId);
  const publish = usePublishInternship(internshipId);
  const close = useCloseInternship(internshipId);
  const archive = useArchiveInternship(internshipId);
  const returnToDraft = useReturnInternshipToDraft(internshipId);
  const createTask = useCreateTask(internshipId);
  const deleteTask = useDeleteTask(internshipId);
  const [conflict, setConflict] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");

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

  const handleAddTask = async () => {
    await createTask.mutateAsync({
      title: taskTitle,
      description: taskDescription,
      orderNo: tasksQuery.data?.length ?? 0,
      requirements: {},
    });
    setTaskTitle("");
    setTaskDescription("");
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{internship.title}</CardTitle>
            <CardDescription>{internship.description}</CardDescription>
          </div>
          <StatusBadge status={internship.status} />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {conflict && <ConflictState onRefresh={() => refetch()} />}
          <div className="flex flex-wrap gap-2">
            {internship.status === "DRAFT" && (
              <Button
                onClick={() => runTransition(() => publish.mutateAsync(internship.stateVersion))}
                disabled={publish.isPending}
              >
                Publish
              </Button>
            )}
            {internship.status === "PUBLISHED" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => runTransition(() => close.mutateAsync(internship.stateVersion))}
                  disabled={close.isPending}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    runTransition(() => returnToDraft.mutateAsync(internship.stateVersion))
                  }
                  disabled={returnToDraft.isPending}
                >
                  Return to draft
                </Button>
              </>
            )}
            {internship.status === "CLOSED" && (
              <Button
                variant="outline"
                onClick={() => runTransition(() => archive.mutateAsync(internship.stateVersion))}
                disabled={archive.isPending}
              >
                Archive
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {tasksQuery.isPending && <PageLoading />}
          {tasksQuery.isError && <ErrorState onRetry={() => tasksQuery.refetch()} />}
          {!tasksQuery.isPending && !tasksQuery.isError && tasksQuery.data?.length === 0 && (
            <EmptyState title="No tasks yet" />
          )}
          {tasksQuery.data?.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-muted-foreground">{task.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteTask.mutate(task.id)}
                disabled={deleteTask.isPending}
              >
                Delete
              </Button>
            </div>
          ))}

          <div className="flex flex-col gap-2 border-t pt-3">
            <Input
              placeholder="Task title"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <Textarea
              placeholder="Task description"
              rows={2}
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
            <Button
              onClick={handleAddTask}
              disabled={createTask.isPending || !taskTitle.trim() || !taskDescription.trim()}
            >
              {createTask.isPending ? "Adding…" : "Add task"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
