"use client";

import { BusinessProfileScreen } from "@/features/account/business-profile-screen";
import { RoleGate } from "@/features/consulting/role-gate";

/** UI-ACC-002 / UI-BIZ-002 Business Profile (API-ACC-003/004) — ORG enforced server-side. */
export default function BusinessProfileSettingsPage() {
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      <BusinessProfileScreen />
    </RoleGate>
  );
}
