"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { isRouteId, RoleGate } from "@/features/consulting/role-gate";
import { ReportWorkspace } from "@/features/security-reports/report-workspace";

/** UI-ADM-025 — report review, release (disabled while GAP-013 is open) and supersede. */
export default function AdminReportPage() {
  const { reportId } = useParams<{ reportId: string }>();
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      {isRouteId(reportId) ? (
        <ReportWorkspace audience="admin" reportId={reportId} />
      ) : (
        <NotFoundState />
      )}
    </RoleGate>
  );
}
