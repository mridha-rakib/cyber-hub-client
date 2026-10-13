"use client";

import { History, Lock } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { DefaultValues, Path, UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { OperationalAudience } from "@/hooks/use-consulting";
import {
  useCreateFinding,
  useRefreshAssessment,
  useRefreshFinding,
  useUpdateFinding,
} from "@/hooks/use-security-work";
import { useZodForm } from "@/hooks/use-zod-form";
import { isApiError } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import { showNotification } from "@/stores/notification.store";
import {
  type Assessment,
  FINDING_SEVERITIES,
  type Finding,
  type FindingCreateInput,
  type FindingUpdateInput,
} from "@/types/security-work";
import { describeSecurityWorkError, type SecurityWorkFailure } from "./security-work-errors";
import { FINDING_SEVERITY_LABELS, FINDING_STATUS_LABELS } from "./security-work-labels";
import {
  findingActionsFor,
  findingCreateLockReason,
  findingLockReason,
} from "./security-work-rules";
import { FailureAlert } from "./security-work-ui";

/** Client-side usability checks only; the API's strict DTO remains authoritative. */
const findingFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a title for the finding"),
  severity: z.enum(FINDING_SEVERITIES, { message: "Choose a severity" }),
  description: z.string().trim(),
  evidenceSummary: z.string().trim(),
  recommendation: z.string().trim().min(1, "Enter the remediation guidance"),
});

type FindingFormValues = z.input<typeof findingFormSchema>;
type FindingFormOutput = z.output<typeof findingFormSchema>;
type FindingForm = UseFormReturn<FindingFormValues, unknown, FindingFormOutput>;
type ContentField = keyof FindingFormOutput;

const CONTENT_FIELDS: ContentField[] = [
  "title",
  "severity",
  "description",
  "evidenceSummary",
  "recommendation",
];

const FIELD_LABELS: Record<ContentField, string> = {
  title: "Title",
  severity: "Severity",
  description: "Technical description",
  evidenceSummary: "Evidence summary",
  recommendation: "Recommendation",
};

const EMPTY_VALUES: DefaultValues<FindingFormValues> = {
  title: "",
  severity: undefined,
  description: "",
  evidenceSummary: "",
  recommendation: "",
};

function valuesOf(finding: Finding): FindingFormValues {
  return {
    title: finding.title,
    severity: finding.severity,
    description: finding.description ?? "",
    evidenceSummary: finding.evidenceSummary ?? "",
    recommendation: finding.recommendation,
  };
}

/** API-FND-001 payload: optional text is omitted when empty, never sent blank. */
function toCreatePayload(values: FindingFormOutput): FindingCreateInput {
  return {
    title: values.title,
    severity: values.severity,
    recommendation: values.recommendation,
    ...(values.description ? { description: values.description } : {}),
    ...(values.evidenceSummary ? { evidenceSummary: values.evidenceSummary } : {}),
  };
}

/**
 * API-FND-004 payload: only the fields that differ from the version being
 * edited. The DTO cannot clear an optional text once recorded, so a cleared
 * field is reported back to the user instead of being silently dropped.
 */
function toUpdatePayload(values: FindingFormOutput, baseline: Finding) {
  const changes: Omit<FindingUpdateInput, "expectedStateVersion"> = {};
  const cleared: ContentField[] = [];
  if (values.title !== baseline.title) changes.title = values.title;
  if (values.severity !== baseline.severity) changes.severity = values.severity;
  if (values.recommendation !== baseline.recommendation) {
    changes.recommendation = values.recommendation;
  }
  for (const key of ["description", "evidenceSummary"] as const) {
    if (values[key] === (baseline[key] ?? "")) continue;
    if (values[key]) changes[key] = values[key];
    else cleared.push(key);
  }
  return { changes, cleared };
}

function applyServerFieldErrors(form: FindingForm, error: unknown) {
  if (!isApiError(error) || !error.hasValidationErrors) return;
  for (const [field, messages] of Object.entries(error.errors)) {
    if ((CONTENT_FIELDS as string[]).includes(field) && messages[0]) {
      form.setError(field as ContentField, { message: messages[0] });
    }
  }
}

// --- Create (API-FND-001) ------------------------------------------------------

export function CreateFindingForm({
  audience,
  assessment,
  onClose,
}: {
  audience: OperationalAudience;
  assessment: Assessment;
  onClose: () => void;
}) {
  const mutation = useCreateFinding(audience, assessment.id);
  const refreshAssessment = useRefreshAssessment(audience, assessment.id);
  const form = useZodForm<FindingFormValues, FindingFormOutput>(findingFormSchema, {
    defaultValues: EMPTY_VALUES,
  });
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);
  const blocked = findingCreateLockReason(assessment.status);

  const submit = async (values: FindingFormOutput) => {
    setFailure(null);
    try {
      await mutation.mutateAsync(toCreatePayload(values));
      showNotification({ type: "success", message: "Finding recorded." });
      form.reset(EMPTY_VALUES);
      onClose();
    } catch (error) {
      applyServerFieldErrors(form, error);
      const next = describeSecurityWorkError(error, {
        subject: "assessment",
        action: "record this finding",
        preserved: "Everything you entered is still here.",
      });
      setFailure(next);
      if (next.refresh) await refreshAssessment();
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-5 rounded-xl border p-4"
        aria-label="Record a finding"
        noValidate
      >
        <h3 className="font-medium">Record a finding</h3>
        <FindingFields form={form} />
        {blocked && <LockNotice>{blocked} Your entries are kept so you can copy them.</LockNotice>}
        {failure && <FailureAlert failure={failure} onRefresh={refreshAssessment} />}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending || Boolean(blocked)}>
            {mutation.isPending ? "Recording finding…" : "Record finding"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// --- Edit (API-FND-004) --------------------------------------------------------

/**
 * Edits are based on the version the user started from. If the server copy
 * moves on (a 409 STATE_VERSION_CONFLICT or a refresh), saving is paused
 * until the user has seen what changed and explicitly continues on the
 * latest version — unsaved input stays in the form throughout and is never
 * overwritten or force-saved.
 */
export function EditFindingForm({
  audience,
  finding,
  parent,
  onClose,
}: {
  audience: OperationalAudience;
  finding: Finding;
  parent: Assessment;
  onClose: () => void;
}) {
  const mutation = useUpdateFinding(audience, finding.id);
  const refreshFinding = useRefreshFinding(audience);
  const form = useZodForm<FindingFormValues, FindingFormOutput>(findingFormSchema, {
    defaultValues: valuesOf(finding),
  });
  const [baseline, setBaseline] = useState<Finding>(finding);
  const [awaitVersion, setAwaitVersion] = useState<number | null>(null);
  const [failure, setFailure] = useState<SecurityWorkFailure | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const editable = findingActionsFor(parent.status, finding.status).edit;
  const lockReason = editable
    ? null
    : (findingLockReason(parent.status, finding.status) ??
      "Editing isn't available for this finding right now.");
  const stale = finding.stateVersion !== baseline.stateVersion;
  const caughtUp = awaitVersion === null || finding.stateVersion >= awaitVersion;
  const changedElsewhere = stale
    ? CONTENT_FIELDS.filter((key) => (baseline[key] ?? "") !== (finding[key] ?? ""))
    : [];
  const statusChanged = stale && baseline.status !== finding.status;

  const continueOnLatest = () => {
    setBaseline(finding);
    setAwaitVersion(null);
    setFailure(null);
  };

  const submit = async (values: FindingFormOutput) => {
    setFailure(null);
    setNotice(null);
    const { changes, cleared } = toUpdatePayload(values, baseline);
    if (cleared.length > 0) {
      for (const key of cleared) {
        form.setError(key, {
          message: `${FIELD_LABELS[key]} can't be removed once recorded. Update the text instead.`,
        });
      }
      return;
    }
    if (Object.keys(changes).length === 0) {
      setNotice("There are no changes to save.");
      return;
    }
    try {
      await mutation.mutateAsync({ ...changes, expectedStateVersion: baseline.stateVersion });
      showNotification({ type: "success", message: "Finding updated." });
      onClose();
    } catch (error) {
      applyServerFieldErrors(form, error);
      const next = describeSecurityWorkError(error, {
        subject: "finding",
        action: "save these changes",
        preserved: "Your unsaved changes are still in the form.",
      });
      setFailure(next);
      if (next.kind === "version") {
        setAwaitVersion(next.currentStateVersion ?? baseline.stateVersion + 1);
      }
      if (next.refresh) await refreshFinding(finding);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-5"
        aria-label="Edit finding"
        noValidate
      >
        <FindingFields form={form} />

        {stale && editable && (
          <Alert className="gap-1 rounded-xl px-4 py-3.5">
            <History aria-hidden="true" />
            <AlertTitle>A newer version of this finding exists</AlertTitle>
            <AlertDescription className="space-y-3">
              <p>
                Saving is paused so nothing is overwritten. Your unsaved changes are still in the
                form. Review the latest saved values, then continue editing on the latest version.
              </p>
              {(changedElsewhere.length > 0 || statusChanged) && (
                <dl className="space-y-2 rounded-lg bg-muted/50 p-3 text-foreground">
                  {statusChanged && (
                    <LatestValue label="Status" value={FINDING_STATUS_LABELS[finding.status]} />
                  )}
                  {changedElsewhere.map((key) => (
                    <LatestValue
                      key={key}
                      label={FIELD_LABELS[key]}
                      value={
                        key === "severity"
                          ? FINDING_SEVERITY_LABELS[finding.severity]
                          : (finding[key] ?? "")
                      }
                    />
                  ))}
                </dl>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!caughtUp}
                onClick={continueOnLatest}
              >
                {caughtUp ? "Continue on the latest version" : "Loading the latest version…"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {lockReason && (
          <LockNotice>{lockReason} Your unsaved changes are kept so you can copy them.</LockNotice>
        )}
        {notice && (
          <p className="text-sm text-muted-foreground" role="status">
            {notice}
          </p>
        )}
        {failure && <FailureAlert failure={failure} onRefresh={() => refreshFinding(finding)} />}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" disabled={mutation.isPending} onClick={onClose}>
            Discard changes
          </Button>
          <Button type="submit" disabled={mutation.isPending || stale || Boolean(lockReason)}>
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function LatestValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted-foreground">Latest {label.toLowerCase()}</dt>
      <dd className="mt-0.5 line-clamp-3 text-sm break-words whitespace-pre-wrap">
        {value || <span className="text-muted-foreground">Not recorded</span>}
      </dd>
    </div>
  );
}

function LockNotice({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-sm" role="status">
      <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

// --- Shared fields ---------------------------------------------------------------

function FindingFields({ form }: { form: FindingForm }) {
  return (
    <div className="space-y-5">
      <TextField form={form} name="title" label="Title" />
      <SeverityField form={form} />
      <TextAreaField
        form={form}
        name="description"
        label="Technical description"
        optional
        description="What the issue is and where it was observed."
        minHeight="min-h-28"
      />
      <TextAreaField
        form={form}
        name="evidenceSummary"
        label="Evidence summary"
        optional
        description="A written summary of the supporting evidence. Never include passwords, keys or other secrets."
        minHeight="min-h-24"
      />
      <TextAreaField
        form={form}
        name="recommendation"
        label="Recommendation"
        description="The remediation guidance for this finding."
        minHeight="min-h-28"
      />
    </div>
  );
}

function SeverityField({ form }: { form: FindingForm }) {
  return (
    <FormField
      control={form.control}
      name="severity"
      render={({ field, fieldState }) => (
        <fieldset aria-describedby={fieldState.error ? `${field.name}-error` : undefined}>
          <legend className="text-sm font-medium">Severity</legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FINDING_SEVERITIES.map((severity) => {
              const selected = field.value === severity;
              return (
                <label
                  key={severity}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                    selected
                      ? "border-foreground/60 bg-muted/60 font-medium"
                      : "hover:border-foreground/25 hover:bg-muted/30",
                  )}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={severity}
                    checked={selected}
                    onChange={() => field.onChange(severity)}
                    onBlur={field.onBlur}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      selected ? "border-foreground bg-foreground" : "border-input",
                    )}
                  >
                    {selected && <span className="size-1.5 rounded-full bg-background" />}
                  </span>
                  {FINDING_SEVERITY_LABELS[severity]}
                </label>
              );
            })}
          </div>
          {fieldState.error && (
            <p id={`${field.name}-error`} className="mt-2 text-sm text-destructive" role="alert">
              {fieldState.error.message}
            </p>
          )}
        </fieldset>
      )}
    />
  );
}

type FieldProps = {
  form: FindingForm;
  name: Path<FindingFormValues>;
  label: string;
  description?: string;
  optional?: boolean;
};

function FieldLabel({ label, optional }: { label: string; optional?: boolean }) {
  return (
    <FormLabel>
      {label}
      {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
    </FormLabel>
  );
}

function TextField({ form, name, label, description, optional }: FieldProps) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel label={label} optional={optional} />
          <FormControl>
            <Input
              {...field}
              value={(field.value as string | undefined) ?? ""}
              autoComplete="off"
              className="h-10"
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function TextAreaField({
  form,
  name,
  label,
  description,
  optional,
  minHeight,
}: FieldProps & { minHeight: string }) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FieldLabel label={label} optional={optional} />
          <FormControl>
            <Textarea
              {...field}
              value={(field.value as string | undefined) ?? ""}
              className={cn(minHeight, "leading-6")}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
