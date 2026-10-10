"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Building2,
  Cloud,
  FileText,
  Globe,
  LockKeyhole,
  MailWarning,
  Network,
  ScanSearch,
  ShieldCheck,
  Target,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_LANDING_ROUTE } from "@/config/navigation";
import { APP_NAME, ROUTES } from "@/constants";
import {
  CONSULTING_SERVICE_DESCRIPTIONS,
  CONSULTING_SERVICE_LABELS,
} from "@/features/consulting/consulting-labels";
import { useSession } from "@/hooks/use-session";
import { CONSULTING_SERVICES, type ConsultingService } from "@/types/consulting";

const SERVICE_ICONS: Record<ConsultingService, LucideIcon> = {
  WEBSITE_ASSESSMENT: Globe,
  NETWORK_ASSESSMENT: Network,
  VULNERABILITY_ASSESSMENT: ScanSearch,
  PHISHING_AWARENESS: MailWarning,
  CLOUD_REVIEW: Cloud,
  CYBER_RISK_ASSESSMENT: Target,
  SECURITY_DOCUMENTATION: FileText,
};

const FLOW = [
  {
    title: "Describe your need",
    body: "Share your company context, the security concern and the service you are interested in.",
  },
  {
    title: "Review",
    body: "The consulting team reviews the request and a consultant is assigned to it.",
  },
  {
    title: "Authorise the scope",
    body: "You confirm exactly which targets and activities are permitted, and for how long.",
  },
  {
    title: "Delivery",
    body: "Technical work starts only once a current scope authorisation is in place.",
  },
];

const YOU_PROVIDE = [
  "Your company name and approximate size",
  "The security concern, and its current or potential impact",
  "Optional high-level environment context, such as a website or domain",
  "A contact for questions about the request",
];

/**
 * UI-PUB-017 — public Consulting entry. Explains the flow and routes into
 * authenticated Business submission; it never posts consulting data itself
 * (API-CON-001 requires ROLE_BUSINESS).
 */
export default function PublicConsultingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link href={ROUTES.home} className="truncate font-semibold">
            {APP_NAME}
          </Link>
          <div className="flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <HeaderAuth />
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="border-b">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-center lg:gap-14">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                <ShieldCheck className="size-3.5" aria-hidden="true" /> Cybersecurity consulting
              </p>
              <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.1]">
                Practical security help for your organisation, on terms you authorise.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                Tell us what concerns you and choose the service that fits. You stay in control of
                what may be tested: no technical work begins until you explicitly authorise its
                scope.
              </p>
              <div className="mt-8">
                <PrimaryActions />
              </div>
            </div>

            <Card className="gap-5 py-6 [--card-spacing:--spacing(6)]">
              <CardContent>
                <h2 className="font-medium">How it works</h2>
                <ol className="mt-5 space-y-5">
                  {FLOW.map((step, index) => (
                    <li key={step.title} className="flex gap-3.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
                          {step.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold tracking-tight">Services</h2>
            <p className="mt-2 leading-7 text-muted-foreground">
              Choose the service closest to your need when you submit a request. Each request is
              reviewed before any work is agreed.
            </p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONSULTING_SERVICES.map((service) => {
              const Icon = SERVICE_ICONS[service];
              return (
                <li key={service}>
                  <Card className="h-full gap-3 py-5 [--card-spacing:--spacing(5)]">
                    <CardContent className="space-y-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-medium">{CONSULTING_SERVICE_LABELS[service]}</h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {CONSULTING_SERVICE_DESCRIPTIONS[service]}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-10">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">What you&apos;ll provide</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A short form, completed from your Business account.
              </p>
              <ul className="mt-5 space-y-3">
                {YOU_PROVIDE.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6">
                    <span
                      aria-hidden="true"
                      className="mt-2.5 size-1.5 shrink-0 rounded-full bg-foreground/50"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                Please never include passwords, keys or other secrets in a request.
              </p>
            </div>
            <Card className="h-fit gap-3 py-6 [--card-spacing:--spacing(6)]">
              <CardContent>
                <h2 className="flex items-center gap-2 font-medium">
                  <LockKeyhole className="size-4" aria-hidden="true" /> Authorisation stays explicit
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Submitting a request, having it accepted, or having a consultant assigned does not
                  authorise any testing. Technical work is limited to the targets, activities,
                  restrictions and dates you confirm in a separate step — and you can confirm a
                  replacement version if anything changes.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Ready to describe what your organisation needs?
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
            Start with a request. You decide what may be tested, and when.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryActions centered />
          </div>
        </section>
      </main>
    </div>
  );
}

/** Visitor → register/sign in; Business → continue; other roles → no submission path. */
function PrimaryActions({ centered = false }: { centered?: boolean }) {
  const { session, status } = useSession();
  const justify = centered ? "justify-center" : "";

  if (status === "loading") {
    return (
      <div className={`flex flex-wrap gap-3 ${justify}`} aria-hidden="true">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-28" />
      </div>
    );
  }

  if (session?.user.role === "ROLE_BUSINESS") {
    return (
      <div className={`flex flex-wrap gap-3 ${justify}`}>
        <Button asChild size="lg">
          <Link href="/business/consulting/new">
            Start a consulting request <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/business/consulting">View your requests</Link>
        </Button>
      </div>
    );
  }

  if (session) {
    return (
      <div className={`flex flex-col gap-3 ${centered ? "items-center" : "items-start"}`}>
        <p className="max-w-md text-sm leading-6 text-muted-foreground">
          Consulting requests are submitted from a Business account. You are signed in with a
          different account type.
        </p>
        <Button asChild size="lg" variant="outline">
          <Link href={ROLE_LANDING_ROUTE[session.user.role]}>Go to your workspace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-3 ${justify}`}>
      <Button asChild size="lg">
        <Link href={ROUTES.registerBusiness}>
          <Building2 aria-hidden="true" /> Register your business
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href={ROUTES.login}>Sign in</Link>
      </Button>
    </div>
  );
}

function HeaderAuth() {
  const { session, status } = useSession();
  if (status === "loading") return <Skeleton className="h-8 w-20" />;
  if (session) {
    return (
      <Button asChild variant="ghost">
        <Link href={ROLE_LANDING_ROUTE[session.user.role]}>Workspace</Link>
      </Button>
    );
  }
  return (
    <Button asChild variant="ghost">
      <Link href={ROUTES.login}>Sign in</Link>
    </Button>
  );
}
