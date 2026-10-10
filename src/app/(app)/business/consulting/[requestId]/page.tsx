"use client";

import { useParams } from "next/navigation";
import { NotFoundState } from "@/components/common/states";
import { BusinessRequestDetail } from "@/features/consulting/business-request-detail";
import { isRequestId, RoleGate } from "@/features/consulting/role-gate";

/** UI-BIZ-010 — request detail and explicit scope authorisation. */
export default function BusinessConsultingDetailPage() {
  const { requestId } = useParams<{ requestId: string }>();
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      {isRequestId(requestId) ? <BusinessRequestDetail requestId={requestId} /> : <NotFoundState />}
    </RoleGate>
  );
}
