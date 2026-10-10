"use client";

import { useState } from "react";
import { ConsultingRequestList } from "@/features/consulting/request-list";
import { RoleGate } from "@/features/consulting/role-gate";
import type { ConsultingStatus } from "@/types/consulting";

/** UI-CON-002 — requests assigned to this Consultant (API-CON-006, ASG-scoped). */
export default function ConsultantRequestsPage() {
  const [status, setStatus] = useState<ConsultingStatus | "">("");
  return (
    <RoleGate requiredRole="ROLE_CONSULTANT">
      <ConsultingRequestList audience="consultant" status={status} onStatusChange={setStatus} />
    </RoleGate>
  );
}
