"use client";

import Link from "next/link";
import { useState } from "react";

import { LoadMore } from "@/components/common/load-more";
import { EmptyState, ErrorState, ForbiddenState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/config/navigation";
import {
  FilterButtons,
  formatUtc,
  isForbidden,
  isInvalidFilter,
  RoleBadge,
  VerifiedBadge,
} from "@/features/admin-governance/admin-governance-ui";
import { RoleGate } from "@/features/consulting/role-gate";
import { useAdminUsers } from "@/hooks/use-admin-governance";
import { flattenCursorPages } from "@/hooks/use-cursor-pagination";
import { ROLES, type Role } from "@/types/auth";

const ROLE_FILTERS: { value: Role | ""; label: string }[] = [
  { value: "", label: "All" },
  ...ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
];

const VERIFIED_FILTERS = [
  { value: "", label: "All" },
  { value: "true", label: "Verified" },
  { value: "false", label: "Unverified" },
] as const;

type VerifiedFilter = (typeof VERIFIED_FILTERS)[number]["value"];

/** UI-ADM-002 User Management — list (API-ADM-001); role changes live on the detail page. */
export default function AdminUsersPage() {
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      <AdminUsersList />
    </RoleGate>
  );
}

function AdminUsersList() {
  const [role, setRole] = useState<Role | "">("");
  const [verified, setVerified] = useState<VerifiedFilter>("");
  const filtered = role !== "" || verified !== "";
  const query = useAdminUsers({
    role: role || undefined,
    verified: verified === "" ? undefined : verified === "true",
    limit: 25,
  });
  const users = flattenCursorPages(query.data);

  if (query.isError && isForbidden(query.error)) return <ForbiddenState />;

  const resetFilters = () => {
    setRole("");
    setVerified("");
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">User Management</h1>
        <p className="text-sm text-muted-foreground">
          Account overview. Open a user to review or change their role.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <FilterButtons label="Role" options={ROLE_FILTERS} value={role} onChange={setRole} />
        <FilterButtons
          label="Email"
          options={VERIFIED_FILTERS}
          value={verified}
          onChange={setVerified}
        />
      </div>

      {query.isPending && <PageLoading />}
      {query.isError && isInvalidFilter(query.error) && (
        <ErrorState
          title="These filters aren't valid"
          description="Reset the filters and try again."
          onRetry={resetFilters}
          className="min-h-0 rounded-lg border py-6"
        />
      )}
      {query.isError && !isInvalidFilter(query.error) && query.data === undefined && (
        <ErrorState onRetry={() => query.refetch()} />
      )}
      {!query.isPending && !query.isError && users.length === 0 && (
        <EmptyState
          title={filtered ? "No users match these filters" : "No users yet"}
          description={filtered ? "Try a different role or verification filter." : undefined}
        />
      )}
      {filtered && !query.isPending && users.length === 0 && (
        <div>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Clear filters
          </Button>
        </div>
      )}
      {users.length > 0 && (
        <>
          <ul className="flex flex-col gap-2">
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardHeader className="gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <CardTitle className="truncate text-base">{user.name}</CardTitle>
                        <p className="truncate text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatUtc(user.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <RoleBadge role={user.role} />
                        <VerifiedBadge verified={user.verified} />
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
