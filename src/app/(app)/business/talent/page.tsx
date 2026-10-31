"use client";

import { RoleGate } from "@/features/consulting/role-gate";
import { TalentDirectory } from "@/features/talent/talent-directory";

/** UI-BIZ-007 Talent Directory (API-PORT-025) — Business only; consent enforced server-side. */
export default function BusinessTalentPage() {
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      <TalentDirectory />
    </RoleGate>
  );
}
