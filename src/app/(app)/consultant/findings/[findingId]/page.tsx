"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";
import { FindingWorkspace } from "@/features/security-work/finding-workspace";

/** UI-CON-006 — Finding Editor. */
export default function ConsultantFindingEditorPage() {
  const { findingId } = useParams<{ findingId: string }>();
  return (
    <RoleGate requiredRole="ROLE_CONSULTANT">
      {isRouteId(findingId) ? (
        <FindingWorkspace audience="consultant" findingId={findingId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
