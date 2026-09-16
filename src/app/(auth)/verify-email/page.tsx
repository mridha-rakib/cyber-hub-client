import type { Metadata } from "next";
import { Suspense } from "react";

import { InlineLoading } from "@/components/common/states";
import { VerifyEmail } from "@/features/auth/components/verify-email";

export const metadata: Metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <h1 className="text-xl font-semibold">Verify your email</h1>
      <Suspense fallback={<InlineLoading />}>
        <VerifyEmail />
      </Suspense>
    </div>
  );
}
