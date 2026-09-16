"use client";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/config/navigation";
import { useSession } from "@/hooks/use-session";

export default function DashboardPage() {
  const { session } = useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome, {session.user.name}</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {ROLE_LABELS[session.user.role]}
          {session.employer ? ` · ${session.employer.companyName}` : ""}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your workspace is ready</CardTitle>
          <CardDescription>
            Product modules for your role will appear here in a future release. This dashboard is
            currently a foundation placeholder — no live data is shown yet.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
