import type { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/constants";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <LoginForm />
      <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
        <Link href={ROUTES.forgotPassword} className="hover:text-foreground">
          Forgot your password?
        </Link>
        <span>
          Don&apos;t have an account?{" "}
          <Link
            href={ROUTES.registerChoice}
            className="text-foreground underline underline-offset-4"
          >
            Register
          </Link>
        </span>
      </div>
    </div>
  );
}
