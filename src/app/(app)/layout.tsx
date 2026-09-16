"use client";

import { AppShell } from "@/components/shell/app-shell";
import { ProtectedRoute } from "@/features/auth/components/protected-route";
import { useSession } from "@/hooks/use-session";

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  const { session } = useSession();
  // `ProtectedRoute` guarantees `session` is defined by the time this
  // renders (it only renders `children` in the "authenticated" state).
  if (!session) {
    return null;
  }
  return <AppShell user={session.user}>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AuthenticatedShell>{children}</AuthenticatedShell>
    </ProtectedRoute>
  );
}
