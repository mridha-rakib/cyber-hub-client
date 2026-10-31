"use client";

import { PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatPrice } from "@/features/learning-content/content-ui";
import { useAdminCourses } from "@/hooks/use-courses";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { isApiError } from "@/lib/errors/api-error";
import type { CourseApprovalStatus } from "@/types/course";

const STATUS_FILTERS: { value: CourseApprovalStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

interface TextFilters {
  q: string;
  provider: string;
  category: string;
  level: string;
  /** `datetime-local` value; converted to an ISO timestamp for `activeAt`. */
  activeAt: string;
}

const EMPTY: TextFilters = { q: "", provider: "", category: "", level: "", activeAt: "" };

function toIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function affiliateLabel(value: boolean | null): string {
  if (value === true) return "Affiliate";
  if (value === false) return "Not affiliate";
  return "Not declared";
}

/** UI-ADM-007 list: every approval state (API-ADMCRS-006). */
export default function AdminCoursesPage() {
  const [status, setStatus] = useState<CourseApprovalStatus | "">("");
  const [draft, setDraft] = useState<TextFilters>(EMPTY);
  const [applied, setApplied] = useState<TextFilters>(EMPTY);

  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useAdminCourses({
    approvalStatus: status || undefined,
    q: applied.q || undefined,
    provider: applied.provider || undefined,
    category: applied.category || undefined,
    level: applied.level || undefined,
    activeAt: toIso(applied.activeAt),
    limit: 25,
  });
  const courses = flattenCursorPages(data);
  const hasFilters = Boolean(status || Object.values(applied).some(Boolean));

  if (isError && isApiError(error) && error.status === 403) return <ForbiddenState />;

  const apply = (event: FormEvent) => {
    event.preventDefault();
    setApplied({
      q: draft.q.trim(),
      provider: draft.provider.trim(),
      category: draft.category.trim(),
      level: draft.level.trim(),
      activeAt: draft.activeAt,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Course Deals</h1>
          <p className="text-sm text-muted-foreground">
            Create, verify and approve course deals. Only approved, active deals are public.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">
            <PlusIcon />
            New course deal
          </Link>
        </Button>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Filter by approval status</legend>
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value || "all"}
            size="sm"
            variant={status === filter.value ? "secondary" : "ghost"}
            aria-pressed={status === filter.value}
            onClick={() => setStatus(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </fieldset>

      <form onSubmit={apply} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          aria-label="Search titles"
          placeholder="Search titles"
          maxLength={100}
          value={draft.q}
          onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
        />
        <Input
          aria-label="Provider"
          placeholder="Exact provider"
          value={draft.provider}
          onChange={(e) => setDraft((d) => ({ ...d, provider: e.target.value }))}
        />
        <Input
          aria-label="Category"
          placeholder="Exact category"
          value={draft.category}
          onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
        />
        <Input
          aria-label="Level"
          placeholder="Exact level"
          value={draft.level}
          onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value }))}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="admin-course-active-at" className="text-xs text-muted-foreground">
            Active at (optional)
          </label>
          <Input
            id="admin-course-active-at"
            type="datetime-local"
            value={draft.activeAt}
            onChange={(e) => setDraft((d) => ({ ...d, activeAt: e.target.value }))}
          />
        </div>
        <Button type="submit" variant="outline" className="self-end">
          <SearchIcon />
          Search
        </Button>
      </form>

      {isPending && <PageLoading />}
      {isError && data === undefined && <ErrorState onRetry={() => refetch()} />}
      {isError && data !== undefined && !isFetchNextPageError && (
        <ErrorState
          title="Couldn't refresh course deals"
          description="Showing the last loaded results."
          onRetry={() => refetch()}
          className="min-h-0 rounded-lg border py-6"
        />
      )}
      {!isPending && !(isError && data === undefined) && courses.length === 0 && (
        <EmptyState
          title={hasFilters ? "No course deals match these filters" : "No course deals yet"}
          description={hasFilters ? "Try different filters." : "Create the first course deal."}
        />
      )}
      {!isPending && courses.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {courses.map((course) => (
              <li key={course.id}>
                <Link href={`/admin/courses/${course.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader className="flex-row items-center justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{course.title}</CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="truncate">{course.provider}</span>
                          <span>{formatPrice(course.discountedPrice, course.currency)}</span>
                          <Badge
                            variant={
                              course.hasAffiliateRelationship === null ? "destructive" : "outline"
                            }
                          >
                            {affiliateLabel(course.hasAffiliateRelationship)}
                          </Badge>
                          {course.expiresAt && (
                            <span className="text-xs">Ends {formatDate(course.expiresAt)}</span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={course.approvalStatus} />
                    </CardHeader>
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
    </div>
  );
}
