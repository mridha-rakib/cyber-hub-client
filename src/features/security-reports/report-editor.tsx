"use client";

import { History, Lock } from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  describeSecurityWorkError,
  type SecurityWorkFailure,
} from "@/features/security-work/security-work-errors";
import { FailureAlert } from "@/features/security-work/security-work-ui";
import type { OperationalAudience } from "@/hooks/use-consulting";
import { useRefreshReport, useSaveReportDraft } from "@/hooks/use-security-reports";
import { showNotification } from "@/stores/notification.store";
import type { OperationalReport } from "@/types/security-report";
import {
  analyseDraftContent,
  buildDraftContent,
  NARRATIVE_FIELDS,
  type NarrativeKey,
  type NarrativeValues,
  preservedValueText,
} from "./report-content";

/** Local, unsaved editor state, lifted so workflow actions can see it. */
export interface DraftEditState {
  /** Only the fields the user has typed in; untouched fields follow the saved report. */
  edits: Partial<NarrativeValues> | null;
  /** The report version the edits are based on (the CAS expectedStateVersion). */
  base: OperationalReport | null;
}

/** Fields whose local text differs from the version the edits started from. */
function changedDraftFields(state: DraftEditState): NarrativeKey[] {
  const { edits, base } = state;
  if (!edits || !base) return [];
  const baseValues = analyseDraftContent(base.draftContent).values;
  return NARRATIVE_FIELDS.map((field) => field.key).filter(
    (key) => edits[key] !== undefined && edits[key] !== baseValues[key],
  );
}

export function hasUnsavedDraft(state: DraftEditState): boolean {
  return changedDraftFields(state).length > 0;
}

/**
 * D6D-1 report editor: three optional plain-text fields merged into the
 * stored draftContent object (unknown keys preserved). Saves always send the
 * version the edits started from and only the fields the user changed. If the
 * report changed meanwhile, saving pauses: untouched fields take the latest
 * saved text, and a field changed on both sides must be resolved explicitly
 * before continuing — nothing is resubmitted automatically and the user's
 * text is kept.
 */
export function ReportContentEditor({
  audience,
  report,
  editable,
  state,
  onStateChange,
}: {
  audience: OperationalAudience;
  report: OperationalReport;
  editable: boolean;
  state: DraftEditState;
  onStateChange: (next: DraftEditState) => void;
}) {
  const ids = useId();
  const save = useSaveReportDraft(audience, report.id);
  const refreshReport = useRefreshReport(audience, report.id);
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  /** Same-field conflicts the user chose to overwrite, keyed to the version they reviewed. */
  const [keptMine, setKeptMine] = useState<Partial<Record<NarrativeKey, number>>>({});

  const saved = analyseDraftContent(report.draftContent);
  const base = state.base ?? report;
  const baseAnalysis = analyseDraftContent(base.draftContent);
  const values: NarrativeValues = { ...saved.values, ...state.edits };
  const changed = changedDraftFields(state);
  const dirty = changed.length > 0;
  const stale = state.base !== null && state.base.stateVersion !== report.stateVersion;
  const blockReason = saved.blockReason ?? baseAnalysis.blockReason;
  const canEdit = editable && !blockReason && !stale;
  const serverChanged = stale
    ? NARRATIVE_FIELDS.filter((field) => baseAnalysis.values[field.key] !== saved.values[field.key])
    : [];
  const conflicts = NARRATIVE_FIELDS.filter(
    (field) =>
      serverChanged.includes(field) &&
      changed.includes(field.key) &&
      state.edits?.[field.key] !== saved.values[field.key],
  );
  const unresolved = conflicts.filter((field) => keptMine[field.key] !== report.stateVersion);

  const reset = () => {
    setKeptMine({});
    onStateChange({ edits: null, base: null });
  };

  const change = (key: NarrativeKey, value: string) => {
    setNotice(null);
    onStateChange(
      state.edits && state.base
        ? { ...state, edits: { ...state.edits, [key]: value } }
        : { base: report, edits: { [key]: value } },
    );
  };

  const takeSavedText = (key: NarrativeKey) => {
    if (!state.edits) return;
    const { [key]: _dropped, ...rest } = state.edits;
    // The save error says unsaved text was kept; drop it once none is left.
    // Conflict state is derived from edits, so this hides no open conflict.
    if (!changed.some((other) => other !== key)) setFailure(null);
    if (Object.keys(rest).length === 0) reset();
    else onStateChange({ ...state, edits: rest });
  };

  /** Re-bases only the user's real changes; untouched fields keep the latest saved text. */
  const continueOnLatest = () => {
    if (!state.edits || unresolved.length > 0) return;
    setFailure(null);
    const edits: Partial<NarrativeValues> = {};
    for (const key of changed) {
      const value = state.edits[key];
      if (value !== undefined && value !== saved.values[key]) edits[key] = value;
    }
    setKeptMine({});
    onStateChange(
      Object.keys(edits).length > 0 ? { base: report, edits } : { edits: null, base: null },
    );
  };

  const submit = async () => {
    setFailure(null);
    setNotice(null);
    if (!state.edits || !state.base || stale) return;
    if (!dirty) {
      setNotice("There are no changes to save.");
      return;
    }
    try {
      await save.mutateAsync({
        draftContent: buildDraftContent(baseAnalysis.original, {
          ...baseAnalysis.values,
          ...state.edits,
        }),
        expectedStateVersion: state.base.stateVersion,
      });
      reset();
      showNotification({ type: "success", message: "Draft saved." });
    } catch (error) {
      const next = describeSecurityWorkError(error, {
        subject: "report",
        action: "save the draft",
        preserved: "Your unsaved text is still in the editor.",
      });
      setFailure(next);
      if (next.refresh) await refreshReport();
    }
  };

  return (
    <div className="space-y-5">
      {blockReason && (
        <p
          className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm"
          role="note"
        >
          <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span>{blockReason}</span>
        </p>
      )}

      {NARRATIVE_FIELDS.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label htmlFor={`${ids}-${field.key}`}>{field.label}</Label>
          <p id={`${ids}-${field.key}-help`} className="text-xs leading-5 text-muted-foreground">
            {field.help} Optional while drafting.
          </p>
          {canEdit ? (
            <Textarea
              id={`${ids}-${field.key}`}
              value={values[field.key]}
              onChange={(event) => change(field.key, event.target.value)}
              aria-describedby={`${ids}-${field.key}-help`}
              className="min-h-28 leading-6"
            />
          ) : (
            <div
              id={`${ids}-${field.key}`}
              className="min-h-10 rounded-lg border bg-muted/30 px-3 py-2 text-sm leading-6 whitespace-pre-wrap break-words"
            >
              {values[field.key] || <span className="text-muted-foreground">Not written</span>}
            </div>
          )}
        </div>
      ))}

      {saved.unknownKeys.length > 0 && (
        <section aria-label="Other saved content" className="space-y-2 rounded-xl border p-4">
          <h3 className="text-sm font-medium">Other saved content</h3>
          <p className="text-xs text-muted-foreground">
            This report contains content the editor doesn&apos;t author. It is kept exactly as it is
            when you save.
          </p>
          <dl className="space-y-3">
            {saved.unknownKeys.map((key) => (
              <div key={key}>
                <dt className="font-mono text-xs text-muted-foreground">{key}</dt>
                <dd>
                  <pre className="mt-1 max-h-48 overflow-auto rounded-lg bg-muted/40 p-2 text-xs whitespace-pre-wrap break-words">
                    {preservedValueText(saved.original[key])}
                  </pre>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {stale && (
        <Alert className="gap-1 rounded-xl px-4 py-3.5">
          <History aria-hidden="true" />
          <AlertTitle>A newer version of this report exists</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              Saving is paused so nothing is overwritten. Your unsaved text is kept.
              {serverChanged.length > 0
                ? ` Saved text changed in: ${serverChanged.map((field) => field.label).join(", ")}. Sections you didn't edit now show the latest saved text.`
                : " The saved text itself is unchanged."}
            </p>
            {report.status === "DRAFT" ? (
              <>
                {conflicts.map((field) => {
                  const kept = keptMine[field.key] === report.stateVersion;
                  return (
                    <fieldset
                      key={field.key}
                      aria-label={`${field.label} conflict`}
                      className="space-y-2 rounded-lg border bg-background p-3"
                    >
                      <p className="font-medium text-foreground">
                        {field.label} was changed by you and in the saved version
                      </p>
                      <p className="text-xs">Latest saved text (your text is shown above):</p>
                      <pre className="max-h-48 overflow-auto rounded-lg bg-muted/40 p-2 text-xs whitespace-pre-wrap break-words">
                        {saved.values[field.key] || "Not written"}
                      </pre>
                      {kept ? (
                        <p role="status">
                          You chose to keep your text. It will replace the saved text when you save.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => takeSavedText(field.key)}
                          >
                            Use saved text
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setKeptMine({ ...keptMine, [field.key]: report.stateVersion })
                            }
                          >
                            Keep my text
                          </Button>
                        </div>
                      )}
                    </fieldset>
                  );
                })}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={unresolved.length > 0}
                  onClick={continueOnLatest}
                >
                  I&apos;ve reviewed it — continue on the latest version
                </Button>
                {unresolved.length > 0 && (
                  <p>Choose which text to keep for each conflicting section first.</p>
                )}
              </>
            ) : (
              <p>
                The report is no longer a draft, so it can&apos;t be edited. Copy any text you need.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {notice && (
        <p className="text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      )}
      {failure && <FailureAlert failure={failure} onRefresh={refreshReport} />}

      {editable && !blockReason && (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {state.edits && (
            <Button
              type="button"
              variant="ghost"
              disabled={save.isPending}
              onClick={() => {
                setFailure(null);
                setNotice(null);
                reset();
              }}
            >
              Discard changes
            </Button>
          )}
          <Button type="button" disabled={save.isPending || stale || !dirty} onClick={submit}>
            {save.isPending ? "Saving draft…" : "Save draft"}
          </Button>
        </div>
      )}
    </div>
  );
}
