"use client";

import { BusinessScoreHistory } from "@/features/business-security/business-findings-scores";
import { RoleGate } from "@/features/consulting/role-gate";

/** UI-BIZ-015 — score history (API-SCR-005). */
export default function BusinessSecurityScoresPage() {
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      <BusinessScoreHistory />
    </RoleGate>
  );
}
