"use client";

import { SearchIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  formatDate,
  PublicContentHeader,
  selectClassName,
} from "@/features/learning-content/content-ui";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { usePublishedResources } from "@/hooks/use-resources";
import { readResourceContent } from "@/types/resource";

interface Filters {
  q: string;
  category: string;
  tag: string;
}

const EMPTY_FILTERS: Filters = { q: "", category: "", tag: "" };

/**
 * UI-PUB-002: published learning resources (API-RES-001). Text filters apply
 * on submit, so each keystroke doesn't become a request; featured and sort
 * apply immediately. Bookmark and progress controls are not mounted (UI-DEC-031).
 */
export default function ResourcesCataloguePage() {
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [sort, setSort] = useState<"recent" | "featured">("recent");

  const {
    data,
    isPending,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = usePublishedResources({
    q: applied.q || undefined,
    category: applied.category || undefined,
    tag: applied.tag || undefined,
    featured: featuredOnly || undefined,
    sort,
    limit: 24,
  });
  const resources = flattenCursorPages(data);
  const hasFilters = Boolean(applied.q || applied.category || applied.tag || featuredOnly);

  const apply = (event: FormEvent) => {
    event.preventDefault();
    setApplied({
      q: draft.q.trim(),
      category: draft.category.trim(),
      tag: draft.tag.trim(),
    });
  };

  const clear = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setFeaturedOnly(false);
  };

  return (
    <div className="flex flex-1 flex-col">
      <PublicContentHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Learning Resources</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Guides and references for building practical cybersecurity skills.
          </p>
        </div>

        <form
          onSubmit={apply}
          className="mb-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]"
          aria-label="Search resources"
        >
          <div className="flex flex-col gap-1">
            <label htmlFor="resource-q" className="text-xs font-medium text-muted-foreground">
              Search titles
            </label>
            <Input
              id="resource-q"
              maxLength={100}
              placeholder="e.g. phishing"
              value={draft.q}
              onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label
              htmlFor="resource-category"
              className="text-xs font-medium text-muted-foreground"
            >
              Category
            </label>
            <Input
              id="resource-category"
              maxLength={100}
              placeholder="Exact category"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="resource-tag" className="text-xs font-medium text-muted-foreground">
              Tag
            </label>
            <Input
              id="resource-tag"
              maxLength={50}
              placeholder="Exact tag"
              value={draft.tag}
              onChange={(e) => setDraft((d) => ({ ...d, tag: e.target.value }))}
            />
          </div>
          <Button type="submit" className="self-end">
            <SearchIcon />
            Search
          </Button>
        </form>

        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          <label htmlFor="resource-featured" className="flex items-center gap-2 text-sm">
            <Checkbox
              id="resource-featured"
              checked={featuredOnly}
              onCheckedChange={(checked) => setFeaturedOnly(checked === true)}
            />
            Featured only
          </label>
          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="resource-sort" className="text-muted-foreground">
              Sort
            </label>
            <select
              id="resource-sort"
              className={`${selectClassName} w-36`}
              value={sort}
              onChange={(e) => setSort(e.target.value as "recent" | "featured")}
            >
              <option value="recent">Most recent</option>
              <option value="featured">Featured first</option>
            </select>
          </div>
          {hasFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={clear}>
              Clear filters
            </Button>
          )}
        </div>

        {isPending && <PageLoading />}
        {isError && data === undefined && <ErrorState onRetry={() => refetch()} />}
        {isError && data !== undefined && !isFetchNextPageError && (
          <ErrorState
            title="Couldn't refresh resources"
            description="Showing the last loaded results. Try again when the connection is available."
            onRetry={() => refetch()}
            className="mb-4 min-h-0 rounded-lg border py-6"
          />
        )}

        {!isPending && !(isError && data === undefined) && resources.length === 0 && (
          <EmptyState
            title={hasFilters ? "No resources match your filters" : "No resources published yet"}
            description={
              hasFilters ? "Try a different search or clear the filters." : "Check back soon."
            }
          />
        )}

        {!isPending && resources.length > 0 && (
          <>
            <ul className="grid gap-4 sm:grid-cols-2">
              {resources.map((resource) => {
                const { summary } = readResourceContent(resource.content);
                return (
                  <li key={resource.id}>
                    <Link href={`/resources/${resource.id}`} className="block h-full">
                      <Card className="h-full transition-colors hover:bg-muted/50">
                        <CardHeader>
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="break-words text-base">
                              {resource.title}
                            </CardTitle>
                            {resource.featured && (
                              <Badge variant="secondary" className="shrink-0">
                                <StarIcon aria-hidden="true" />
                                Featured
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{resource.category}</p>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                          {summary && (
                            <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm">
                              {summary}
                            </p>
                          )}
                          {resource.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {resource.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                              {resource.tags.length > 4 && (
                                <span className="text-xs text-muted-foreground">
                                  +{resource.tags.length - 4} more
                                </span>
                              )}
                            </div>
                          )}
                          {resource.publishedAt && (
                            <p className="text-xs text-muted-foreground">
                              Published {formatDate(resource.publishedAt)}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                );
              })}
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
