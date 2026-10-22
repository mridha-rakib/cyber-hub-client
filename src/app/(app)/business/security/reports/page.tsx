"use client";

import { BusinessReportList } from "@/features/business-security/business-reports";
import { RoleGate } from "@/features/consulting/role-gate";

/** UI-BIZ-016 — released reports (API-RPT-010). */
export default function BusinessSecurityReportsPage() {
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      <BusinessReportList />
    </RoleGate>
  );
}
