import type { Metadata } from "next";

import { RegisterLearnerForm } from "@/features/auth/components/register-learner-form";

export const metadata: Metadata = { title: "Register as a learner" };

export default function RegisterLearnerPage() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <h1 className="text-xl font-semibold">Register as a learner</h1>
      <RegisterLearnerForm />
    </div>
  );
}
