"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { BusinessAssessmentDetail } from "@/features/business-security/business-assessments";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";

/** UI-BIZ-013 — client-safe assessment detail (API-ASM-008). */
export default function BusinessSecurityAssessmentPage() {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      {isRouteId(assessmentId) ? (
        <BusinessAssessmentDetail assessmentId={assessmentId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
