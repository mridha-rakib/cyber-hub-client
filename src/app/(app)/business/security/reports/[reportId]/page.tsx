"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { BusinessReportDetail } from "@/features/business-security/business-reports";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";

/** UI-BIZ-017 — released report detail (API-RPT-011; download gated, API-RPT-012). */
export default function BusinessSecurityReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      {isRouteId(reportId) ? <BusinessReportDetail reportId={reportId} /> : <NotFoundState />}
    </RoleGate>
  );
}
