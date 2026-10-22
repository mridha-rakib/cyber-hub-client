"use client";

import { BusinessAssessmentList } from "@/features/business-security/business-assessments";
import { RoleGate } from "@/features/consulting/role-gate";

/** UI-BIZ-012 — own-organisation assessments (API-ASM-007). */
export default function BusinessSecurityAssessmentsPage() {
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      <BusinessAssessmentList />
    </RoleGate>
  );
}
