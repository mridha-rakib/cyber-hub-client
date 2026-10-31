import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TalentSummary } from "@/types/talent";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

const COUNT_LABELS: [keyof TalentSummary["counts"], string, string][] = [
  ["projects", "project", "projects"],
  ["certifications", "certification", "certifications"],
  ["certificates", "platform certificate", "platform certificates"],
  ["achievements", "achievement", "achievements"],
  ["evidence", "evidence item", "evidence items"],
  ["links", "link", "links"],
];

/**
 * CMP-017 PublicPortfolioCard: shows only the public summary fields the
 * server returns (D2). The full public portfolio stays on the existing
 * UI-PUB-019 route.
 */
export function PublicPortfolioCard({ talent }: { talent: TalentSummary }) {
  const counts = COUNT_LABELS.filter(([key]) => talent.counts[key] > 0);
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base break-all">{talent.publicSlug}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {talent.publishedAt
            ? `Published ${dateFormat.format(new Date(talent.publishedAt))}`
            : "Public portfolio"}
        </p>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {talent.skills.length > 0 ? (
          <ul aria-label="Public skills" className="flex flex-wrap gap-1.5">
            {talent.skills.map((skill) => (
              <li key={skill}>
                <Badge variant="secondary" className="max-w-full break-all whitespace-normal">
                  {skill}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No public skills listed.</p>
        )}
        {counts.length > 0 && (
          <ul aria-label="Public portfolio items" className="text-sm text-muted-foreground">
            {counts.map(([key, one, many]) => (
              <li key={key}>
                {talent.counts[key]} {talent.counts[key] === 1 ? one : many}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CardFooter className="mt-auto">
        <Button asChild variant="outline" size="sm">
          <Link href={`/portfolio/${encodeURIComponent(talent.publicSlug)}`}>
            <ExternalLink aria-hidden="true" />
            Open portfolio
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
