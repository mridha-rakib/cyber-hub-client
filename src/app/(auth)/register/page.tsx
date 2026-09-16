import { BriefcaseIcon, GraduationCapIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants";

export const metadata: Metadata = { title: "Register" };

/**
 * Public registration offers exactly two entry points — Learner and
 * Business. Mentor, Consultant, and Admin accounts are never
 * self-registerable; the backend has no public endpoint for them, and this
 * screen must not imply otherwise.
 */
export default function RegisterChoicePage() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <h1 className="text-xl font-semibold">Create an account</h1>
      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Link href={ROUTES.registerLearner}>
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <GraduationCapIcon className="mb-2 size-6 text-muted-foreground" />
              <CardTitle>Learner</CardTitle>
              <CardDescription>Looking for internships and mentorship.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
        <Link href={ROUTES.registerBusiness}>
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader>
              <BriefcaseIcon className="mb-2 size-6 text-muted-foreground" />
              <CardTitle>Business</CardTitle>
              <CardDescription>Hiring learners or posting opportunities.</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
      <p className="text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
