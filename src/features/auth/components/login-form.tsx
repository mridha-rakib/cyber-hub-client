"use client";

import { Button } from "@/components/ui/button";
import { useZodForm } from "@/hooks/use-zod-form";
import { type LoginValues, loginSchema } from "@/schemas/auth.schema";

/**
 * Reference implementation of the form pattern:
 * Zod schema -> `useZodForm(schema)` -> typed `register` / `handleSubmit`.
 */
export function LoginForm({ onSubmit }: { onSubmit?: (values: LoginValues) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm(loginSchema, {
    defaultValues: { email: "", password: "", rememberMe: false },
  });

  return (
    <form
      className="flex w-full max-w-sm flex-col gap-4"
      onSubmit={handleSubmit((values) => onSubmit?.(values))}
    >
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          className="h-10 rounded-md border border-black/15 px-3 dark:border-white/20"
          {...register("email")}
        />
        {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          type="password"
          className="h-10 rounded-md border border-black/15 px-3 dark:border-white/20"
          {...register("password")}
        />
        {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register("rememberMe")} />
        Remember me
      </label>

      <Button type="submit" disabled={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}
