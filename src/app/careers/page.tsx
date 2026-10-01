"use client";

import { MapPinIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/constants";
import { usePublishedCareerListings } from "@/hooks/use-career";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { CAREER_LISTING_TYPE_LABELS, type CareerListingType } from "@/types/career";

const LISTING_TYPES: CareerListingType[] = ["JOB", "INTERNSHIP", "GRADUATE_ROLE", "APPRENTICESHIP"];

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function CareerHubPage() {
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [level, setLevel] = useState("");
  const [skill, setSkill] = useState("");
  const [remoteUk, setRemoteUk] = useState(false);

  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = usePublishedCareerListings({
    type: type || undefined,
    location: location || undefined,
    level: level || undefined,
    skill: skill || undefined,
    remoteUk: remoteUk || undefined,
    limit: 25,
  });
  const listings = flattenCursorPages(data);

  const hasFilters = Boolean(type || location || level || skill || remoteUk);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">UK Cyber Career Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse published jobs, internships, graduate roles and apprenticeships in UK
            cybersecurity.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-type" className="text-xs font-medium text-muted-foreground">
              Type
            </label>
            <select
              id="filter-type"
              className={selectClassName}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">All types</option>
              {LISTING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CAREER_LISTING_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-location" className="text-xs font-medium text-muted-foreground">
              Location
            </label>
            <Input
              id="filter-location"
              placeholder="e.g. London"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-level" className="text-xs font-medium text-muted-foreground">
              Level
            </label>
            <Input
              id="filter-level"
              placeholder="e.g. Junior"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-skill" className="text-xs font-medium text-muted-foreground">
              Skill
            </label>
            <Input
              id="filter-skill"
              placeholder="e.g. SOC"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
          </div>
        </div>

        <label
          htmlFor="filter-remote-uk"
          className="mb-6 flex w-fit items-center gap-2 text-sm text-muted-foreground"
        >
          <Checkbox
            id="filter-remote-uk"
            checked={remoteUk}
            onCheckedChange={(checked) => setRemoteUk(checked === true)}
          />
          Remote UK only
        </label>

        {isPending && <PageLoading />}
        {isError && data === undefined && <ErrorState onRetry={() => refetch()} />}
        {isError && data !== undefined && !isFetchNextPageError && (
          <ErrorState
            title="Couldn't refresh listings"
            description="Showing the last loaded results. Try again when the connection is available."
            onRetry={() => refetch()}
            className="mb-4 min-h-0 rounded-lg border py-6"
          />
        )}

        {!isPending && listings.length === 0 && (
          <EmptyState
            title={
              hasFilters
                ? "No listings match your filters"
                : "No career listings are available right now"
            }
            description={hasFilters ? "Try widening your search." : "Check back soon."}
          />
        )}

        {!isPending && listings.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {listings.map((listing) => (
                <Link key={listing.id} href={`/careers/${listing.id}`}>
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{listing.title}</CardTitle>
                        <Badge variant="outline" className="shrink-0">
                          {CAREER_LISTING_TYPE_LABELS[listing.listingType]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{listing.employerName}</p>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPinIcon className="size-3.5" aria-hidden="true" />
                        {listing.location}
                        {listing.remoteUk && (
                          <Badge variant="secondary" className="ml-1">
                            Remote UK
                          </Badge>
                        )}
                      </div>
                      {listing.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {listing.skills.slice(0, 4).map((s) => (
                            <Badge key={s} variant="outline">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <LoadMore
              hasMore={hasNextPage}
              isLoading={isFetchingNextPage}
              isError={isFetchNextPageError}
              onLoadMore={() => fetchNextPage()}
              onRetry={() => fetchNextPage()}
            />
          </>
        )}
      </main>
    </div>
  );
}
