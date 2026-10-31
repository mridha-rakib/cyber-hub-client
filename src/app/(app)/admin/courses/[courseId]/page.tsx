"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ErrorState, ForbiddenState, NotFoundState, PageLoading } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmPanel } from "@/features/consulting/lifecycle-actions";
import { formatDateTime, PlainText } from "@/features/learning-content/content-ui";
import {
  CourseForm,
  type CourseFormErrors,
  type CourseFormValues,
  courseToFormValues,
  toCourseUpdateInput,
  validateCourseForm,
} from "@/features/learning-content/course-form";
import {
  classifyMutationError,
  VERSION_CONFLICT_DELETE_MESSAGE,
} from "@/features/learning-content/mutation-errors";
import {
  useAdminCourse,
  useApproveCourse,
  useDeleteCourse,
  useRejectCourse,
  useUpdateCourse,
} from "@/hooks/use-courses";
import { isApiError } from "@/lib/errors/api-error";
import { showNotification } from "@/stores/notification.store";
import type { AdminCourse } from "@/types/course";

type PendingAction = "approve" | "reject" | "delete" | null;

interface Banner {
  tone: "error" | "warning";
  message: string;
}

const NOTE_MAX = 2000;
const REASON_MAX = 1000;

/** Why Approve is unavailable for the saved record (UI-DEC-028 / UI-AC-036), or null. */
function approvalBlocker(course: AdminCourse): string | null {
  if (course.hasAffiliateRelationship === null) {
    return "Affiliate relationship is Not declared. Declare Yes or No and save before approving.";
  }
  if (course.hasAffiliateRelationship && !course.affiliateDisclosure?.trim()) {
    return "Add the affiliate disclosure and save before approving.";
  }
  if (course.expiresAt && new Date(course.expiresAt).getTime() <= Date.now()) {
    return "This deal has expired, so it can't be approved. Update the end date first.";
  }
  return null;
}

/**
 * UI-ADM-007 detail/editor. Edit is allowed for DRAFT and REJECTED deals only;
 * an APPROVED deal is read-only until withdrawn. Every save, command and
 * delete sends the displayed stateVersion; 409s keep unsaved input, refetch,
 * and never resubmit automatically (UI-DEC-030). Notes and reasons appear
 * only here, on Admin screens (UI-DEC-029).
 */
export default function AdminCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { data: record, isPending, isError, error, refetch } = useAdminCourse(courseId);

  const update = useUpdateCourse(courseId);
  const approve = useApproveCourse(courseId);
  const reject = useRejectCourse(courseId);
  const remove = useDeleteCourse(courseId);

  const [baseline, setBaseline] = useState<{ values: CourseFormValues; version: number } | null>(
    null,
  );
  const [values, setValues] = useState<CourseFormValues | null>(null);
  const [errors, setErrors] = useState<CourseFormErrors>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const adopt = (next: AdminCourse) => {
    const nextValues = courseToFormValues(next);
    setBaseline({ values: nextValues, version: next.stateVersion });
    setValues(nextValues);
    setErrors({});
  };

  const dirty =
    baseline !== null &&
    values !== null &&
    toCourseUpdateInput(baseline.values, values, 1) !== null;

  useEffect(() => {
    if (!record) return;
    if (baseline === null || (!dirty && record.stateVersion !== baseline.version)) {
      const nextValues = courseToFormValues(record);
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

  const status = record.approvalStatus;
  const editable = status !== "APPROVED";
  const busy = update.isPending || approve.isPending || reject.isPending || remove.isPending;
  const blocker = approvalBlocker(record);

  const closePanels = () => {
    setPending(null);
    setNote("");
    setReason("");
    setReasonError(null);
  };

  const afterFailure = async (caught: unknown, deleting = false) => {
    const info = classifyMutationError(caught);
    let message = info.message;
    if (deleting && info.kind === "version-conflict") message = VERSION_CONFLICT_DELETE_MESSAGE;
    if (deleting && info.kind === "validation") {
      message = "The course deal could not be deleted. Nothing was changed.";
    }
    setBanner({ tone: info.kind === "validation" && !deleting ? "error" : "warning", message });
    return info;
  };

  const save = async () => {
    setBanner(null);
    const clientErrors = validateCourseForm(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) {
      setBanner({ tone: "error", message: "Check the highlighted fields. Nothing was saved." });
      return;
    }
    const patch = toCourseUpdateInput(baseline.values, values, record.stateVersion);
    if (!patch) return;
    try {
      adopt(await update.mutateAsync(patch));
      showNotification({ type: "success", message: "Course deal saved." });
    } catch (caught) {
      const info = await afterFailure(caught);
      setErrors(info.fieldErrors);
      if (info.kind === "version-conflict" || info.kind === "state-conflict") await refetch();
    }
  };

  const runApprove = async () => {
    setBanner(null);
    try {
      const trimmed = note.trim();
      adopt(
        await approve.mutateAsync({
          expectedStateVersion: record.stateVersion,
          ...(trimmed ? { verificationNote: trimmed } : {}),
        }),
      );
      closePanels();
      showNotification({ type: "success", message: "Course deal approved and listed publicly." });
    } catch (caught) {
      const info = await afterFailure(caught);
      closePanels();
      if (info.kind !== "session" && info.kind !== "forbidden") await refetch();
    }
  };

  const runReject = async () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError("A reason is required.");
      return;
    }
    if (trimmed.length > REASON_MAX) {
      setReasonError(`At most ${REASON_MAX} characters.`);
      return;
    }
    setReasonError(null);
    setBanner(null);
    const withdrawing = status === "APPROVED";
    try {
      adopt(
        await reject.mutateAsync({ expectedStateVersion: record.stateVersion, reason: trimmed }),
      );
      closePanels();
      showNotification({
        type: "success",
        message: withdrawing ? "Course deal withdrawn." : "Course deal rejected.",
      });
    } catch (caught) {
      const info = await afterFailure(caught);
      closePanels();
      if (info.kind !== "session" && info.kind !== "forbidden") await refetch();
    }
  };

  const runDelete = async () => {
    setBanner(null);
    try {
      await remove.mutateAsync(record.stateVersion);
      showNotification({ type: "success", message: "Course deal deleted." });
      router.replace("/admin/courses");
    } catch (caught) {
      // Nothing was deleted; another delete needs a new confirmation.
      const info = await afterFailure(caught, true);
      closePanels();
      if (info.kind !== "session" && info.kind !== "forbidden") await refetch();
    }
  };

  const discard = () => {
    adopt(record);
    setBanner(null);
  };

  const affiliateText =
    record.hasAffiliateRelationship === true
      ? "Yes"
      : record.hasAffiliateRelationship === false
        ? "No"
        : "Not declared";

  return (
    <div className="flex flex-col gap-4">
      <Link href="/admin/courses" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to course deals
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
              <dt>Affiliate</dt>
              <dd
                className={
                  record.hasAffiliateRelationship === null ? "text-destructive" : undefined
                }
              >
                {affiliateText}
              </dd>
              <dt>Created</dt>
              <dd>{formatDateTime(record.createdAt)}</dd>
              <dt>Last updated</dt>
              <dd>{formatDateTime(record.updatedAt)}</dd>
            </dl>
          </div>
          <div className="flex items-center gap-2">
            {status === "APPROVED" && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/courses/${record.id}`} target="_blank">
                  View public page
                </Link>
              </Button>
            )}
            <StatusBadge status={status} />
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

          {(record.verificationNote || record.rejectionReason) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {record.verificationNote && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">Verification note</p>
                  <PlainText
                    text={record.verificationNote}
                    className="mt-1 text-muted-foreground"
                  />
                </div>
              )}
              {record.rejectionReason && (
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">Rejection / withdrawal reason</p>
                  <PlainText text={record.rejectionReason} className="mt-1 text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          <section aria-label="Approval" className="flex flex-col gap-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Approval</p>
            {dirty ? (
              <p className="text-sm text-muted-foreground">
                Save or discard your changes before approving, rejecting or deleting.
              </p>
            ) : pending === "approve" ? (
              <ConfirmPanel
                title="Approve this course deal?"
                confirmLabel={approve.isPending ? "Approving…" : "Approve"}
                pending={approve.isPending}
                onConfirm={runApprove}
                onCancel={closePanels}
              >
                <p>
                  Confirm you have checked the provider&apos;s current prices and terms. Approved
                  deals appear in the public catalogue while active.
                </p>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="course-verification-note" className="text-foreground">
                    Verification note (optional, admin only)
                  </Label>
                  <Textarea
                    id="course-verification-note"
                    rows={3}
                    maxLength={NOTE_MAX}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <span className="text-xs">
                    {note.trim().length}/{NOTE_MAX}
                  </span>
                </div>
              </ConfirmPanel>
            ) : pending === "reject" ? (
              <ConfirmPanel
                title={
                  status === "APPROVED" ? "Withdraw this course deal?" : "Reject this course deal?"
                }
                confirmLabel={
                  reject.isPending
                    ? status === "APPROVED"
                      ? "Withdrawing…"
                      : "Rejecting…"
                    : status === "APPROVED"
                      ? "Withdraw"
                      : "Reject"
                }
                pending={reject.isPending}
                onConfirm={runReject}
                onCancel={closePanels}
              >
                {status === "APPROVED" && (
                  <p>It is removed from the public catalogue immediately.</p>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="course-reason" className="text-foreground">
                    Reason (required, admin only)
                  </Label>
                  <Textarea
                    id="course-reason"
                    rows={3}
                    maxLength={REASON_MAX}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    aria-invalid={Boolean(reasonError)}
                    aria-describedby={reasonError ? "course-reason-error" : undefined}
                  />
                  {reasonError && (
                    <p id="course-reason-error" className="text-sm text-destructive" role="alert">
                      {reasonError}
                    </p>
                  )}
                </div>
              </ConfirmPanel>
            ) : pending === "delete" ? (
              <ConfirmPanel
                title="Delete this course deal permanently?"
                confirmLabel={remove.isPending ? "Deleting…" : "Delete"}
                pending={remove.isPending}
                onConfirm={runDelete}
                onCancel={closePanels}
              >
                <p>This can&apos;t be undone.</p>
              </ConfirmPanel>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {(status === "DRAFT" || status === "REJECTED") && (
                    <Button
                      size="sm"
                      disabled={busy || blocker !== null}
                      onClick={() => setPending("approve")}
                      aria-describedby={blocker ? "course-approve-blocker" : undefined}
                    >
                      Approve
                    </Button>
                  )}
                  {status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setPending("reject")}
                    >
                      Reject
                    </Button>
                  )}
                  {status === "APPROVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => setPending("reject")}
                    >
                      Withdraw
                    </Button>
                  )}
                  {status !== "APPROVED" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={busy}
                      onClick={() => setPending("delete")}
                    >
                      Delete
                    </Button>
                  )}
                </div>
                {status !== "APPROVED" && blocker && (
                  <p id="course-approve-blocker" className="text-sm text-muted-foreground">
                    {blocker}
                  </p>
                )}
              </>
            )}
          </section>

          {!editable && (
            <p className="text-sm font-medium text-muted-foreground">
              Approved deals are read-only. Withdraw to edit.
            </p>
          )}

          <CourseForm
            values={values}
            onChange={setValues}
            errors={errors}
            disabled={busy || !editable}
            onSubmit={save}
            actions={
              editable ? (
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
              ) : undefined
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
