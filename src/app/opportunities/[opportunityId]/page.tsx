"use client";

import { SquareArrowOutUpRightIcon } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { usePublishedOpportunity } from "@/hooks/use-employer-opportunity";
import { isApiError } from "@/lib/errors/api-error";
import { EMPLOYER_OPPORTUNITY_TYPE_LABELS } from "@/types/employer-opportunity";

export default function OpportunityDetailPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const {
    data: opportunity,
    isPending,
    isError,
    error,
    refetch,
  } = usePublishedOpportunity(opportunityId);

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <Link href="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to opportunities
        </Link>

        {isPending && <PageLoading />}
        {isError &&
          (!opportunity || (isApiError(error) && error.status === 404)) &&
          (isApiError(error) && error.status === 404 ? (
            <NotFoundState className="mt-4" />
          ) : (
            <ErrorState className="mt-4" onRetry={() => refetch()} />
          ))}

        {opportunity && !(isError && isApiError(error) && error.status === 404) && (
          <>
            {isError && (
              <ErrorState
                title="Couldn't refresh this opportunity"
                description="Showing the last loaded details. Try again when the connection is available."
                onRetry={() => refetch()}
                className="mt-4 min-h-0 rounded-lg border py-6"
              />
            )}
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-xl">
                    <h1>{opportunity.title}</h1>
                  </CardTitle>
                  <Badge variant="outline" className="shrink-0">
                    {EMPLOYER_OPPORTUNITY_TYPE_LABELS[opportunity.type]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm whitespace-pre-wrap text-foreground">
                  {opportunity.description}
                </p>

                {opportunity.skills && opportunity.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {opportunity.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}

                {opportunity.applicationUrl && (
                  <Button asChild className="w-fit">
                    <a href={opportunity.applicationUrl} target="_blank" rel="noopener noreferrer">
                      Continue to application
                      <SquareArrowOutUpRightIcon />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
