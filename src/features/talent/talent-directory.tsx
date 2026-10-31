"use client";

import { Search, X } from "lucide-react";
import { useState } from "react";

import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicPortfolioCard } from "@/features/talent/public-portfolio-card";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { useTalentDirectory } from "@/hooks/use-talent";
import { isApiError } from "@/lib/errors/api-error";
import { TALENT_SKILL_MAX_LENGTH, type TalentSummary } from "@/types/talent";

/**
 * UI-BIZ-007 Talent Directory (API-PORT-025). Read-only discovery of
 * consented public portfolios; the server returns only public data. The
 * skill search is a case-insensitive exact match on public skills (D3).
 */
export function TalentDirectory() {
  const [draft, setDraft] = useState("");
  const [skill, setSkill] = useState<string | undefined>(undefined);
  const [inputError, setInputError] = useState<string | null>(null);
  const query = useTalentDirectory({ skill });
  const items = flattenCursorPages(query.data);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value) {
      setInputError("Enter a skill to search for.");
      return;
    }
    if (value.length > TALENT_SKILL_MAX_LENGTH) {
      setInputError(`Use ${TALENT_SKILL_MAX_LENGTH} characters or fewer.`);
      return;
    }
    setInputError(null);
    setSkill(value);
  };

  const clear = () => {
    setDraft("");
    setInputError(null);
    setSkill(undefined);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Talent Directory</h1>
        <p className="text-sm text-muted-foreground">
          Learner portfolios that their owners have chosen to make public. Only public information
          is shown.
        </p>
      </div>

      <form
        onSubmit={submit}
        noValidate
        aria-label="Search talent by skill"
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="talent-skill">Skill</Label>
          <Input
            id="talent-skill"
            value={draft}
            maxLength={TALENT_SKILL_MAX_LENGTH + 50}
            aria-invalid={Boolean(inputError)}
            aria-describedby="talent-skill-help"
            placeholder="e.g. Network Security"
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit">
            <Search aria-hidden="true" />
            Search
          </Button>
          {(skill !== undefined || draft) && (
            <Button type="button" variant="ghost" onClick={clear}>
              <X aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </form>
      <p
        id="talent-skill-help"
        className={inputError ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
        role={inputError ? "alert" : undefined}
      >
        {inputError ?? "Matches the whole skill name, ignoring capital letters."}
      </p>

      <Results query={query} items={items} skill={skill} onClear={clear} />
    </div>
  );
}

function Results({
  query,
  items,
  skill,
  onClear,
}: {
  query: ReturnType<typeof useTalentDirectory>;
  items: TalentSummary[];
  skill: string | undefined;
  onClear: () => void;
}) {
  if (query.isPending) return <PageLoading />;
  if (query.isError) {
    const status = isApiError(query.error) ? query.error.status : undefined;
    if (status === 403) return <ForbiddenState />;
    if (status === 422) {
      return (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            That search couldn&apos;t be used. Check the skill and try again.
          </AlertDescription>
        </Alert>
      );
    }
    return <ErrorState onRetry={() => query.refetch()} />;
  }
  if (items.length === 0) {
    return skill ? (
      <EmptyState
        title="No public portfolios match this skill"
        description={`Nobody has a public skill named "${skill}". Try another skill or clear the search.`}
        action={
          <Button variant="outline" onClick={onClear}>
            Clear search
          </Button>
        }
      />
    ) : (
      <EmptyState
        title="No public portfolios yet"
        description="Portfolios appear here once learners choose to publish them."
      />
    );
  }
  return (
    <section aria-label="Talent results" className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {skill
          ? `Showing portfolios with the public skill "${skill}"`
          : "Showing public portfolios"}
      </p>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((talent) => (
          <li key={talent.publicSlug}>
            <PublicPortfolioCard talent={talent} />
          </li>
        ))}
      </ul>
      <LoadMore
        hasMore={Boolean(query.hasNextPage)}
        isLoading={query.isFetchingNextPage}
        isError={query.isFetchNextPageError}
        onLoadMore={() => query.fetchNextPage()}
        onRetry={() => query.fetchNextPage()}
      />
    </section>
  );
}
