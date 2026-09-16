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
import { Separator } from "@/components/ui/separator";
import { useRegisterBusiness } from "@/hooks/use-auth-mutations";
import { useZodForm } from "@/hooks/use-zod-form";
import { isApiError } from "@/lib/errors/api-error";
import { registerBusinessSchema } from "@/schemas/auth.schema";

export function RegisterBusinessForm() {
  const [submitted, setSubmitted] = useState(false);
  const register = useRegisterBusiness();
  const form = useZodForm(registerBusinessSchema, {
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      companyName: "",
      businessEmail: "",
    },
  });

  const onSubmit = form.handleSubmit(
    async ({ name, email, password, companyName, businessEmail }) => {
      try {
        await register.mutateAsync({ name, email, password, companyName, businessEmail });
        setSubmitted(true);
      } catch (error) {
        if (isApiError(error) && error.status === 409) {
          form.setError("email", { message: "An account with this email already exists." });
          return;
        }
        form.setError("root", { message: isApiError(error) ? error.message : "" });
      }
    },
  );

  if (submitted) {
    return (
      <p className="max-w-sm text-sm text-muted-foreground">
        Account created. Check your email for a verification link before signing in.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form className="flex w-full max-w-sm flex-col gap-4" onSubmit={onSubmit} noValidate>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your name</FormLabel>
              <FormControl>
                <Input autoComplete="name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
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
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <FormField
          control={form.control}
          name="companyName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company name</FormLabel>
              <FormControl>
                <Input autoComplete="organization" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="businessEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Business email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
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
          {form.formState.isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </Form>
  );
}
