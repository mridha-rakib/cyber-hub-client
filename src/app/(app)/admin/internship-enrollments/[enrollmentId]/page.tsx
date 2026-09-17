"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { EmptyState, ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useIssueCertificate, useRevokeCertificate } from "@/hooks/use-certificate";
import { useAdminEnrollment, useAssignTasks, useInternshipTasks } from "@/hooks/use-internship";
import { isApiError } from "@/lib/errors/api-error";
import type { Certificate } from "@/types/certificate";

export default function AdminEnrollmentDetailPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const { data: enrollment, isPending, isError, error, refetch } = useAdminEnrollment(enrollmentId);
  const tasksQuery = useInternshipTasks(enrollment?.internshipId ?? "");
  const assignTasks = useAssignTasks(enrollmentId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigned, setAssigned] = useState(false);

  const issueCertificate = useIssueCertificate(enrollmentId);
  const [skillsInput, setSkillsInput] = useState("");
  const [issuedCertificate, setIssuedCertificate] = useState<Certificate | null>(null);
  const revokeCertificate = useRevokeCertificate(issuedCertificate?.id ?? "");
  const [revokeReason, setRevokeReason] = useState("");

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certificate</CardTitle>
          <CardDescription>
            Issuance revalidates the enrollment&apos;s completion eligibility on the server; only
            ELIGIBLE enrollments can be issued a certificate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {issuedCertificate ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span>{issuedCertificate.certificateNumber}</span>
                <StatusBadge status={issuedCertificate.status} />
              </div>
              {issuedCertificate.status === "ISSUED" && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Revocation reason"
                    value={revokeReason}
                    onChange={(e) => setRevokeReason(e.target.value)}
                  />
                  <Button
                    variant="destructive"
                    disabled={!revokeReason.trim() || revokeCertificate.isPending}
                    onClick={async () => {
                      const updated = await revokeCertificate.mutateAsync(revokeReason);
                      setIssuedCertificate(updated);
                      setRevokeReason("");
                    }}
                  >
                    Revoke
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Completed skills, comma separated"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />
              <Button
                disabled={!skillsInput.trim() || issueCertificate.isPending}
                onClick={async () => {
                  try {
                    const skills = skillsInput
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean);
                    const certificate = await issueCertificate.mutateAsync(skills);
                    setIssuedCertificate(certificate);
                  } catch (error) {
                    if (isApiError(error) && error.status === 409) {
                      /* A certificate already exists for this enrollment. There is
                       * no documented admin lookup-by-enrollment endpoint, so it
                       * cannot be shown/revoked from here — visible under the
                       * learner's own certificates instead. */
                    }
                  }
                }}
              >
                {issueCertificate.isPending ? "Issuing…" : "Issue certificate"}
              </Button>
              {issueCertificate.isError &&
                (isApiError(issueCertificate.error) && issueCertificate.error.status === 409 ? (
                  <p className="text-sm text-muted-foreground">
                    A certificate has already been issued for this enrollment.
                  </p>
                ) : (
                  <p className="text-sm text-destructive">{issueCertificate.error.message}</p>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
