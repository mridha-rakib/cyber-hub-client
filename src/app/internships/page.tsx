"use client";

import Link from "next/link";

import { EmptyState, ErrorState, PageLoading } from "@/components/common/states";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/constants";
import { usePublishedInternships } from "@/hooks/use-internship";

export default function InternshipCataloguePage() {
  const { data, isPending, isError, refetch } = usePublishedInternships({ limit: 20 });

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <Link href="/" className="font-semibold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 p-6">
        <h1 className="mb-6 text-2xl font-semibold">Internship Programmes</h1>

        {isPending && <PageLoading />}
        {isError && <ErrorState onRetry={() => refetch()} />}
        {!isPending && !isError && data?.length === 0 && (
          <EmptyState title="No internships are open right now" description="Check back soon." />
        )}
        {!isPending && !isError && data && data.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.map((internship) => (
              <Link key={internship.id} href={`/internships/${internship.id}`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{internship.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {internship.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
