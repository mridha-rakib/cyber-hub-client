"use client";

import { RoleGate } from "@/features/consulting/role-gate";
import { AssessmentList } from "@/features/security-work/assessment-list";

/** UI-ADM-021 — security assessments for oversight (API-ASM-002). */
export default function AdminAssessmentsPage() {
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      <AssessmentList audience="admin" />
    </RoleGate>
  );
}
