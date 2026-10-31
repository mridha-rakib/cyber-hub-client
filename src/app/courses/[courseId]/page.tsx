"use client";

import { InfoIcon, SquareArrowOutUpRightIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AffiliateBadge,
  CoursePrice,
  formatDateTime,
  PlainText,
  PublicContentHeader,
} from "@/features/learning-content/content-ui";
import { useApprovedCourse } from "@/hooks/use-courses";
import { isApiError } from "@/lib/errors/api-error";
import { courseOutboundUrl } from "@/services/course.service";

/**
 * UI-PUB-005: one approved deal (API-CRS-002). The provider link is only the
 * backend outbound endpoint (API-CRS-003, UI-DEC-027); an expired deal shows
 * "This deal has expired." with no active link. Draft, rejected and withdrawn
 * deals are the same 404. Admin notes and reasons never appear here.
 */
export default function CourseDealDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isPending, isError, error, refetch } = useApprovedCourse(courseId);
  const notFound = isError && isApiError(error) && [400, 404, 422].includes(error.status ?? 0);

  return (
    <div className="flex flex-1 flex-col">
      <PublicContentHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6">
        <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to course deals
        </Link>

        {isPending && <PageLoading />}
        {notFound && <NotFoundState className="mt-4" />}
        {isError && !notFound && !course && (
          <ErrorState className="mt-4" onRetry={() => refetch()} />
        )}

        {course && !notFound && (
          <article className="mt-4">
            <Card>
              <CardHeader className="gap-2">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{course.provider}</span>
                  <span>·</span>
                  <span>{course.category}</span>
                  <span>·</span>
                  <span>{course.level}</span>
                  <AffiliateBadge affiliated={course.hasAffiliateRelationship} />
                  {!course.outboundAvailable && <Badge variant="destructive">Expired</Badge>}
                </div>
                <CardTitle className="text-2xl">
                  <h1 className="break-words">{course.title}</h1>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {course.hasAffiliateRelationship === true && course.affiliateDisclosure && (
                  <aside
                    aria-label="Affiliate disclosure"
                    className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
                  >
                    <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <div>
                      <p className="font-medium">Affiliate disclosure</p>
                      <PlainText text={course.affiliateDisclosure} className="mt-1" />
                    </div>
                  </aside>
                )}

                <CoursePrice
                  originalPrice={course.originalPrice}
                  discountedPrice={course.discountedPrice}
                  currency={course.currency}
                  size="large"
                />

                <p className="text-sm text-muted-foreground">
                  {course.expiresAt
                    ? `${course.outboundAvailable ? "Deal ends" : "Deal ended"} ${formatDateTime(course.expiresAt)}`
                    : "No end date announced"}
                </p>

                {course.outboundAvailable ? (
                  <div className="flex flex-col gap-1.5">
                    <Button asChild className="w-fit">
                      <a
                        href={courseOutboundUrl(course.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View deal on {course.provider}
                        <SquareArrowOutUpRightIcon />
                      </a>
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Opens the provider&apos;s site in a new tab. Prices are set by the provider
                      and may change.
                    </p>
                  </div>
                ) : (
                  <p className="rounded-lg border p-3 text-sm font-medium" role="status">
                    This deal has expired.
                  </p>
                )}
              </CardContent>
            </Card>
          </article>
        )}
      </main>
    </div>
  );
}
