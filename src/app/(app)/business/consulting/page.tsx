"use client";

import { useState } from "react";
import { ConsultingRequestList } from "@/features/consulting/request-list";
import { RoleGate } from "@/features/consulting/role-gate";
import type { ConsultingStatus } from "@/types/consulting";

/** UI-BIZ-008 — own organisation's consulting requests (API-CON-002). */
export default function BusinessConsultingPage() {
  const [status, setStatus] = useState<ConsultingStatus | "">("");
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      <ConsultingRequestList audience="business" status={status} onStatusChange={setStatus} />
    </RoleGate>
  );
}
