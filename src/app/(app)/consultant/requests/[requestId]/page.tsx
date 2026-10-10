"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { OperationalWorkspace } from "@/features/consulting/operational-workspace";
import { isRequestId, RoleGate } from "@/features/consulting/role-gate";

/** UI-CON-003 — assigned consulting request workspace. */
export default function ConsultantRequestWorkspacePage() {
  const { requestId } = useParams<{ requestId: string }>();
  return (
    <RoleGate requiredRole="ROLE_CONSULTANT">
      {isRequestId(requestId) ? (
        <OperationalWorkspace audience="consultant" requestId={requestId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
