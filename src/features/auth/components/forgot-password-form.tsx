"use client";

import { useState } from "react";

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
import { useRequestPasswordReset } from "@/hooks/use-auth-mutations";
import { useZodForm } from "@/hooks/use-zod-form";
import { forgotPasswordSchema } from "@/schemas/auth.schema";

/**
 * The backend returns 202 regardless of whether the email is registered
 * (enumeration-resistant). The frontend must preserve that — the success
 * message here is shown unconditionally, never "no account found".
 */
export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const requestReset = useRequestPasswordReset();
  const form = useZodForm(forgotPasswordSchema, { defaultValues: { email: "" } });

  const onSubmit = form.handleSubmit(async ({ email }) => {
    await requestReset.mutateAsync({ email });
    setSubmitted(true);
  });

  if (submitted) {
    return (
      <p className="max-w-sm text-sm text-muted-foreground">
        If an account exists for that email, a password reset link is on its way.
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
          {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </Form>
  );
}
