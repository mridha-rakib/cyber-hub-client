"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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
import { useConfirmPasswordReset } from "@/hooks/use-auth-mutations";
import { useZodForm } from "@/hooks/use-zod-form";
import { isApiError } from "@/lib/errors/api-error";
import { resetPasswordSchema } from "@/schemas/auth.schema";

/**
 * Reads the reset token from the URL exactly once, never logs or persists
 * it, and strips it from the visible URL as soon as it's captured so it
 * doesn't linger in browser history/referrer headers longer than needed.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const confirmReset = useConfirmPasswordReset();

  // Intentionally run once: capturing must happen before the replace wipes
  // the query, and re-running on `searchParams`/`router` changes (which this
  // effect itself triggers) would just re-read `null` after the strip.
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount only
  useEffect(() => {
    if (tokenRef.current === null) {
      tokenRef.current = searchParams.get("token");
      router.replace(ROUTES.resetPassword);
    }
    setReady(true);
  }, []);

  const form = useZodForm(resetPasswordSchema, {
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const onSubmit = form.handleSubmit(async ({ newPassword }) => {
    if (!tokenRef.current) {
      form.setError("root", { message: "This reset link is invalid or has expired." });
      return;
    }
    try {
      await confirmReset.mutateAsync({ token: tokenRef.current, newPassword });
      setDone(true);
    } catch (error) {
      form.setError("root", {
        message: isApiError(error)
          ? "This reset link is invalid or has expired."
          : "Something went wrong.",
      });
    }
  });

  if (!ready) {
    return null;
  }

  if (!tokenRef.current) {
    return (
      <p className="max-w-sm text-sm text-muted-foreground">
        This reset link is invalid or has expired. Request a new one.
      </p>
    );
  }

  if (done) {
    return (
      <p className="max-w-sm text-sm text-muted-foreground">
        Your password has been reset. You can now sign in.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form className="flex w-full max-w-sm flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </Form>
  );
}
