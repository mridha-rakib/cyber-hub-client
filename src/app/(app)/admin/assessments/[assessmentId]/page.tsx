"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";
import { AssessmentWorkspace } from "@/features/security-work/assessment-workspace";

/** UI-ADM-022 — Admin security assessment workspace. */
export default function AdminAssessmentWorkspacePage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      {isRouteId(assessmentId) ? (
        <AssessmentWorkspace audience="admin" assessmentId={assessmentId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
