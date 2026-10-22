import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/config/navigation";
import { isApiError } from "@/lib/errors/api-error";
import type { AuditLogView, EmployerStatus } from "@/types/admin-governance";
import type { Role } from "@/types/auth";

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "medium",
  timeZone: "UTC",
});

/** Server timestamps are shown in UTC so audit ordering reads unambiguously. */
export function formatUtc(value: string | null | undefined): string | null {
  return value ? `${dateTimeFormat.format(new Date(value))} UTC` : null;
}

export const EMPLOYER_STATUS_LABELS: Record<EmployerStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  CLOSED: "Closed",
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant="outline">{ROLE_LABELS[role]}</Badge>;
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  return (
    <Badge variant={verified ? "secondary" : "outline"}>
      {verified ? "Verified" : "Unverified"}
    </Badge>
  );
}

export function EmployerStatusBadge({ status }: { status: EmployerStatus }) {
  return (
    <Badge variant={status === "ACTIVE" ? "secondary" : "outline"}>
      {EMPLOYER_STATUS_LABELS[status]}
    </Badge>
  );
}

/** A labelled read-only value; absent values say so instead of inventing one. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="text-sm text-muted-foreground sm:w-44 sm:shrink-0">{label}</dt>
      <dd className="min-w-0 text-sm break-words">{children ?? <NotRecorded />}</dd>
    </div>
  );
}

export function NotRecorded() {
  return <span className="text-muted-foreground">Not recorded</span>;
}

export function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs break-all">{children}</span>;
}

/** Links an id to its Admin detail screen when one exists. */
export function IdLink({ href, id }: { href: string; id: string }) {
  return (
    <Link href={href} className="font-mono text-xs break-all underline underline-offset-2">
      {id}
    </Link>
  );
}

/**
 * Renders only the minimized metadata the API returned (an allow-listed set
 * of scalars and string arrays). Values are shown as plain text; nothing is
 * written to the console.
 */
export function AuditMetadataList({ metadata }: { metadata: AuditLogView["metadata"] }) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No metadata recorded for this event.</p>;
  }
  return (
    <dl className="flex flex-col gap-2">
      {entries.map(([key, value]) => (
        <Field key={key} label={key}>
          {Array.isArray(value) ? (
            value.length === 0 ? (
              <span className="text-muted-foreground">None</span>
            ) : (
              <span className="font-mono text-xs break-all">{value.join(", ")}</span>
            )
          ) : value === null ? (
            <span className="text-muted-foreground">null</span>
          ) : (
            <span className="font-mono text-xs break-all">{String(value)}</span>
          )}
        </Field>
      ))}
    </dl>
  );
}

/** Single-choice filter rendered as toggle buttons (keyboard reachable, state announced). */
export function FilterButtons<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="sr-only">{label}</legend>
      <span aria-hidden className="text-sm text-muted-foreground">
        {label}:
      </span>
      {options.map((option) => (
        <Button
          key={option.value || "all"}
          type="button"
          size="sm"
          variant={value === option.value ? "secondary" : "ghost"}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </fieldset>
  );
}

export const isForbidden = (error: unknown) => isApiError(error) && error.status === 403;
export const isNotFound = (error: unknown) => isApiError(error) && error.status === 404;
export const isInvalidFilter = (error: unknown) => isApiError(error) && error.status === 422;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
