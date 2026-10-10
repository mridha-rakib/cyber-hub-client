"use client";

import { ArrowRight, PlusIcon, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROLE_LABELS } from "@/config/navigation";
import { SectionHeading } from "@/features/consulting/consulting-ui";
import { ConsultingRequestPreview } from "@/features/consulting/request-preview";
import { useSession } from "@/hooks/use-session";

export default function DashboardPage() {
  const { session } = useSession();

  if (!session) {
    return null;
  }

  const role = session.user.role;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome, {session.user.name}</h1>
        <p className="text-sm text-muted-foreground">
          Signed in as {ROLE_LABELS[role]}
          {session.employer ? ` · ${session.employer.companyName}` : ""}
        </p>
      </div>

      {role === "ROLE_BUSINESS" || role === "ROLE_ADMIN" ? (
        <ConsultingDashboardModule audience={role === "ROLE_BUSINESS" ? "business" : "admin"} />
      ) : role === "ROLE_CONSULTANT" ? (
        <Card>
          <CardHeader>
            <CardTitle>Your consulting workspace</CardTitle>
            <CardDescription>Assigned consulting requests live in your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/consultant">
                Open workspace <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your workspace is ready</CardTitle>
            <CardDescription>
              Product modules for your role will appear here in a future release. This dashboard is
              currently a foundation placeholder — no live data is shown yet.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}

/** UI-BIZ-001 / UI-ADM-001 Consulting entry point, built only from API-CON-002 / API-CON-006. */
function ConsultingDashboardModule({ audience }: { audience: "business" | "admin" }) {
  const business = audience === "business";
  const href = business ? "/business/consulting" : "/admin/consulting";
  return (
    <Card className="max-w-4xl gap-5 py-5 [--card-spacing:--spacing(5)]">
      <CardHeader className="border-b">
        <SectionHeading
          icon={ShieldCheck}
          title={business ? "Consulting requests" : "Consulting queue"}
          description={
            business
              ? "Your organisation's most recent cybersecurity requests."
              : "Newly submitted requests waiting to be picked up for review."
          }
          action={
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
              <Link href={href}>
                Open Consulting <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <ConsultingRequestPreview
          audience={audience}
          status={business ? undefined : "SUBMITTED"}
          limit={3}
          emptyTitle={business ? "No consulting requests yet" : "No newly submitted requests"}
          emptyDescription={
            business
              ? "Describe a security concern and choose a service to start your first request."
              : "New Business requests will appear here as they are submitted."
          }
          emptyAction={
            business ? (
              <Button asChild size="sm">
                <Link href="/business/consulting/new">
                  <PlusIcon aria-hidden="true" /> New consulting request
                </Link>
              </Button>
            ) : undefined
          }
          viewAllHref={href}
        />
        <Button asChild variant="outline" size="sm" className="sm:hidden">
          <Link href={href}>
            Open Consulting <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
