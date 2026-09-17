"use client";

import Link from "next/link";

import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import { useAdminApplications } from "@/hooks/use-internship";

export default function AdminApplicationsQueuePage() {
  const { data, isPending, isError, refetch } = useAdminApplications({ limit: 50 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Internship Applications</h1>

      {isPending && <PageLoading />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isPending && !isError && data?.length === 0 && <EmptyState title="No applications" />}
      {!isPending &&
        !isError &&
        data?.map((application) => (
          <Link key={application.id} href={`/admin/internship-applications/${application.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center justify-between">
                <CardDescription>
                  Submitted {new Date(application.submittedAt).toLocaleDateString()}
                </CardDescription>
                <StatusBadge status={application.status} />
              </CardHeader>
            </Card>
          </Link>
        ))}
    </div>
  );
}
