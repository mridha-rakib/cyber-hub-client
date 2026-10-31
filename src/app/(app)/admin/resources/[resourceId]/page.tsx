"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorState, ForbiddenState, NotFoundState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmPanel } from "@/features/consulting/lifecycle-actions";
import { formatDateTime } from "@/features/learning-content/content-ui";
import {
  classifyMutationError,
  VERSION_CONFLICT_DELETE_MESSAGE,
} from "@/features/learning-content/mutation-errors";
import {
  ResourceForm,
  type ResourceFormErrors,
  type ResourceFormValues,
  resourceToFormValues,
  toResourceUpdateInput,
  validateResourceForm,
} from "@/features/learning-content/resource-form";
import {
  useAdminResource,
  useArchiveResource,
  useDeleteResource,
  usePublishResource,
  useUpdateResource,
} from "@/hooks/use-resources";
import { isApiError } from "@/lib/errors/api-error";
import { showNotification } from "@/stores/notification.store";
import type { AdminResource } from "@/types/resource";

type PendingAction = "publish" | "archive" | "delete" | null;

interface Banner {
  tone: "error" | "warning";
  message: string;
}

/**
 * UI-ADM-006 detail/editor. Every save, lifecycle command and delete sends the
 * displayed stateVersion (UI-DEC-030 / UI-AC-035 / UI-AC-038). On a 409 the
 * user's unsaved values are kept, the record is refetched, and nothing is
 * resubmitted without a new explicit action.
 */
export default function AdminResourceDetailPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const router = useRouter();
  const { data: record, isPending, isError, error, refetch } = useAdminResource(resourceId);

  const update = useUpdateResource(resourceId);
  const publish = usePublishResource(resourceId);
  const archive = useArchiveResource(resourceId);
  const remove = useDeleteResource(resourceId);

  // `baseline` = the record values the form started from (used to diff the PATCH body).
  const [baseline, setBaseline] = useState<{ values: ResourceFormValues; version: number } | null>(
    null,
  );
  const [values, setValues] = useState<ResourceFormValues | null>(null);
  const [errors, setErrors] = useState<ResourceFormErrors>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const adopt = (next: AdminResource) => {
    const nextValues = resourceToFormValues(next);
    setBaseline({ values: nextValues, version: next.stateVersion });
    setValues(nextValues);
    setErrors({});
  };

  const dirty =
    baseline !== null &&
    values !== null &&
    toResourceUpdateInput(baseline.values, values, 1) !== null;

  // First load, and any newer server version while the form has no unsaved edits.
  useEffect(() => {
    if (!record) return;
    if (baseline === null || (!dirty && record.stateVersion !== baseline.version)) {
      const nextValues = resourceToFormValues(record);
      setBaseline({ values: nextValues, version: record.stateVersion });
      setValues(nextValues);
    }
  }, [record, baseline, dirty]);

  if (isPending) return <PageLoading />;
  if (isError && !record) {
    if (isApiError(error) && error.status === 403) return <ForbiddenState />;
    if (isApiError(error) && [400, 404, 422].includes(error.status ?? 0)) return <NotFoundState />;
    return <ErrorState onRetry={() => refetch()} />;
  }
  if (!record || !baseline || !values) return <PageLoading />;

  const busy = update.isPending || publish.isPending || archive.isPending || remove.isPending;

  const save = async () => {
    setBanner(null);
    const clientErrors = validateResourceForm(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setBanner({ tone: "error", message: "Check the highlighted fields. Nothing was saved." });
      return;
    }
    const patch = toResourceUpdateInput(baseline.values, values, record.stateVersion);
    if (!patch) return;
    try {
      const saved = await update.mutateAsync(patch);
      adopt(saved);
      showNotification({ type: "success", message: "Resource saved." });
    } catch (caught) {
      const info = classifyMutationError(caught);
      setErrors(info.fieldErrors);
      setBanner({ tone: info.kind === "validation" ? "error" : "warning", message: info.message });
      if (info.kind === "version-conflict" || info.kind === "state-conflict") await refetch();
    }
  };

  const runLifecycle = async (action: "publish" | "archive") => {
    setBanner(null);
    try {
      const mutation = action === "publish" ? publish : archive;
      const next = await mutation.mutateAsync(record.stateVersion);
      adopt(next);
      setPending(null);
      showNotification({
        type: "success",
        message: action === "publish" ? "Resource published." : "Resource archived.",
      });
    } catch (caught) {
      const info = classifyMutationError(caught);
      setPending(null);
      setBanner({ tone: "warning", message: info.message });
      if (info.kind !== "session" && info.kind !== "forbidden") await refetch();
    }
  };

  const runDelete = async () => {
    setBanner(null);
    try {
      await remove.mutateAsync(record.stateVersion);
      showNotification({ type: "success", message: "Draft resource deleted." });
      router.replace("/admin/resources");
    } catch (caught) {
      const info = classifyMutationError(caught);
      // Nothing was deleted. A further delete always needs a new confirmation.
      setPending(null);
      setBanner({
        tone: "warning",
        message:
          info.kind === "version-conflict"
            ? VERSION_CONFLICT_DELETE_MESSAGE
            : info.kind === "validation"
              ? "The resource could not be deleted. Nothing was changed."
              : info.message,
      });
      if (info.kind !== "session" && info.kind !== "forbidden") await refetch();
    }
  };

  const discard = () => {
    adopt(record);
    setBanner(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/resources" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to learning resources
      </Link>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>
              <h1 className="break-words text-xl">{record.title}</h1>
            </CardTitle>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <dt>Version</dt>
              <dd>{record.stateVersion}</dd>
              <dt>Created</dt>
              <dd>{formatDateTime(record.createdAt)}</dd>
              <dt>Last updated</dt>
              <dd>{formatDateTime(record.updatedAt)}</dd>
              {record.publishedAt && (
                <>
                  <dt>Published</dt>
                  <dd>{formatDateTime(record.publishedAt)}</dd>
                </>
              )}
            </dl>
          </div>
          <div className="flex items-center gap-2">
            {record.status === "PUBLISHED" && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/resources/${record.id}`} target="_blank">
                  View public page
                </Link>
              </Button>
            )}
            <StatusBadge status={record.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {banner && (
            <div
              role="alert"
              className={
                banner.tone === "error"
                  ? "rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                  : "rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm"
              }
            >
              <p>{banner.message}</p>
              {dirty && banner.tone === "warning" && (
                <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={discard}>
                  Discard my changes and show the latest version
                </Button>
              )}
            </div>
          )}

          <section aria-label="Lifecycle" className="flex flex-col gap-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Publication</p>
            {dirty ? (
              <p className="text-sm text-muted-foreground">
                Save or discard your changes before changing the publication state.
              </p>
            ) : pending === "publish" ? (
              <ConfirmPanel
                title={
                  record.status === "ARCHIVED"
                    ? "Republish this resource?"
                    : "Publish this resource?"
                }
                confirmLabel={publish.isPending ? "Publishing…" : "Publish"}
                pending={publish.isPending}
                onConfirm={() => runLifecycle("publish")}
                onCancel={() => setPending(null)}
              >
                <p>It becomes visible in the public Learning Resources catalogue.</p>
              </ConfirmPanel>
            ) : pending === "archive" ? (
              <ConfirmPanel
                title="Archive this resource?"
                confirmLabel={archive.isPending ? "Archiving…" : "Archive"}
                pending={archive.isPending}
                onConfirm={() => runLifecycle("archive")}
                onCancel={() => setPending(null)}
              >
                <p>It is removed from the public catalogue. You can republish it later.</p>
              </ConfirmPanel>
            ) : pending === "delete" ? (
              <ConfirmPanel
                title="Delete this draft permanently?"
                confirmLabel={remove.isPending ? "Deleting…" : "Delete draft"}
                pending={remove.isPending}
                onConfirm={runDelete}
                onCancel={() => setPending(null)}
              >
                <p>This can't be undone.</p>
              </ConfirmPanel>
            ) : (
              <div className="flex flex-wrap gap-2">
                {record.status === "DRAFT" && (
                  <>
                    <Button size="sm" disabled={busy} onClick={() => setPending("publish")}>
                      Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={() => setPending("delete")}
                    >
                      Delete draft
                    </Button>
                  </>
                )}
                {record.status === "PUBLISHED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setPending("archive")}
                  >
                    Archive
                  </Button>
                )}
                {record.status === "ARCHIVED" && (
                  <Button size="sm" disabled={busy} onClick={() => setPending("publish")}>
                    Republish
                  </Button>
                )}
              </div>
            )}
          </section>

          {record.status === "PUBLISHED" && (
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              Changes go live immediately.
            </p>
          )}

          <ResourceForm
            values={values}
            onChange={setValues}
            errors={errors}
            disabled={busy}
            onSubmit={save}
            actions={
              <>
                <Button type="submit" disabled={busy || !dirty}>
                  {update.isPending ? "Saving…" : "Save changes"}
                </Button>
                {dirty && (
                  <Button type="button" variant="ghost" disabled={busy} onClick={discard}>
                    Discard changes
                  </Button>
                )}
                {!dirty && (
                  <span className="text-xs text-muted-foreground">No unsaved changes</span>
                )}
              </>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
