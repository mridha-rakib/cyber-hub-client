import Link from "next/link";

import { APP_NAME } from "@/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <Link href="/" className="font-heading text-lg font-medium">
        {APP_NAME}
      </Link>
      {children}
    </div>
  );
}
