"use client";

import { PlusIcon, SearchIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/features/learning-content/content-ui";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { useAdminResources } from "@/hooks/use-resources";
import { isApiError } from "@/lib/errors/api-error";
import type { ResourceStatus } from "@/types/resource";

const STATUS_FILTERS: { value: ResourceStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

interface TextFilters {
  q: string;
  category: string;
  tag: string;
}

const EMPTY: TextFilters = { q: "", category: "", tag: "" };

/** UI-ADM-006 list: every lifecycle state (API-ADMRES-006). */
export default function AdminResourcesPage() {
  const [status, setStatus] = useState<ResourceStatus | "">("");
  const [featuredOnly, setFeaturedOnly] = useState(false);
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
  } = useAdminResources({
    status: status || undefined,
    featured: featuredOnly || undefined,
    q: applied.q || undefined,
    category: applied.category || undefined,
    tag: applied.tag || undefined,
    limit: 25,
  });
  const resources = flattenCursorPages(data);
  const hasFilters = Boolean(
    status || featuredOnly || applied.q || applied.category || applied.tag,
  );

  if (isError && isApiError(error) && error.status === 403) return <ForbiddenState />;

  const apply = (event: FormEvent) => {
    event.preventDefault();
    setApplied({ q: draft.q.trim(), category: draft.category.trim(), tag: draft.tag.trim() });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Learning Resources</h1>
          <p className="text-sm text-muted-foreground">
            Create, publish and archive learning resources. Only published resources are public.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/resources/new">
            <PlusIcon />
            New resource
          </Link>
        </Button>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Filter by status</legend>
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

      <form onSubmit={apply} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
        <Input
          aria-label="Search titles"
          placeholder="Search titles"
          maxLength={100}
          value={draft.q}
          onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
        />
        <Input
          aria-label="Category"
          placeholder="Exact category"
          maxLength={100}
          value={draft.category}
          onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
        />
        <Input
          aria-label="Tag"
          placeholder="Exact tag"
          maxLength={50}
          value={draft.tag}
          onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value }))}
        />
        <Button type="submit" variant="outline">
          <SearchIcon />
          Search
        </Button>
      </form>
      <label htmlFor="admin-resource-featured" className="flex w-fit items-center gap-2 text-sm">
        <Checkbox
          id="admin-resource-featured"
          checked={featuredOnly}
          onCheckedChange={(checked) => setFeaturedOnly(checked === true)}
        />
        Featured only
      </label>

      {isPending && <PageLoading />}
      {isError && data === undefined && <ErrorState onRetry={() => refetch()} />}
      {isError && data !== undefined && !isFetchNextPageError && (
        <ErrorState
          title="Couldn't refresh resources"
          description="Showing the last loaded results."
          onRetry={() => refetch()}
          className="min-h-0 rounded-lg border py-6"
        />
      )}
      {!isPending && !(isError && data === undefined) && resources.length === 0 && (
        <EmptyState
          title={hasFilters ? "No resources match these filters" : "No resources yet"}
          description={
            hasFilters ? "Try different filters." : "Create the first learning resource."
          }
        />
      )}
      {!isPending && resources.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {resources.map((resource) => (
              <li key={resource.id}>
                <Link href={`/admin/resources/${resource.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader className="flex-row items-center justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{resource.title}</CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                          <span className="truncate">{resource.category}</span>
                          {resource.featured && (
                            <Badge variant="secondary">
                              <StarIcon aria-hidden="true" />
                              Featured
                            </Badge>
                          )}
                          <span className="text-xs">Updated {formatDate(resource.updatedAt)}</span>
                        </div>
                      </div>
                      <StatusBadge status={resource.status} />
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
