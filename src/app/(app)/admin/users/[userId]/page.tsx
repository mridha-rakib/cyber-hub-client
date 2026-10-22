"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState, ForbiddenState, NotFoundState, PageLoading } from "@/components/common/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleChangePanel } from "@/features/admin-governance/admin-account-actions";
import {
  Field,
  formatUtc,
  IdLink,
  isForbidden,
  isNotFound,
  isUuid,
  Mono,
  RoleBadge,
  VerifiedBadge,
} from "@/features/admin-governance/admin-governance-ui";
import { RoleGate } from "@/features/consulting/role-gate";
import { useAdminUser } from "@/hooks/use-admin-governance";
import { useSession } from "@/hooks/use-session";

/**
 * UI-ADM-003 User Detail & Role Management: read (API-ADM-002, Wave 7A)
 * and role change (API-ADM-003, Wave 7B, D7 governance).
 */
export default function AdminUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      {isUuid(userId) ? <AdminUserDetail userId={userId} /> : <NotFoundState />}
    </RoleGate>
  );
}

function AdminUserDetail({ userId }: { userId: string }) {
  const { data: user, isPending, isError, error, refetch } = useAdminUser(userId);
  const { session } = useSession();

  if (isPending) return <PageLoading />;
  if (isError && isForbidden(error)) return <ForbiddenState />;
  if (isError && isNotFound(error)) return <NotFoundState />;
  if (isError || !user) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← User Management
        </Link>
        <h1 className="mt-1 text-xl font-semibold break-words">{user.name}</h1>
        <div className="mt-2 flex flex-wrap gap-2">
          <RoleBadge role={user.role} />
          <VerifiedBadge verified={user.verified} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3">
            <Field label="User ID">
              <Mono>{user.id}</Mono>
            </Field>
            <Field label="Email">{user.email}</Field>
            <Field label="Role">
              <RoleBadge role={user.role} />
            </Field>
            <Field label="Email verified">{user.verified ? "Yes" : "No"}</Field>
            <Field label="Verified at">{formatUtc(user.verifiedAt)}</Field>
            <Field label="Business account">
              {user.employerId ? (
                <IdLink href={`/admin/employers/${user.employerId}`} id={user.employerId} />
              ) : (
                <span className="text-muted-foreground">Not linked</span>
              )}
            </Field>
            <Field label="Deletion requested">
              {user.deletionRequestedAt ? formatUtc(user.deletionRequestedAt) : "No"}
            </Field>
            <Field label="Created">{formatUtc(user.createdAt)}</Field>
            <Field label="Last updated">{formatUtc(user.updatedAt)}</Field>
          </dl>
        </CardContent>
      </Card>

      {session && <RoleChangePanel user={user} actorUserId={session.user.id} />}

      <Card>
        <CardContent className="flex flex-col gap-2 pt-6 text-sm text-muted-foreground">
          <Link
            href={`/admin/audit-logs?actorUserId=${user.id}`}
            className="underline underline-offset-2"
            prefetch={false}
          >
            View audit events by this user
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
