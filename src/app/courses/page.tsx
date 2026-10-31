"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AffiliateBadge,
  CoursePrice,
  formatDate,
  PublicContentHeader,
} from "@/features/learning-content/content-ui";
import { useActiveCourses } from "@/hooks/use-courses";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";

interface Filters {
  q: string;
  provider: string;
  category: string;
  level: string;
}

const EMPTY_FILTERS: Filters = { q: "", provider: "", category: "", level: "" };

const FILTER_FIELDS: { key: keyof Filters; label: string; placeholder: string; max?: number }[] = [
  { key: "q", label: "Search titles", placeholder: "e.g. Security+", max: 100 },
  { key: "provider", label: "Provider", placeholder: "Exact provider" },
  { key: "category", label: "Category", placeholder: "Exact category" },
  { key: "level", label: "Level", placeholder: "e.g. Beginner" },
];

/**
 * UI-PUB-004: active approved course deals (API-CRS-001), most recent first.
 * Cards show prices, the end date and the Affiliate label (UI-DEC-028).
 */
export default function CourseDealsCataloguePage() {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);

  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useActiveCourses({
    q: applied.q || undefined,
    provider: applied.provider || undefined,
    category: applied.category || undefined,
    level: applied.level || undefined,
    limit: 24,
  });
  const courses = flattenCursorPages(data);
  const hasFilters = Object.values(applied).some(Boolean);

  const apply = (event: FormEvent) => {
    event.preventDefault();
    setApplied({
      q: draft.q.trim(),
      provider: draft.provider.trim(),
      category: draft.category.trim(),
      level: draft.level.trim(),
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <PublicContentHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Course Deals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Current discounts on cybersecurity courses, reviewed by our team before listing.
          </p>
        </div>

        <form
          onSubmit={apply}
          className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]"
          aria-label="Search course deals"
        >
          {FILTER_FIELDS.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label
                htmlFor={`course-filter-${field.key}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {field.label}
              </label>
              <Input
                id={`course-filter-${field.key}`}
                maxLength={field.max}
                placeholder={field.placeholder}
                value={draft[field.key]}
                onChange={(e) => setDraft((d) => ({ ...d, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex items-end gap-2">
            <Button type="submit">
              <SearchIcon />
              Search
            </Button>
            {hasFilters && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDraft(EMPTY_FILTERS);
                  setApplied(EMPTY_FILTERS);
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </form>

        {isPending && <PageLoading />}
        {isError && data === undefined && <ErrorState onRetry={() => refetch()} />}
        {isError && data !== undefined && !isFetchNextPageError && (
          <ErrorState
            title="Couldn't refresh course deals"
            description="Showing the last loaded results. Try again when the connection is available."
            onRetry={() => refetch()}
            className="mb-4 min-h-0 rounded-lg border py-6"
          />
        )}

        {!isPending && !(isError && data === undefined) && courses.length === 0 && (
          <EmptyState
            title={hasFilters ? "No deals match your filters" : "No course deals right now"}
            description={
              hasFilters ? "Try a different search or clear the filters." : "Check back soon."
            }
          />
        )}

        {!isPending && courses.length > 0 && (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <li key={course.id}>
                  <Link href={`/courses/${course.id}`} className="block h-full">
                    <Card className="h-full transition-colors hover:bg-muted/50">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="break-words text-base">{course.title}</CardTitle>
                          <AffiliateBadge affiliated={course.hasAffiliateRelationship} />
                        </div>
                        <p className="text-sm text-muted-foreground">{course.provider}</p>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-2">
                        <p className="text-xs text-muted-foreground">
                          {course.category} · {course.level}
                        </p>
                        <CoursePrice
                          originalPrice={course.originalPrice}
                          discountedPrice={course.discountedPrice}
                          currency={course.currency}
                        />
                        <p className="text-xs text-muted-foreground">
                          {course.expiresAt
                            ? `Deal ends ${formatDate(course.expiresAt)}`
                            : "No end date announced"}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
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
