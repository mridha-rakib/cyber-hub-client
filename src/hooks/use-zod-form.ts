"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type FieldValues, type UseFormProps, type UseFormReturn, useForm } from "react-hook-form";
import type { ZodType } from "zod";

/**
 * Thin wrapper around `useForm` that wires a Zod schema into the resolver.
 * Supports schemas with transforms (`.default()`, `.transform()`), so the
 * resolved output type can differ from the input type.
 *
 * @example
 * const form = useZodForm(loginSchema, { defaultValues: { email: "" } });
 */
export function useZodForm<TInput extends FieldValues, TOutput extends FieldValues>(
  schema: ZodType<TOutput, TInput>,
  options?: Omit<UseFormProps<TInput, unknown, TOutput>, "resolver">,
): UseFormReturn<TInput, unknown, TOutput> {
  return useForm<TInput, unknown, TOutput>({
    ...options,
    resolver: zodResolver(schema),
  });
}
