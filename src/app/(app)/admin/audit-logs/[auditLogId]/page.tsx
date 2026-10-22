"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { ErrorState, ForbiddenState, NotFoundState, PageLoading } from "@/components/common/states";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AuditMetadataList,
  Field,
  formatUtc,
  IdLink,
  isForbidden,
  isNotFound,
  isUuid,
  Mono,
} from "@/features/admin-governance/admin-governance-ui";
import { RoleGate } from "@/features/consulting/role-gate";
import { useAuditLog } from "@/hooks/use-admin-governance";

/** UI-ADM-030 Audit Log Detail — safe, minimized event (API-AUD-002). */
export default function AdminAuditLogDetailPage() {
  const { auditLogId } = useParams<{ auditLogId: string }>();
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      {isUuid(auditLogId) ? <AuditLogDetail auditLogId={auditLogId} /> : <NotFoundState />}
    </RoleGate>
  );
}

function AuditLogDetail({ auditLogId }: { auditLogId: string }) {
  const { data: log, isPending, isError, error, refetch } = useAuditLog(auditLogId);

  if (isPending) return <PageLoading />;
  if (isError && isForbidden(error)) return <ForbiddenState />;
  if (isError && isNotFound(error)) return <NotFoundState />;
  if (isError || !log) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/audit-logs"
          className="text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          ← Audit Logs
        </Link>
        <h1 className="mt-1 font-mono text-lg font-semibold break-all">{log.action}</h1>
        <p className="text-sm text-muted-foreground">
          <time dateTime={log.timestamp}>{formatUtc(log.timestamp)}</time>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3">
            <Field label="Event ID">
              <Mono>{log.id}</Mono>
            </Field>
            <Field label="Action">
              <Mono>{log.action}</Mono>
            </Field>
            <Field label="Entity type">{log.entityType}</Field>
            <Field label="Entity ID">{log.entityId && <Mono>{log.entityId}</Mono>}</Field>
            <Field label="Actor">
              {log.actorUserId && (
                <IdLink href={`/admin/users/${log.actorUserId}`} id={log.actorUserId} />
              )}
            </Field>
            <Field label="Actor role">{log.actorRole}</Field>
            <Field label="Service context">{log.serviceContext}</Field>
            <Field label="Subject user">
              {log.userId && <IdLink href={`/admin/users/${log.userId}`} id={log.userId} />}
            </Field>
            <Field label="Business">
              {log.employerId && (
                <IdLink href={`/admin/employers/${log.employerId}`} id={log.employerId} />
              )}
            </Field>
            <Field label="Request ID">{log.requestId && <Mono>{log.requestId}</Mono>}</Field>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditMetadataList metadata={log.metadata} />
        </CardContent>
      </Card>
    </div>
  );
}
