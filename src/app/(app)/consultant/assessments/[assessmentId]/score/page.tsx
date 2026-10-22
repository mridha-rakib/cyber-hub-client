"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";
import { ScoreWorkspace } from "@/features/security-reports/score-workspace";

/** UI-CON-007 — score workspace (API-SCR-001/002). */
export default function ConsultantScorePage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return (
    <RoleGate requiredRole="ROLE_CONSULTANT">
      {isRouteId(assessmentId) ? (
        <ScoreWorkspace audience="consultant" assessmentId={assessmentId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
