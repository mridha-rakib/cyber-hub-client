"use client";

import Link from "next/link";
import { useState } from "react";

import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EMPLOYER_STATUS_LABELS,
  EmployerStatusBadge,
  FilterButtons,
  formatUtc,
  isForbidden,
  isInvalidFilter,
} from "@/features/admin-governance/admin-governance-ui";
import { RoleGate } from "@/features/consulting/role-gate";
import { useAdminEmployers } from "@/hooks/use-admin-governance";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { EMPLOYER_STATUSES } from "@/schemas/admin-governance.schema";
import type { EmployerStatus } from "@/types/admin-governance";

const STATUS_FILTERS: { value: EmployerStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  ...EMPLOYER_STATUSES.map((status) => ({ value: status, label: EMPLOYER_STATUS_LABELS[status] })),
];

/** UI-ADM-004 Employer / Business Accounts — list (API-ADM-004). */
export default function AdminEmployersPage() {
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      <AdminEmployersList />
    </RoleGate>
  );
}

function AdminEmployersList() {
  const [status, setStatus] = useState<EmployerStatus | "">("");
  const query = useAdminEmployers({ status: status || undefined, limit: 25 });
  const employers = flattenCursorPages(query.data);

  if (query.isError && isForbidden(query.error)) return <ForbiddenState />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">Employer / Business Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Business organisations. Open one to edit its profile or record a status.
        </p>
      </div>

      <FilterButtons label="Status" options={STATUS_FILTERS} value={status} onChange={setStatus} />

      {query.isPending && <PageLoading />}
      {query.isError && isInvalidFilter(query.error) && (
        <ErrorState
          title="This filter isn't valid"
          description="Reset the filter and try again."
          onRetry={() => setStatus("")}
          className="min-h-0 rounded-lg border py-6"
        />
      )}
      {query.isError && !isInvalidFilter(query.error) && query.data === undefined && (
        <ErrorState onRetry={() => query.refetch()} />
      )}
      {!query.isPending && !query.isError && employers.length === 0 && (
        <EmptyState
          title={status ? "No businesses with this status" : "No business accounts yet"}
          description={status ? "Try a different status filter." : undefined}
        />
      )}
      {status && !query.isPending && employers.length === 0 && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setStatus("")}>
            Clear filter
          </Button>
        </div>
      )}
      {employers.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {employers.map((employer) => (
              <li key={employer.id}>
                <Link
                  href={`/admin/employers/${employer.id}`}
                  className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{employer.companyName}</CardTitle>
                        <p className="truncate text-sm text-muted-foreground">{employer.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {formatUtc(employer.createdAt)}
                        </p>
                      </div>
                      <EmployerStatusBadge status={employer.status} />
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
