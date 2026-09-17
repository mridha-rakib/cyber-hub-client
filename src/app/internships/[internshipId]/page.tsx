"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { ErrorState, NotFoundState, PageLoading } from "@/components/common/states";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { APP_NAME, ROUTES } from "@/constants";
import { useCreateApplication, usePublishedInternship } from "@/hooks/use-internship";
import { useSession } from "@/hooks/use-session";
import { isApiError } from "@/lib/errors/api-error";

export default function InternshipDetailPage() {
  const { internshipId } = useParams<{ internshipId: string }>();
  const router = useRouter();
  const {
    data: internship,
    isPending,
    isError,
    error,
    refetch,
  } = usePublishedInternship(internshipId);
  const { status: sessionStatus, session } = useSession();
  const createApplication = useCreateApplication(internshipId);
  const [motivation, setMotivation] = useState("");
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const isLearner = sessionStatus === "authenticated" && session?.user.role === "ROLE_LEARNER";

  const handleApply = async () => {
    setApplyError(null);
    try {
      await createApplication.mutateAsync({ motivation });
      setApplied(true);
    } catch (err) {
      setApplyError(
        isApiError(err) && err.status === 409
          ? "You may already have applied, or this internship is no longer accepting applications."
          : "Something went wrong submitting your application.",
      );
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 p-6">
        <Link href="/internships" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to programmes
        </Link>

        {isPending && <PageLoading />}
        {isError &&
          (isApiError(error) && error.status === 404 ? (
            <NotFoundState />
          ) : (
            <ErrorState onRetry={() => refetch()} />
          ))}

        {internship && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-xl">{internship.title}</CardTitle>
              <CardDescription>{internship.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {applied ? (
                <p className="text-sm text-muted-foreground">
                  Your application has been submitted. Track its status from{" "}
                  <Link href={ROUTES.dashboard} className="underline underline-offset-4">
                    your dashboard
                  </Link>
                  .
                </p>
              ) : isLearner ? (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1.5 text-sm font-medium" htmlFor="motivation">
                    Why are you interested in this internship?
                  </label>
                  <Textarea
                    id="motivation"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    rows={4}
                  />
                  {applyError && (
                    <p className="text-sm font-medium text-destructive" role="alert">
                      {applyError}
                    </p>
                  )}
                  <Button
                    onClick={handleApply}
                    disabled={createApplication.isPending || motivation.trim().length === 0}
                  >
                    {createApplication.isPending ? "Submitting…" : "Apply now"}
                  </Button>
                </div>
              ) : sessionStatus === "authenticated" ? (
                <p className="text-sm text-muted-foreground">
                  Only learner accounts can apply to internships.
                </p>
              ) : (
                <Button onClick={() => router.push(ROUTES.login)}>Sign in to apply</Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
