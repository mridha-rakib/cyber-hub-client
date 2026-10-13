"use client";

import { ArrowRight, ClipboardCheck, ClipboardList, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConsultingPageHeader, SectionHeading } from "@/features/consulting/consulting-ui";
import { ConsultingRequestPreview } from "@/features/consulting/request-preview";
import { RoleGate } from "@/features/consulting/role-gate";
import { AssessmentPreview } from "@/features/security-work/assessment-list";
import { useSession } from "@/hooks/use-session";

/**
 * UI-CON-001 — composed from the assigned consulting queue (API-CON-006) and
 * the assigned assessment summary (API-ASM-002). Score/report panels are
 * Wave 6 and are not rendered.
 */
export default function ConsultantDashboardPage() {
  return (
    <RoleGate requiredRole="ROLE_CONSULTANT">
      <ConsultantDashboard />
    </RoleGate>
  );
}

function ConsultantDashboard() {
  const { session } = useSession();
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <ConsultingPageHeader
        eyebrow="Consultant workspace"
        title={session ? `Welcome, ${session.user.name}` : "Welcome"}
        description="Review the requests assigned to you, check each one's authorised scope, and progress only the next valid step."
        actions={
          <Button asChild size="lg">
            <Link href="/consultant/requests">
              All assigned requests <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card className="gap-5 py-5 [--card-spacing:--spacing(5)]">
            <CardHeader className="border-b">
              <SectionHeading
                icon={ClipboardList}
                title="Assigned consulting requests"
                description="Your most recently submitted assignments."
              />
            </CardHeader>
            <CardContent>
              <ConsultingRequestPreview
                audience="consultant"
                limit={5}
                emptyTitle="No assigned consulting requests"
                emptyDescription="Requests will appear here when an Admin assigns them to you."
                viewAllHref="/consultant/requests"
              />
            </CardContent>
          </Card>

          <Card className="gap-5 py-5 [--card-spacing:--spacing(5)]">
            <CardHeader className="border-b">
              <SectionHeading
                icon={ClipboardCheck}
                title="Assigned assessments"
                description="Your most recently created security assessments."
              />
            </CardHeader>
            <CardContent>
              <AssessmentPreview audience="consultant" limit={5} />
            </CardContent>
          </Card>
        </div>

        <Card size="sm" className="gap-3">
          <CardHeader>
            <h2 className="flex items-center gap-2 font-medium">
              <ShieldCheck className="size-4" aria-hidden="true" /> Before technical delivery
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              <li>Being assigned a request gives you access to it, not permission to test.</li>
              <li>Accepting a request does not authorise testing either.</li>
              <li>
                Delivery can start only when the Business has confirmed a current scope. Work only
                within its targets, activities and restrictions.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
