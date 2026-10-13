"use client";

import { RoleGate } from "@/features/consulting/role-gate";
import { AssessmentList } from "@/features/security-work/assessment-list";

/** UI-CON-004 — assessments assigned to this Consultant (API-ASM-002, ASG-scoped). */
export default function ConsultantAssessmentsPage() {
  return (
    <RoleGate requiredRole="ROLE_CONSULTANT">
      <AssessmentList audience="consultant" />
    </RoleGate>
  );
}
