"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";
import { ReportWorkspace } from "@/features/security-reports/report-workspace";

/** UI-CON-008 — report editor and review (API-RPT-002..007). */
export default function ConsultantReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  return (
    <RoleGate requiredRole="ROLE_CONSULTANT">
      {isRouteId(reportId) ? (
        <ReportWorkspace audience="consultant" reportId={reportId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
