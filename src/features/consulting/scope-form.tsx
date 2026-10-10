"use client";

import { AlertTriangle, Plus, ShieldCheck, X } from "lucide-react";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateScopeAuthorization } from "@/hooks/use-consulting";
import { isApiError } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import { showNotification } from "@/stores/notification.store";
import {
  CONSULTING_SERVICES,
  type ConsultingService,
  type ScopeAuthorization,
} from "@/types/consulting";
import { describeConsultingError } from "./consulting-errors";
import { CONSULTING_SERVICE_LABELS, isConsultingService, stringArray } from "./consulting-labels";

type Row = { id: number; value: string };
type FieldKey = "authorizedTargets" | "allowedActivities" | "validFrom" | "validUntil";

let rowSeed = 0;
const toRows = (values: string[]): Row[] =>
  (values.length > 0 ? values : [""]).map((value) => ({ id: ++rowSeed, value }));

function toLocalInputValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/**
 * Creates a new explicit scope-authorisation version (API-CON-004). When a
 * current version exists its plain-text values seed the editor, but the
 * attestation is never pre-selected: every version must be confirmed anew.
 */
export function ScopeAuthorizationForm({
  requestId,
  requestedService,
  current,
  onCreated,
  onCancel,
}: {
  requestId: string;
  requestedService: ConsultingService;
  current: ScopeAuthorization | null;
  onCreated: (created: ScopeAuthorization) => void;
  onCancel?: () => void;
}) {
  const ids = useId();
  const mutation = useCreateScopeAuthorization(requestId);
  const currentActivities = stringArray(current?.allowedActivities) ?? [];
  const [targets, setTargets] = useState<Row[]>(() =>
    toRows(stringArray(current?.authorizedTargets) ?? []),
  );
  const [activities, setActivities] = useState<ConsultingService[]>(() =>
    currentActivities.filter(isConsultingService),
  );
  const [restrictions, setRestrictions] = useState<Row[]>(() =>
    toRows(stringArray(current?.restrictions) ?? []),
  );
  const [validFrom, setValidFrom] = useState(() => toLocalInputValue(new Date()));
  const [validUntil, setValidUntil] = useState("");
  const [attested, setAttested] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey | "attestation", string>>>({});
  const [failure, setFailure] = useState<{ title: string; description: string } | null>(null);
  const droppedActivities = currentActivities.some((activity) => !isConsultingService(activity));

  const validate = () => {
    const next: typeof errors = {};
    const cleanTargets = targets.map((row) => row.value.trim()).filter(Boolean);
    if (cleanTargets.length === 0) next.authorizedTargets = "Add at least one authorised target.";
    if (activities.length === 0) next.allowedActivities = "Select at least one allowed activity.";
    if (!validFrom) next.validFrom = "Choose when this authorisation starts.";
    if (validFrom && validUntil && new Date(validUntil) < new Date(validFrom)) {
      next.validUntil = "The end must not be before the start.";
    }
    if (!attested) next.attestation = "Confirm the authorisation to continue.";
    return { next, cleanTargets };
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFailure(null);
    const { next, cleanTargets } = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const cleanRestrictions = restrictions.map((row) => row.value.trim()).filter(Boolean);
    try {
      const created = await mutation.mutateAsync({
        authorizedTargets: cleanTargets,
        allowedActivities: activities,
        ...(cleanRestrictions.length > 0 ? { restrictions: cleanRestrictions } : {}),
        validFrom: new Date(validFrom).toISOString(),
        ...(validUntil ? { validUntil: new Date(validUntil).toISOString() } : {}),
        attestation: true,
      });
      showNotification({
        type: "success",
        message: `Scope authorisation version ${created.versionNo} is now current.`,
      });
      setAttested(false);
      onCreated(created);
    } catch (error) {
      if (isApiError(error) && error.hasValidationErrors) {
        const serverErrors: typeof errors = {};
        for (const key of ["authorizedTargets", "allowedActivities", "validFrom", "validUntil"]) {
          const message = error.fieldError(key);
          if (message) serverErrors[key as FieldKey] = message;
        }
        setErrors(serverErrors);
      }
      setFailure(
        describeConsultingError(error, {
          action: "save this authorisation",
          preserved: "Your entries are still here.",
        }),
      );
    }
  };

  const startsLater = validFrom && new Date(validFrom).getTime() > Date.now() + 60_000;

  return (
    <form onSubmit={submit} className="space-y-7" noValidate>
      <RowEditor
        id={`${ids}-targets`}
        title="Authorised targets"
        description="Each domain, host, application or environment the consultant may work on — one per row."
        rows={targets}
        onChange={setTargets}
        placeholder="e.g. portal.example.com"
        addLabel="Add target"
        error={errors.authorizedTargets}
        mono
      />

      <fieldset
        className="space-y-3"
        aria-describedby={`${ids}-activities-help${errors.allowedActivities ? ` ${ids}-activities-error` : ""}`}
      >
        <legend className="text-sm font-medium">Allowed activities</legend>
        <p id={`${ids}-activities-help`} className="text-sm text-muted-foreground">
          The approved services the consultant may carry out against these targets.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CONSULTING_SERVICES.map((service) => {
            const checked = activities.includes(service);
            const inputId = `${ids}-activity-${service}`;
            return (
              <Label
                key={service}
                htmlFor={inputId}
                className={cn(
                  "cursor-pointer items-start rounded-lg border px-3 py-2.5 leading-5 font-normal transition-colors",
                  checked ? "border-foreground/50 bg-muted/60" : "hover:bg-muted/30",
                )}
              >
                <Checkbox
                  id={inputId}
                  checked={checked}
                  className="mt-0.5"
                  onCheckedChange={(value) =>
                    setActivities((previous) =>
                      value === true
                        ? [...previous, service]
                        : previous.filter((item) => item !== service),
                    )
                  }
                />
                <span>
                  {CONSULTING_SERVICE_LABELS[service]}
                  {service === requestedService && (
                    <span className="block text-xs text-muted-foreground">Requested service</span>
                  )}
                </span>
              </Label>
            );
          })}
        </div>
        {droppedActivities && (
          <p className="text-xs text-muted-foreground">
            Some activities in the current version are outside the approved service list and were
            not copied. Select every activity you want this new version to allow.
          </p>
        )}
        {errors.allowedActivities && (
          <p id={`${ids}-activities-error`} className="text-sm text-destructive" role="alert">
            {errors.allowedActivities}
          </p>
        )}
      </fieldset>

      <RowEditor
        id={`${ids}-restrictions`}
        title="Restrictions"
        optional
        description="Boundaries the consultant must respect, such as excluded systems or time windows."
        rows={restrictions}
        onChange={setRestrictions}
        placeholder="e.g. No testing outside 18:00–22:00"
        addLabel="Add restriction"
        allowEmpty
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <DateField
          id={`${ids}-from`}
          label="Valid from"
          value={validFrom}
          onChange={setValidFrom}
          error={errors.validFrom}
          help={startsLater ? "Delivery cannot start before this time." : "Your local time."}
        />
        <DateField
          id={`${ids}-until`}
          label="Valid until"
          optional
          value={validUntil}
          onChange={setValidUntil}
          error={errors.validUntil}
          help="Leave blank if no end date applies yet."
        />
      </div>

      <div
        className={cn(
          "rounded-xl border bg-muted/30 p-4",
          errors.attestation && !attested && "border-destructive/50",
        )}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            id={`${ids}-attestation`}
            checked={attested}
            onCheckedChange={(value) => setAttested(value === true)}
            aria-describedby={`${ids}-attestation-help`}
            className="mt-0.5"
          />
          <div className="space-y-1.5">
            <Label htmlFor={`${ids}-attestation`} className="cursor-pointer leading-5">
              I confirm these targets, activities, restrictions and dates are the scope my
              organisation authorises for this request.
            </Label>
            <p id={`${ids}-attestation-help`} className="text-xs leading-5 text-muted-foreground">
              Saving creates a new version that replaces the current one. Earlier versions are
              retained, not erased. This confirmation is never pre-selected.
            </p>
          </div>
        </div>
      </div>

      {failure && (
        <Alert variant="destructive" className="gap-1 rounded-xl px-4 py-3.5">
          <AlertTriangle aria-hidden="true" />
          <AlertTitle>{failure.title}</AlertTitle>
          <AlertDescription>{failure.description}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" disabled={mutation.isPending || !attested}>
          <ShieldCheck aria-hidden="true" />
          {mutation.isPending
            ? "Saving authorisation…"
            : current
              ? "Confirm new version"
              : "Confirm scope authorisation"}
        </Button>
      </div>
    </form>
  );
}

function RowEditor({
  id,
  title,
  description,
  rows,
  onChange,
  placeholder,
  addLabel,
  error,
  optional,
  allowEmpty,
  mono,
}: {
  id: string;
  title: string;
  description: string;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  placeholder: string;
  addLabel: string;
  error?: string;
  optional?: boolean;
  allowEmpty?: boolean;
  mono?: boolean;
}) {
  const describedBy = `${id}-help${error ? ` ${id}-error` : ""}`;
  const update = (rowId: number, value: string) =>
    onChange(rows.map((row) => (row.id === rowId ? { ...row, value } : row)));
  const remove = (rowId: number) => {
    const remaining = rows.filter((row) => row.id !== rowId);
    onChange(remaining.length > 0 ? remaining : toRows([]));
  };
  return (
    <fieldset className="space-y-3" aria-describedby={describedBy}>
      <legend className="flex items-center gap-2 text-sm font-medium">
        {title}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </legend>
      <p id={`${id}-help`} className="text-sm text-muted-foreground">
        {description}
      </p>
      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={row.id} className="flex gap-2">
            <Input
              aria-label={`${title} ${index + 1}`}
              aria-invalid={Boolean(error) && !row.value.trim()}
              value={row.value}
              placeholder={placeholder}
              onChange={(event) => update(row.id, event.target.value)}
              className={cn("h-10", mono && "font-mono text-[0.8rem] md:text-[0.8rem]")}
            />
            <Button
              type="button"
              size="icon-lg"
              variant="ghost"
              className="size-10"
              aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}
              disabled={rows.length === 1 && (!allowEmpty || !row.value)}
              onClick={() => remove(row.id)}
            >
              <X aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onChange([...rows, ...toRows([])])}
      >
        <Plus aria-hidden="true" /> {addLabel}
      </Button>
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

function DateField({
  id,
  label,
  value,
  onChange,
  error,
  help,
  optional,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  help: string;
  optional?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-muted-foreground">(optional)</span>}
      </Label>
      <Input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
        className="h-10"
      />
      <p id={`${id}-help`} className="text-xs text-muted-foreground">
        {help}
      </p>
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
