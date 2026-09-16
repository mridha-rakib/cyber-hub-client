"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ROLE_LANDING_ROUTE } from "@/config/navigation";
import { useLogin } from "@/hooks/use-auth-mutations";
import { useZodForm } from "@/hooks/use-zod-form";
import { isApiError } from "@/lib/errors/api-error";
import { loginSchema } from "@/schemas/auth.schema";

export function LoginForm() {
  const router = useRouter();
  const login = useLogin();
  const form = useZodForm(loginSchema, {
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  const onSubmit = form.handleSubmit(async ({ email, password }) => {
    try {
      // `rememberMe` is a client-only affordance — the backend's login DTO
      // is a strict `{ email, password }` and would 422 on an extra field.
      const session = await login.mutateAsync({ email, password });
      router.push(ROLE_LANDING_ROUTE[session.user.role]);
    } catch (error) {
      // Credential failures must stay generic — never reveal whether the
      // email exists or which of email/password was wrong.
      const message =
        isApiError(error) && error.status === 401 ? "Invalid email or password." : undefined;
      form.setError("root", { message: message ?? (isApiError(error) ? error.message : "") });
    }
  });

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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rememberMe"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel className="font-normal">Remember me</FormLabel>
            </FormItem>
          )}
        />

        {form.formState.errors.root && (
          <p className="text-sm font-medium text-destructive" role="alert">
            {form.formState.errors.root.message}
          </p>
        )}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}
