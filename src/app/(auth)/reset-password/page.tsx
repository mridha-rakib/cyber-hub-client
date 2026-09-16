import type { Metadata } from "next";
import { Suspense } from "react";

import { InlineLoading } from "@/components/common/states";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ResetPasswordPage() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <Suspense fallback={<InlineLoading />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
