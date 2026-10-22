"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState, ForbiddenState, NotFoundState, PageLoading } from "@/components/common/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  EmployerProfileForm,
  EmployerStatusPanel,
} from "@/features/admin-governance/admin-account-actions";
import {
  EmployerStatusBadge,
  Field,
  formatUtc,
  isForbidden,
  isNotFound,
  isUuid,
  Mono,
  RoleBadge,
  VerifiedBadge,
} from "@/features/admin-governance/admin-governance-ui";
import { RoleGate } from "@/features/consulting/role-gate";
import { useAdminEmployer } from "@/hooks/use-admin-governance";

/**
 * UI-ADM-005 Employer / Business Detail: read (API-ADM-005, Wave 7A), profile
 * edit (API-ADM-006) and status change (API-ADM-007, Wave 7B). D8: status is
 * an administrative record only — no access effect is implied or enforced.
 */
export default function AdminEmployerDetailPage() {
  const { employerId } = useParams<{ employerId: string }>();
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      {isUuid(employerId) ? <AdminEmployerDetail employerId={employerId} /> : <NotFoundState />}
    </RoleGate>
  );
}

function AdminEmployerDetail({ employerId }: { employerId: string }) {
  const { data: employer, isPending, isError, error, refetch } = useAdminEmployer(employerId);

  if (isPending) return <PageLoading />;
  if (isError && isForbidden(error)) return <ForbiddenState />;
  if (isError && isNotFound(error)) return <NotFoundState />;
  if (isError || !employer) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/employers"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← Employer / Business Accounts
        </Link>
        <h1 className="mt-1 text-xl font-semibold break-words">{employer.companyName}</h1>
        <div className="mt-2">
          <EmployerStatusBadge status={employer.status} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3">
            <Field label="Business ID">
              <Mono>{employer.id}</Mono>
            </Field>
            <Field label="Company name">{employer.companyName}</Field>
            <Field label="Contact email">{employer.email}</Field>
            <Field label="Status">
              <EmployerStatusBadge status={employer.status} />
            </Field>
            <Field label="Created">{formatUtc(employer.createdAt)}</Field>
            <Field label="Last updated">{formatUtc(employer.updatedAt)}</Field>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {employer.users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No user accounts are linked.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {employer.users.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/users/${member.id}`}
                      className="font-medium break-words underline-offset-2 hover:underline"
                    >
                      {member.name}
                    </Link>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <RoleBadge role={member.role} />
                    <VerifiedBadge verified={member.verified} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <EmployerStatusPanel employer={employer} />
      <EmployerProfileForm employer={employer} />

      <Card>
        <CardContent className="flex flex-col gap-2 pt-6 text-sm text-muted-foreground">
          <Link
            href={`/admin/audit-logs?employerId=${employer.id}`}
            className="underline underline-offset-2"
          >
            View audit events for this business
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
