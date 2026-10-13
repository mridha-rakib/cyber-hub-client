"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";
import { AssessmentWorkspace } from "@/features/security-work/assessment-workspace";

/** UI-CON-005 — assigned assessment workspace. */
export default function ConsultantAssessmentWorkspacePage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return (
    <RoleGate requiredRole="ROLE_CONSULTANT">
      {isRouteId(assessmentId) ? (
        <AssessmentWorkspace audience="consultant" assessmentId={assessmentId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
