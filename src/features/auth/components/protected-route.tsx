"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ErrorState, PageLoading } from "@/components/common/states";
import { ROUTES } from "@/constants";
import { useSession } from "@/hooks/use-session";

/**
 * UX-only route protection — this is NOT a security boundary. The backend
 * enforces every real authorization decision on the actual API request; this
 * component only decides what to render/where to redirect so anonymous
 * users aren't shown a flash of protected UI while the session resolves.
 *
 * There is no Next.js middleware doing this at the edge: the session cookie
 * is HttpOnly and scoped to the backend's origin (a separate host in dev,
 * and CORS-separated in general), so Next's middleware/server components
 * cannot read or verify it. Session resolution only happens client-side,
 * via `GET /auth/session`.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(ROUTES.login);
    }
  }, [status, router]);

  if (status === "loading") {
    return <PageLoading />;
  }

  if (status === "error") {
    // A network/server failure resolving the session is recoverable — do
    // NOT treat it as "logged out" and redirect, that would bounce a
    // legitimately authenticated user during a transient outage.
    return (
      <ErrorState
        title="Couldn't verify your session"
        description="Check your connection and try again."
        onRetry={() => router.refresh()}
      />
    );
  }

  if (status === "anonymous") {
    // Redirect effect above is in flight; render nothing rather than a
    // flash of protected content.
    return null;
  }

  return <>{children}</>;
}
