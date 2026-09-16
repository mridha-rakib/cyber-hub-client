import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <h1 className="text-xl font-semibold">Forgot your password?</h1>
      <ForgotPasswordForm />
    </div>
  );
}
