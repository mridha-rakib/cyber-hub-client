"use client";

import { MapPinIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env } from "@/config/env";
import { APP_NAME } from "@/constants";
import { usePublishedCareerListing } from "@/hooks/use-career";
import { isApiError } from "@/lib/errors/api-error";
import { CAREER_LISTING_TYPE_LABELS } from "@/types/career";

export default function CareerListingDetailPage() {
  const { listingId } = useParams<{ listingId: string }>();
  const {
    data: listing,
    isPending,
    isError,
    error,
    refetch,
  } = usePublishedCareerListing(listingId);

  const outboundUrl = `${env.apiUrl}/career-listings/${listingId}/outbound`;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <Link href="/careers" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to career listings
        </Link>

        {isPending && <PageLoading />}
        {isError &&
          (!listing || (isApiError(error) && error.status === 404)) &&
          (isApiError(error) && error.status === 404 ? (
            <NotFoundState className="mt-4" />
          ) : (
            <ErrorState className="mt-4" onRetry={() => refetch()} />
          ))}

        {listing && !(isError && isApiError(error) && error.status === 404) && (
          <>
            {isError && (
              <ErrorState
                title="Couldn't refresh this listing"
                description="Showing the last loaded details. Try again when the connection is available."
                onRetry={() => refetch()}
                className="mt-4 min-h-0 rounded-lg border py-6"
              />
            )}
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-xl">
                      <h1>{listing.title}</h1>
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{listing.employerName}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {CAREER_LISTING_TYPE_LABELS[listing.listingType]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <MapPinIcon className="size-4" aria-hidden="true" />
                    {listing.location}
                  </span>
                  <span>{listing.level}</span>
                  {listing.remoteUk && <Badge variant="secondary">Remote UK</Badge>}
                </div>

                {listing.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {listing.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button asChild className="w-fit">
                  <a href={outboundUrl} target="_blank" rel="noopener noreferrer">
                    Continue to application
                    <SquareArrowOutUpRightIcon />
                  </a>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Opens the employer&apos;s application destination in a new tab.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
