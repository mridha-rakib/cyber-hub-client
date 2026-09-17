"use client";

import Link from "next/link";

import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnEnrollments } from "@/hooks/use-internship";

export default function MyProgrammesPage() {
  const { data, isPending, isError, refetch } = useOwnEnrollments({ limit: 20 });

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">My Programmes</h1>

      {isPending && <PageLoading />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isPending && !isError && data?.length === 0 && (
        <EmptyState
          title="No active programmes"
          description="Once an application is accepted, it will appear here."
        />
      )}
      {!isPending &&
        !isError &&
        data?.map((enrollment) => (
          <Link key={enrollment.id} href={`/dashboard/internships/programmes/${enrollment.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Programme</CardTitle>
                <StatusBadge status={enrollment.completionEligibility} />
              </CardHeader>
            </Card>
          </Link>
        ))}
    </div>
  );
}
