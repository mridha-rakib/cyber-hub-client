import type * as React from "react";

import { ErrorState, ForbiddenState, NotFoundState } from "@/components/common/states";
import { Skeleton } from "@/components/ui/skeleton";
import { isApiError } from "@/lib/errors/api-error";
import { cn } from "@/lib/utils";
import { recordFieldLabel } from "./consulting-labels";

export function ConsultingPageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1.5">
        {eyebrow && <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
        )}
        {meta}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function DetailItem({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm break-words">{children}</dd>
    </div>
  );
}

/** Renders a flexible JSON snapshot without inventing semantics for unknown keys. */
export function RecordDetails({
  value,
  empty = "Not provided",
}: {
  value: Record<string, unknown> | null | undefined;
  empty?: string;
}) {
  const entries = value ? Object.entries(value) : [];
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
      {entries.map(([key, item]) => (
        <DetailItem
          key={key}
          label={recordFieldLabel(key)}
          className={typeof item === "string" && item.length > 80 ? "sm:col-span-2" : undefined}
        >
          <span className="whitespace-pre-wrap">
            {typeof item === "string" || typeof item === "number" || typeof item === "boolean"
              ? String(item)
              : JSON.stringify(item)}
          </span>
        </DetailItem>
      ))}
    </dl>
  );
}

export function SectionHeading({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
            <Icon className="size-4" aria-hidden={true} />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-medium leading-8">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/** Page-level failure for a Consulting read, keeping 403/404 non-disclosing. */
export function ConsultingQueryError({
  error,
  onRetry,
  subject = "this request",
}: {
  error: unknown;
  onRetry: () => void;
  subject?: string;
}) {
  if (isApiError(error) && error.status === 404) return <NotFoundState />;
  if (isApiError(error) && error.status === 403) return <ForbiddenState />;
  if (isApiError(error) && error.status === 429) {
    return (
      <ErrorState
        title="Too many requests"
        description="Please wait a moment before trying again."
        onRetry={onRetry}
      />
    );
  }
  return (
    <ErrorState
      title={`Couldn't load ${subject}`}
      description={
        isApiError(error) && error.status === null
          ? "We couldn't reach the server. Check your connection and try again."
          : "Something went wrong on our side. Please try again."
      }
      onRetry={onRetry}
    />
  );
}

export function RequestListSkeleton({
  rows = 4,
  label = "Loading requests…",
}: {
  rows?: number;
  label?: string;
}) {
  return (
    <div className="divide-y rounded-xl ring-1 ring-foreground/10" aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      {Array.from({ length: rows }, (_, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
        <div key={index} className="flex items-center gap-4 p-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-3 w-40 max-w-full" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function WorkspaceSkeleton({ label = "Loading request…" }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    </div>
  );
}
