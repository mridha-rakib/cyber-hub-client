"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";
import { ScoreWorkspace } from "@/features/security-reports/score-workspace";

/** UI-ADM-024 — score workspace (API-SCR-001/002). */
export default function AdminScorePage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      {isRouteId(assessmentId) ? (
        <ScoreWorkspace audience="admin" assessmentId={assessmentId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
