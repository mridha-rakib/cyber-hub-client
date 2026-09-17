"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnCertificate } from "@/hooks/use-certificate";
import { isApiError } from "@/lib/errors/api-error";

export default function CertificateDetailPage() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const {
    data: certificate,
    isPending,
    isError,
    error,
    refetch,
  } = useOwnCertificate(certificateId);

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
          <CardTitle>{certificate.programmeTitleSnapshot}</CardTitle>
          <CardDescription>
            Issued to {certificate.recipientNameSnapshot} on{" "}
            {new Date(certificate.issuedAt).toLocaleDateString()}
          </CardDescription>
        </div>
        <StatusBadge status={certificate.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div>
          <p className="font-medium">Certificate number</p>
          <p className="text-muted-foreground">{certificate.certificateNumber}</p>
        </div>
        <div>
          <p className="font-medium">Skills</p>
          <p className="text-muted-foreground">{certificate.completedSkills.join(", ")}</p>
        </div>
        {certificate.status === "REVOKED" && certificate.revocationReason && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <p className="font-medium text-destructive">Revoked</p>
            <p className="text-muted-foreground">{certificate.revocationReason}</p>
          </div>
        )}
        <div>
          <p className="font-medium">Public verification</p>
          <Link
            href={`/certificates/verify/${certificate.verificationPath}`}
            className="text-muted-foreground underline underline-offset-4"
          >
            View public verification page
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
