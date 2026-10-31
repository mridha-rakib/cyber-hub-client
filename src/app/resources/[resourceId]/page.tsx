"use client";

import { StarIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDate,
  PlainText,
  PublicContentHeader,
  ResourceLinkItem,
} from "@/features/learning-content/content-ui";
import { usePublishedResource } from "@/hooks/use-resources";
import { isApiError } from "@/lib/errors/api-error";
import { readResourceContent } from "@/types/resource";

/**
 * UI-PUB-003: one published resource (API-RES-002). Draft, archived and
 * missing resources are the same 404. Text is escaped plain text with line
 * breaks kept (UI-DEC-025); links follow UI-DEC-026. No bookmark or progress
 * controls in Wave 7C (UI-DEC-031).
 */
export default function ResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const { data: resource, isPending, isError, error, refetch } = usePublishedResource(resourceId);
  const notFound = isError && isApiError(error) && [400, 404, 422].includes(error.status ?? 0);
  const content = resource ? readResourceContent(resource.content) : null;

  return (
    <div className="flex flex-1 flex-col">
      <PublicContentHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6">
        <Link href="/resources" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to learning resources
        </Link>

        {isPending && <PageLoading />}
        {notFound && <NotFoundState className="mt-4" />}
        {isError && !notFound && !resource && (
          <ErrorState className="mt-4" onRetry={() => refetch()} />
        )}

        {resource && content && !notFound && (
          <article className="mt-4">
            <Card>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{resource.category}</span>
                  {resource.featured && (
                    <Badge variant="secondary">
                      <StarIcon aria-hidden="true" />
                      Featured
                    </Badge>
                  )}
                  {resource.publishedAt && (
                    <span>· Published {formatDate(resource.publishedAt)}</span>
                  )}
                </div>
                <CardTitle className="text-2xl">
                  <h1 className="break-words">{resource.title}</h1>
                </CardTitle>
                {resource.tags.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
                    {resource.tags.map((tag) => (
                      <li key={tag}>
                        <Badge variant="outline">{tag}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                {content.summary && (
                  <PlainText text={content.summary} className="text-base font-medium" />
                )}
                {content.body && <PlainText text={content.body} className="text-sm leading-7" />}
                {content.links.length > 0 && (
                  <section aria-labelledby="resource-links-heading" className="border-t pt-4">
                    <h2 id="resource-links-heading" className="mb-2 text-sm font-semibold">
                      Links
                    </h2>
                    <ul className="flex flex-col gap-2">
                      {content.links.map((link, index) => (
                        // Links have no stable id; their stored order is their identity.
                        // biome-ignore lint/suspicious/noArrayIndexKey: stored order is the identity
                        <li key={index}>
                          <ResourceLinkItem link={link} />
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">
                      External links open in a new tab.
                    </p>
                  </section>
                )}
              </CardContent>
            </Card>
          </article>
        )}
      </main>
    </div>
  );
}
