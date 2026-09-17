"use client";

import Link from "next/link";

import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/features/internship/status-badge";
import { useOwnApplications } from "@/hooks/use-internship";

export default function MyApplicationsPage() {
  const { data, isPending, isError, refetch } = useOwnApplications({ limit: 20 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">My Internship Applications</h1>

      {isPending && <PageLoading />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isPending && !isError && data?.length === 0 && (
        <EmptyState title="No applications yet" description="Browse open internships to apply." />
      )}
      {!isPending &&
        !isError &&
        data?.map((application) => (
          <Link key={application.id} href={`/dashboard/internships/applications/${application.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Application</CardTitle>
                  <CardDescription>
                    Submitted {new Date(application.submittedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <StatusBadge status={application.status} />
              </CardHeader>
            </Card>
          </Link>
        ))}
    </div>
  );
}
