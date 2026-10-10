"use client";

import { useState } from "react";
import { ConsultingRequestList } from "@/features/consulting/request-list";
import { RoleGate } from "@/features/consulting/role-gate";
import type { ConsultingStatus } from "@/types/consulting";

/** UI-ADM-019 — operational consulting queue (API-CON-006). */
export default function AdminConsultingPage() {
  const [status, setStatus] = useState<ConsultingStatus | "">("");
  return (
    <RoleGate requiredRole="ROLE_ADMIN">
      <ConsultingRequestList audience="admin" status={status} onStatusChange={setStatus} />
    </RoleGate>
  );
}
