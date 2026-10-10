"use client";

import Link from "next/link";
import { ForbiddenState, PageLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import { ROLE_LANDING_ROUTE } from "@/config/navigation";
import { useSession } from "@/hooks/use-session";
import type { Role } from "@/types/auth";

/**
 * UX-only role routing for Consulting screens — not a security boundary.
 * The backend authorises every Consulting API call; this only avoids
 * rendering another role's workspace (and firing requests it would deny).
 */
export function RoleGate({
  requiredRole,
  children,
}: {
  requiredRole: Role;
  children: React.ReactNode;
}) {
  const { session, status } = useSession();
  if (status === "loading") return <PageLoading />;
  if (!session) return null;
  if (session.user.role !== requiredRole) {
    return (
      <div className="flex flex-col items-center">
        <ForbiddenState className="min-h-[30vh]" />
        <Button asChild variant="outline">
          <Link href={ROLE_LANDING_ROUTE[session.user.role]}>Go to your workspace</Link>
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Route ids are validated before any request so a malformed link reads as "unavailable". */
export function isRequestId(value: string | undefined): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
