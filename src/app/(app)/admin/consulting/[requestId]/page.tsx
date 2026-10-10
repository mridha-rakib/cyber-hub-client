"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { OperationalWorkspace } from "@/features/consulting/operational-workspace";
import { isRequestId, RoleGate } from "@/features/consulting/role-gate";

/** UI-ADM-020 — Admin consulting request workspace. */
export default function AdminConsultingWorkspacePage() {
  const { requestId } = useParams<{ requestId: string }>();
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      {isRequestId(requestId) ? (
        <OperationalWorkspace audience="admin" requestId={requestId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
