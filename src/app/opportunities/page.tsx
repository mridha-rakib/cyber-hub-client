"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { APP_NAME } from "@/constants";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { usePublishedOpportunities } from "@/hooks/use-employer-opportunity";
import {
  EMPLOYER_OPPORTUNITY_TYPE_LABELS,
  type EmployerOpportunityType,
} from "@/types/employer-opportunity";

const OPPORTUNITY_TYPES: EmployerOpportunityType[] = ["INTERNSHIP_OPPORTUNITY", "STUDENT_PROJECT"];

const selectClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export default function OpportunitiesCataloguePage() {
  const [type, setType] = useState("");
  const [skill, setSkill] = useState("");

  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = usePublishedOpportunities({
    type: type || undefined,
    skill: skill || undefined,
    limit: 25,
  });
  const opportunities = flattenCursorPages(data);

  const hasFilters = Boolean(type || skill);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Employer Opportunities</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse published employer internship opportunities and student projects.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-sm">
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
              {OPPORTUNITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {EMPLOYER_OPPORTUNITY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="filter-skill" className="text-xs font-medium text-muted-foreground">
              Skill
            </label>
            <Input
              id="filter-skill"
              placeholder="e.g. Python"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
            />
          </div>
        </div>

        {isPending && <PageLoading />}
        {isError && data === undefined && <ErrorState onRetry={() => refetch()} />}
        {isError && data !== undefined && !isFetchNextPageError && (
          <ErrorState
            title="Couldn't refresh opportunities"
            description="Showing the last loaded results. Try again when the connection is available."
            onRetry={() => refetch()}
            className="mb-4 min-h-0 rounded-lg border py-6"
          />
        )}

        {!isPending && opportunities.length === 0 && (
          <EmptyState
            title={
              hasFilters
                ? "No opportunities match your filters"
                : "No opportunities are available right now"
            }
            description={hasFilters ? "Try widening your search." : "Check back soon."}
          />
        )}

        {!isPending && opportunities.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {opportunities.map((opportunity) => (
                <Link key={opportunity.id} href={`/opportunities/${opportunity.id}`}>
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">{opportunity.title}</CardTitle>
                        <Badge variant="outline" className="shrink-0">
                          {EMPLOYER_OPPORTUNITY_TYPE_LABELS[opportunity.type]}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {opportunity.description}
                      </CardDescription>
                    </CardHeader>
                    {opportunity.skills && opportunity.skills.length > 0 && (
                      <CardContent className="flex flex-wrap gap-1.5">
                        {opportunity.skills.slice(0, 4).map((s) => (
                          <Badge key={s} variant="outline">
                            {s}
                          </Badge>
                        ))}
                      </CardContent>
                    )}
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
