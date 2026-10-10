"use client";

import { AlertTriangle, EyeOff, LockKeyhole, Send } from "lucide-react";
import { useId, useState } from "react";
import { LoadMore } from "@/components/common/load-more";
import { ErrorState } from "@/components/common/states";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  type OperationalAudience,
  useConsultingNotes,
  useCreateConsultingNote,
} from "@/hooks/use-consulting";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { useSession } from "@/hooks/use-session";
import { showNotification } from "@/stores/notification.store";
import { describeConsultingError } from "./consulting-errors";
import { formatConsultingDateTime, shortReference } from "./consulting-labels";
import { SectionHeading } from "./consulting-ui";

/**
 * Restricted operational notes (API-CON-014/015). Note bodies are rendered
 * only here — never in toasts, titles or logs — and this panel is never
 * mounted on a Business surface.
 */
export function InternalNotesPanel({
  audience,
  requestId,
}: {
  audience: OperationalAudience;
  requestId: string;
}) {
  const ids = useId();
  const { session } = useSession();
  const query = useConsultingNotes(audience, requestId, { limit: 10 });
  const create = useCreateConsultingNote(audience, requestId);
  const notes = flattenCursorPages(query.data);
  const [body, setBody] = useState("");
  const [failure, setFailure] = useState<{ title: string; description: string } | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!body.trim()) return;
    setFailure(null);
    try {
      await create.mutateAsync(body.trim());
      setBody("");
      showNotification({ type: "success", message: "Internal note saved." });
    } catch (error) {
      setFailure(
        describeConsultingError(error, {
          action: "save this note",
          preserved: "Your note is still here.",
        }),
      );
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeading
        icon={LockKeyhole}
        title="Internal notes"
        description="Operational context for assigned consultants and admins."
        action={
          <Badge variant="outline" className="h-6 gap-1.5 px-2.5">
            <EyeOff aria-hidden="true" /> Internal only
          </Badge>
        }
      />
      <p className="rounded-lg bg-muted/50 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
        The Business never sees these notes. Keep them factual, and never paste passwords, keys or
        other secrets.
      </p>

      <form onSubmit={submit} className="space-y-3">
        <Label htmlFor={`${ids}-note`}>Add a note</Label>
        <Textarea
          id={`${ids}-note`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What should the team know about this request?"
          className="min-h-24 leading-6"
        />
        {failure && (
          <Alert variant="destructive" className="gap-1 rounded-xl px-4 py-3">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>{failure.title}</AlertTitle>
            <AlertDescription>{failure.description}</AlertDescription>
          </Alert>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={create.isPending || !body.trim()}>
            <Send aria-hidden="true" />
            {create.isPending ? "Saving note…" : "Save internal note"}
          </Button>
        </div>
      </form>

      <section aria-label="Internal note history" className="border-t pt-5">
        {query.isPending ? (
          <div className="space-y-3" aria-busy="true">
            <span className="sr-only" role="status">
              Loading internal notes…
            </span>
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : query.isError && query.data === undefined ? (
          <ErrorState
            title="Couldn't load internal notes"
            description="The rest of this request is unaffected."
            onRetry={() => query.refetch()}
            className="min-h-0 rounded-xl border py-6"
          />
        ) : notes.length === 0 ? (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No internal notes yet. Notes you add here are visible only to the assigned consultant
            and admins.
          </p>
        ) : (
          <div className="space-y-3">
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id} className="rounded-lg border bg-muted/20 p-4">
                  <p className="text-sm leading-6 break-words whitespace-pre-wrap">{note.body}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {note.authorUserId === session?.user.id
                      ? "You"
                      : `Team member ${shortReference(note.authorUserId)}`}{" "}
                    · {formatConsultingDateTime(note.createdAt)}
                  </p>
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
          </div>
        )}
      </section>
    </div>
  );
}
