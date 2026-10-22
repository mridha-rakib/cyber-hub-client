"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";

import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatUtc,
  isForbidden,
  isInvalidFilter,
  isUuid,
} from "@/features/admin-governance/admin-governance-ui";
import { RoleGate } from "@/features/consulting/role-gate";
import { useAuditLogs } from "@/hooks/use-admin-governance";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import type { AuditLogListParams } from "@/services/admin-governance.service";

type FilterKey =
  | "actorUserId"
  | "action"
  | "entityType"
  | "entityId"
  | "employerId"
  | "from"
  | "to";
type Filters = Record<FilterKey, string>;

const EMPTY_FILTERS: Filters = {
  actorUserId: "",
  action: "",
  entityType: "",
  entityId: "",
  employerId: "",
  from: "",
  to: "",
};

const UUID_FIELDS: FilterKey[] = ["actorUserId", "entityId", "employerId"];
const LINKABLE_FIELDS: FilterKey[] = [
  "actorUserId",
  "action",
  "entityType",
  "entityId",
  "employerId",
];

/** `datetime-local` values are read as UTC, matching the UTC timestamps shown in the list. */
const fromUtc = (value: string) =>
  value ? `${value.length === 16 ? `${value}:00` : value}Z` : undefined;
const toUtc = (value: string) =>
  value ? `${value.length === 16 ? `${value}:59` : value}.999999Z` : undefined;

function validate(filters: Filters): string | null {
  for (const key of UUID_FIELDS) {
    if (filters[key].trim() && !isUuid(filters[key].trim())) {
      return "Actor, entity and business IDs must be full UUIDs.";
    }
  }
  const from = fromUtc(filters.from);
  const to = toUtc(filters.to);
  if (from && to && Date.parse(from) > Date.parse(to)) {
    return "The start time must not be after the end time.";
  }
  return null;
}

function toParams(filters: Filters): AuditLogListParams {
  const trimmed = (value: string) => value.trim() || undefined;
  return {
    actorUserId: trimmed(filters.actorUserId),
    action: trimmed(filters.action),
    entityType: trimmed(filters.entityType),
    entityId: trimmed(filters.entityId),
    employerId: trimmed(filters.employerId),
    from: fromUtc(filters.from),
    to: toUtc(filters.to),
    limit: 25,
  };
}

/** UI-ADM-029 Audit Logs — read-only, cursor-paginated search (API-AUD-001). */
export default function AdminAuditLogsPage() {
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      <Suspense fallback={<PageLoading />}>
        <AuditLogSearch />
      </Suspense>
    </RoleGate>
  );
}

function AuditLogSearch() {
  const searchParams = useSearchParams();
  // Deep links from user/business detail pre-fill identifier filters once.
  const [initial] = useState<Filters>(() => {
    const next = { ...EMPTY_FILTERS };
    for (const key of LINKABLE_FIELDS) next[key] = searchParams.get(key) ?? "";
    return next;
  });
  const [draft, setDraft] = useState<Filters>(initial);
  const [applied, setApplied] = useState<Filters>(initial);
  const [formError, setFormError] = useState<string | null>(() => validate(initial));
  const appliedError = validate(applied);

  const query = useAuditLogs(toParams(applied), appliedError === null);
  const logs = flattenCursorPages(query.data);
  const filtered = Object.values(applied).some((value) => value.trim() !== "");

  if (query.isError && isForbidden(query.error)) return <ForbiddenState />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const error = validate(draft);
    setFormError(error);
    if (!error) setApplied(draft);
  };
  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    setFormError(null);
  };
  const field = (key: FilterKey, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`audit-${key}`}>{label}</Label>
      <Input
        id={`audit-${key}`}
        value={draft[key]}
        onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
        autoComplete="off"
        spellCheck={false}
        {...props}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">
          Security-relevant events, newest first. Metadata is minimized by the server.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {field("action", "Action", { placeholder: "e.g. auth.login.success" })}
              {field("entityType", "Entity type", { placeholder: "e.g. report" })}
              {field("entityId", "Entity ID", { placeholder: "UUID" })}
              {field("actorUserId", "Actor user ID", { placeholder: "UUID" })}
              {field("employerId", "Business ID", { placeholder: "UUID" })}
              <div className="hidden lg:block" />
              {field("from", "From (UTC)", { type: "datetime-local", step: 1 })}
              {field("to", "To (UTC)", { type: "datetime-local", step: 1 })}
            </div>
            {formError && (
              <Alert variant="destructive" role="alert">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm">
                Apply filters
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={reset}>
                Clear
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {appliedError === null && query.isPending && <PageLoading />}
      {query.isError && isInvalidFilter(query.error) && (
        <ErrorState
          title="These filters aren't valid"
          description="Check the IDs and time range, or clear the filters."
          onRetry={reset}
          className="min-h-0 rounded-lg border py-6"
        />
      )}
      {query.isError && !isInvalidFilter(query.error) && query.data === undefined && (
        <ErrorState onRetry={() => query.refetch()} />
      )}
      {appliedError === null && !query.isPending && !query.isError && logs.length === 0 && (
        <EmptyState
          title={filtered ? "No audit events match these filters" : "No audit events yet"}
          description={filtered ? "Try a wider time range or fewer filters." : undefined}
        />
      )}
      {logs.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {logs.map((log) => (
              <li key={log.id}>
                <Link
                  href={`/admin/audit-logs/${log.id}`}
                  className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader className="gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="font-mono text-sm break-all">{log.action}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {log.entityType}
                          {log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <time dateTime={log.timestamp}>{formatUtc(log.timestamp)}</time>
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Badge variant="outline">
                          {log.actorRole ?? (log.serviceContext ? "System" : "No actor")}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
          <LoadMore
            hasMore={query.hasNextPage}
            isLoading={query.isFetchingNextPage}
            isError={query.isFetchNextPageError}
            onLoadMore={() => query.fetchNextPage()}
            onRetry={() => query.fetchNextPage()}
          />
        </>
      )}
    </div>
  );
}
