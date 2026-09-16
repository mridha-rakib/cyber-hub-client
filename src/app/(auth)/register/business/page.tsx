import type { Metadata } from "next";

import { RegisterBusinessForm } from "@/features/auth/components/register-business-form";

export const metadata: Metadata = { title: "Register your business" };

export default function RegisterBusinessPage() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <h1 className="text-xl font-semibold">Register your business</h1>
      <RegisterBusinessForm />
    </div>
  );
}
