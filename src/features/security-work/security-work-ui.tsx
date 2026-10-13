"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CONSULTING_SERVICE_LABELS,
  isConsultingService,
  scopeEntries,
} from "@/features/consulting/consulting-labels";
import type { SecurityWorkFailure } from "./security-work-errors";

/**
 * Inline explanation of a rejected command. A refresh is offered (the view
 * has already been re-read automatically for 409/404) — the command itself
 * is never replayed.
 */
export function FailureAlert({
  failure,
  onRefresh,
  backHref,
  backLabel,
}: {
  failure: SecurityWorkFailure;
  onRefresh?: () => Promise<unknown>;
  backHref?: string;
  backLabel?: string;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Alert variant="destructive" className="gap-1 rounded-xl px-4 py-3.5">
      <AlertTriangle aria-hidden="true" />
      <AlertTitle>{failure.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{failure.description}</p>
        {(failure.refresh || failure.kind === "unavailable") && (
          <div className="flex flex-wrap gap-2">
            {failure.refresh && onRefresh && (
              <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
                <RefreshCw aria-hidden="true" className={refreshing ? "animate-spin" : undefined} />
                {refreshing ? "Refreshing…" : "Refresh latest state"}
              </Button>
            )}
            {failure.kind === "unavailable" && backHref && (
              <Button asChild size="sm" variant="outline">
                <Link href={backHref}>{backLabel ?? "Go back"}</Link>
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * A command that requires a written reason (cancel, resolve, reopen). The
 * text is owned by the caller so it survives a rejected attempt.
 */
export function ReasonCommandPanel({
  title,
  label,
  help,
  value,
  onChange,
  error,
  confirmLabel,
  pendingLabel,
  pending,
  destructive,
  dismissLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  title: string;
  label: string;
  help: string;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  destructive?: boolean;
  dismissLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ids = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (error) textareaRef.current?.focus();
  }, [error]);

  return (
    <section aria-label={title} className="space-y-3 rounded-xl border p-4">
      <h3 className="font-medium">{title}</h3>
      <div className="space-y-1">
        <Label htmlFor={`${ids}-reason`}>{label}</Label>
        <p id={`${ids}-reason-help`} className="text-xs leading-5 text-muted-foreground">
          {help}
        </p>
      </div>
      <Textarea
        ref={textareaRef}
        id={`${ids}-reason`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={`${ids}-reason-help${error ? ` ${ids}-reason-error` : ""}`}
        className="min-h-24 leading-6"
      />
      {error && (
        <p id={`${ids}-reason-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={destructive ? "destructive" : "default"}
          disabled={pending}
          onClick={onConfirm}
        >
          {pending ? pendingLabel : confirmLabel}
        </Button>
        <Button variant="ghost" disabled={pending} onClick={onCancel}>
          {dismissLabel}
        </Button>
      </div>
    </section>
  );
}

function snapshotField(snapshot: unknown, key: string): unknown {
  return snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
    ? (snapshot as Record<string, unknown>)[key]
    : undefined;
}

/**
 * Read-only summary of the scope the server copied onto the assessment at
 * creation. Display only — the server re-checks the current authorisation on
 * every technical action, whatever this snapshot says.
 */
export function ScopeSnapshotSummary({ snapshot }: { snapshot: unknown }) {
  const targets = scopeEntries(snapshotField(snapshot, "authorizedTargets"));
  const activities = scopeEntries(snapshotField(snapshot, "allowedActivities")).map((activity) =>
    isConsultingService(activity) ? CONSULTING_SERVICE_LABELS[activity] : activity,
  );
  const restrictions = scopeEntries(snapshotField(snapshot, "restrictions"));

  if (targets.length === 0 && activities.length === 0 && restrictions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No scope details were recorded on this assessment.
      </p>
    );
  }

  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      <ScopeGroup label="Authorised targets" items={targets} />
      <ScopeGroup label="Allowed activities" items={activities} />
      <ScopeGroup
        label="Restrictions"
        items={restrictions}
        empty="No restrictions recorded."
        className="sm:col-span-2"
      />
    </dl>
  );
}

function ScopeGroup({
  label,
  items,
  empty = "None recorded.",
  className,
}: {
  label: string;
  items: string[];
  empty?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1.5 text-sm">
        {items.length === 0 ? (
          <span className="text-muted-foreground">{empty}</span>
        ) : (
          <ul className="space-y-1">
            {items.map((item, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: snapshot entries may repeat and never reorder
              <li key={index} className="break-words">
                {item}
              </li>
            ))}
          </ul>
        )}
      </dd>
    </div>
  );
}
