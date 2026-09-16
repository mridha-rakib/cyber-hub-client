import type { LucideIcon } from "lucide-react";
import { AlertTriangleIcon, InboxIcon, LockIcon, RefreshCwIcon, SearchXIcon } from "lucide-react";
import type * as React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Full-page loading skeleton, for a route/section whose content isn't ready yet. */
export function PageLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-4 p-6", className)} aria-busy="true" aria-live="polite">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

/** Small inline spinner for buttons/sections that don't warrant a full skeleton. */
export function InlineLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground" role="status">
      <RefreshCwIcon className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </span>
  );
}

interface StatePanelProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

function StatePanel({ icon: Icon, title, description, action, className }: StatePanelProps) {
  return (
    <div
      className={cn(
        "flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  className,
}: Omit<StatePanelProps, "icon">) {
  return (
    <StatePanel
      icon={InboxIcon}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again in a moment.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <StatePanel
      icon={AlertTriangleIcon}
      title={title}
      description={description}
      className={className}
      action={
        onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCwIcon />
            Try again
          </Button>
        )
      }
    />
  );
}

/**
 * Generic permission-denied UX. Never render the backend's internal reason,
 * required role, or permission key — the 403 response body never includes
 * them, and this component must not invent them either.
 */
export function ForbiddenState({ className }: { className?: string }) {
  return (
    <StatePanel
      icon={LockIcon}
      title="You don't have permission to do that"
      description="If you think this is a mistake, contact your administrator."
      className={className}
    />
  );
}

/**
 * Used for both a genuinely missing resource and a resource that exists but
 * is concealed from this user. These must render identically — anything
 * that distinguishes them (a different message, a different icon) would
 * leak the backend's non-disclosure decision.
 */
export function NotFoundState({ className }: { className?: string }) {
  return (
    <StatePanel
      icon={SearchXIcon}
      title="This resource is unavailable"
      description="It may not exist, or may have been moved."
      className={className}
    />
  );
}

export function ConflictState({
  onRefresh,
  className,
}: {
  onRefresh?: () => void;
  className?: string;
}) {
  return (
    <StatePanel
      icon={AlertTriangleIcon}
      title="This item changed since you opened it"
      description="Refresh to see the latest version before trying again."
      className={className}
      action={
        onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCwIcon />
            Refresh
          </Button>
        )
      }
    />
  );
}
