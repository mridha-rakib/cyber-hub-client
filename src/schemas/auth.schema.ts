import { z } from "zod";

import { emailSchema, nonEmptyString, passwordSchema } from "@/schemas/common";

/**
 * Form schema pattern:
 * - Define the schema here with `<domain>.schema.ts`.
 * - Export an inferred type for use with React Hook Form.
 * - Consume via `zodResolver(loginSchema)` in the component/hook.
 */

export const loginSchema = z.object({
  email: emailSchema,
  password: nonEmptyString("Password"),
  rememberMe: z.boolean().default(false),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: nonEmptyString("Name"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;
