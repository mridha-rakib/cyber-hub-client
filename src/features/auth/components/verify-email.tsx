"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InlineLoading } from "@/components/common/states";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants";
import {
  useConfirmEmailVerification,
  useRequestEmailVerification,
} from "@/hooks/use-auth-mutations";
import { useZodForm } from "@/hooks/use-zod-form";
import { requestEmailVerificationSchema } from "@/schemas/auth.schema";

type ConfirmState = "idle" | "confirming" | "success" | "error";

/**
 * Handles both verification paths on one screen: if a `?token=` is present
 * (from the emailed link) it's confirmed automatically; otherwise a
 * request/resend form is shown. The token is read once, never logged, and
 * stripped from the URL immediately.
 */
export function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenRef = useRef<string | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>("idle");
  const confirmVerification = useConfirmEmailVerification();

  // Intentionally run once: reads and consumes the token before stripping it
  // from the URL; re-running on the callbacks/router this effect itself
  // triggers would attempt a second confirm against the now-empty query.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount only
  useEffect(() => {
    if (tokenRef.current !== null) {
      return;
    }
    const token = searchParams.get("token");
    tokenRef.current = token;
    if (token) {
      router.replace(ROUTES.verifyEmail);
      setConfirmState("confirming");
      confirmVerification.mutate(
        { token },
        {
          onSuccess: () => setConfirmState("success"),
          onError: () => setConfirmState("error"),
        },
      );
    }
  }, []);

  if (confirmState === "confirming") {
    return <InlineLoading label="Confirming your email…" />;
  }

  if (confirmState === "success") {
    return (
      <p className="max-w-sm text-sm text-muted-foreground">
        Your email has been verified. You can now sign in.
      </p>
    );
  }

  if (confirmState === "error") {
    return (
      <div className="max-w-sm space-y-4">
        <p className="text-sm text-muted-foreground">
          This verification link is invalid or has expired. Request a new one below.
        </p>
        <RequestVerificationForm />
      </div>
    );
  }

  return <RequestVerificationForm />;
}

function RequestVerificationForm() {
  const [submitted, setSubmitted] = useState(false);
  const requestVerification = useRequestEmailVerification();
  const form = useZodForm(requestEmailVerificationSchema, { defaultValues: { email: "" } });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    await requestVerification.mutateAsync({ email });
    setSubmitted(true);
  });

  if (submitted) {
    return (
      <p className="max-w-sm text-sm text-muted-foreground">
        If that email needs verifying, a new link is on its way.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form className="flex w-full max-w-sm flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending…" : "Send verification email"}
        </Button>
      </form>
    </Form>
  );
}
