"use client";

import { SecurityDashboard } from "@/features/business-security/security-dashboard";
import { RoleGate } from "@/features/consulting/role-gate";

/** UI-BIZ-011 — Business security dashboard (API-SCR-003). */
export default function BusinessSecurityPage() {
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      <SecurityDashboard />
    </RoleGate>
  );
}
