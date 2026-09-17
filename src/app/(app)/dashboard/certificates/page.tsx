"use client";

import Link from "next/link";

import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnCertificates } from "@/hooks/use-certificate";

export default function MyCertificatesPage() {
  const { data, isPending, isError, refetch } = useOwnCertificates();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">My Certificates</h1>

      {isPending && <PageLoading />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isPending && !isError && data?.length === 0 && (
        <EmptyState
          title="No certificates yet"
          description="Certificates appear here once issued for a completed internship."
        />
      )}
      {!isPending &&
        !isError &&
        data?.map((certificate) => (
          <Link key={certificate.id} href={`/dashboard/certificates/${certificate.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader className="flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{certificate.programmeTitleSnapshot}</CardTitle>
                  <CardDescription>
                    Issued {new Date(certificate.issuedAt).toLocaleDateString()}
                  </CardDescription>
                </div>
                <StatusBadge status={certificate.status} />
              </CardHeader>
            </Card>
          </Link>
        ))}
    </div>
  );
}
