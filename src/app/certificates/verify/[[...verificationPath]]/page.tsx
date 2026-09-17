"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { StatusBadge } from "@/components/common/status-badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/constants";
import { useVerifyCertificate } from "@/hooks/use-certificate";
import { isApiError } from "@/lib/errors/api-error";

/**
 * UI-PUB-020. `verificationPath` is optional — visitors can either open a
 * shared link directly or land here and paste/enter a code manually. The
 * frontend never decides validity itself; it only renders whatever the
 * DB-backed backend response says (Wave 2 Phase 34).
 */
export default function CertificateVerificationPage() {
  const params = useParams<{ verificationPath?: string[] }>();
  const router = useRouter();
  const pathFromUrl = params.verificationPath?.[0];
  const [inputValue, setInputValue] = useState("");

  const activePath = pathFromUrl;
  const { data, isPending, isError, error } = useVerifyCertificate(activePath ?? "");

  const handleCheck = () => {
    if (inputValue.trim()) router.push(`/certificates/verify/${inputValue.trim()}`);
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 p-6">
        <h1 className="text-xl font-semibold">Certificate Verification</h1>

        {!activePath && (
          <div className="flex w-full flex-col gap-3">
            <label className="text-sm font-medium" htmlFor="verification-code">
              Enter a certificate verification code
            </label>
            <Input
              id="verification-code"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="e.g. XbUrPEEWp88CXdsKXbtRZg"
            />
            <Button onClick={handleCheck} disabled={!inputValue.trim()}>
              Verify
            </Button>
          </div>
        )}

        {activePath && isPending && <p className="text-sm text-muted-foreground">Checking…</p>}

        {activePath && isError && (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-base">Not verifiable</CardTitle>
              <CardDescription>
                {isApiError(error) && error.status === 404
                  ? "This code doesn't match a known certificate."
                  : "Something went wrong. Please try again."}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {activePath && data && (
          <Card className="w-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">{data.programmeTitleSnapshot}</CardTitle>
              <StatusBadge status={data.status} />
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p>
                <span className="font-medium">Recipient:</span> {data.recipientNameSnapshot}
              </p>
              <p>
                <span className="font-medium">Issued:</span>{" "}
                {new Date(data.issuedAt).toLocaleDateString()}
              </p>
              <p>
                <span className="font-medium">Skills:</span> {data.completedSkills.join(", ")}
              </p>
              {data.status === "REVOKED" && (
                <p className="font-medium text-destructive">
                  This certificate has been revoked and is no longer valid.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {activePath && (
          <Button variant="ghost" onClick={() => router.push("/certificates/verify")}>
            Check another code
          </Button>
        )}
      </main>
    </div>
  );
}
