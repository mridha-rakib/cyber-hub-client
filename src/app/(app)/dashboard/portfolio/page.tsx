"use client";

import Link from "next/link";

import { ErrorState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnPortfolio } from "@/hooks/use-portfolio";

/** UI-LRN-004 Portfolio Overview (/dashboard/portfolio). */
export default function PortfolioOverviewPage() {
  const { data, isPending, isError, refetch } = useOwnPortfolio();

  if (isPending) return <PageLoading />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const counts = {
    Projects: data.projects.length,
    Links: data.links.length,
    Skills: data.skills.length,
    Certifications: data.certifications.length,
    Evidence: data.evidence.length,
    Achievements: data.achievements.length,
    Certificates: data.certificates.length,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Portfolio</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/portfolio/edit">Edit items</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/portfolio/publication">Publication</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data.portfolio.isPublic ? "Published" : "Not published"}
          </CardTitle>
          <CardDescription>
            {data.portfolio.isPublic && data.portfolio.publicSlug
              ? `Public at /portfolio/${data.portfolio.publicSlug}`
              : "Publish your portfolio to share it publicly."}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(counts).map(([label, count]) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-semibold">{count}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
