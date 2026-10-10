"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConsultingPageHeader } from "@/features/consulting/consulting-ui";
import { ConsultingRequestForm, RequestNextSteps } from "@/features/consulting/request-form";
import { RoleGate } from "@/features/consulting/role-gate";
import { useSession } from "@/hooks/use-session";

/** UI-BIZ-009 — submit a consulting request (API-CON-001). */
export default function NewConsultingRequestPage() {
  const { session } = useSession();
  return (
    <RoleGate requiredRole="ROLE_BUSINESS">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/business/consulting">
            <ArrowLeft aria-hidden="true" /> All consulting requests
          </Link>
        </Button>
        <ConsultingPageHeader
          title="New consulting request"
          description="Tell us what you need help with. This starts a review — you will confirm any technical testing scope separately."
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          {session && (
            <ConsultingRequestForm
              defaults={{
                companyName: session.employer?.companyName,
                contactName: session.user.name,
                contactEmail: session.user.email,
              }}
            />
          )}
          <aside className="hidden lg:sticky lg:top-6 lg:block">
            <RequestNextSteps />
          </aside>
        </div>
      </div>
    </RoleGate>
  );
}
