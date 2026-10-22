"use client";

import { BusinessFindingList } from "@/features/business-security/business-findings-scores";
import { RoleGate } from "@/features/consulting/role-gate";

/** UI-BIZ-014 — findings from released reports (API-SCR-004). */
export default function BusinessSecurityFindingsPage() {
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      <BusinessFindingList />
    </RoleGate>
  );
}
