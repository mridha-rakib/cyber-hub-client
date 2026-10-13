"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";
import { FindingWorkspace } from "@/features/security-work/finding-workspace";

/** UI-ADM-023 — Admin finding workspace. */
export default function AdminFindingWorkspacePage() {
  const { findingId } = useParams<{ findingId: string }>();
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      {isRouteId(findingId) ? (
        <FindingWorkspace audience="admin" findingId={findingId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
