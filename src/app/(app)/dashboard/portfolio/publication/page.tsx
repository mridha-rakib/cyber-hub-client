"use client";

import Link from "next/link";
import { useState } from "react";

import { ErrorState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useOwnCertificates } from "@/hooks/use-certificate";
import {
  useAddOrUpdatePortfolioCertificate,
  useOwnPortfolio,
  useRemovePortfolioCertificate,
  useUpdatePublication,
} from "@/hooks/use-portfolio";

/** UI-LRN-005 Portfolio Publication & certificate linking. */
export default function PortfolioPublicationPage() {
  const { data, isPending, isError, refetch } = useOwnPortfolio();
  const { data: ownCertificates } = useOwnCertificates();
  const updatePublication = useUpdatePublication();
  const addOrUpdateCertificate = useAddOrUpdatePortfolioCertificate();
  const removeCertificate = useRemovePortfolioCertificate();
  const [slugInput, setSlugInput] = useState("");

  if (isPending) return <PageLoading />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const linkedIds = new Set(data.certificates.map((c) => c.certificateId));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Portfolio Publication</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Publish status</CardTitle>
          <CardDescription>
            {data.portfolio.isPublic
              ? "Your portfolio is publicly visible."
              : "Your portfolio is private."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {!data.portfolio.isPublic && (
            <div className="flex gap-2">
              <Input
                placeholder="Choose a public slug (e.g. jane-doe)"
                value={slugInput}
                onChange={(e) => setSlugInput(e.target.value)}
              />
              <Button
                onClick={() =>
                  updatePublication.mutate({
                    isPublic: true,
                    publicSlug: slugInput || undefined,
                  })
                }
                disabled={updatePublication.isPending}
              >
                Publish
              </Button>
            </div>
          )}
          {data.portfolio.isPublic && (
            <div className="flex items-center gap-3">
              <Link
                href={`/portfolio/${data.portfolio.publicSlug}`}
                className="text-sm underline underline-offset-4"
                target="_blank"
              >
                View public page
              </Link>
              <Button
                variant="outline"
                onClick={() => updatePublication.mutate({ isPublic: false })}
                disabled={updatePublication.isPending}
              >
                Unpublish
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Certificates on portfolio</CardTitle>
          <CardDescription>
            Choose which issued certificates appear on your portfolio.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {!ownCertificates || ownCertificates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
          ) : (
            ownCertificates.map((certificate) => {
              const linked = data.certificates.find((c) => c.certificateId === certificate.id);
              const isLinked = linkedIds.has(certificate.id);
              return (
                <div
                  key={certificate.id}
                  className="flex items-center justify-between rounded-lg border p-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{certificate.programmeTitleSnapshot}</span>
                    <StatusBadge status={certificate.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    {isLinked && (
                      <label
                        htmlFor={`certificate-public-${certificate.id}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <Checkbox
                          id={`certificate-public-${certificate.id}`}
                          checked={linked?.isPublic ?? false}
                          onCheckedChange={(checked) =>
                            addOrUpdateCertificate.mutate({
                              certificateId: certificate.id,
                              input: {
                                isPublic: Boolean(checked),
                                sortOrder: linked?.sortOrder ?? 0,
                              },
                            })
                          }
                        />
                        Public
                      </label>
                    )}
                    <Button
                      variant={isLinked ? "ghost" : "outline"}
                      size="sm"
                      onClick={() =>
                        isLinked
                          ? removeCertificate.mutate(certificate.id)
                          : addOrUpdateCertificate.mutate({
                              certificateId: certificate.id,
                              input: { isPublic: false, sortOrder: 0 },
                            })
                      }
                    >
                      {isLinked ? "Remove from portfolio" : "Add to portfolio"}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
