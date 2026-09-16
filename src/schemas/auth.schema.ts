import { z } from "zod";

import { emailSchema, nonEmptyString, passwordSchema } from "@/schemas/common";

/**
 * Form schema pattern:
 * - Define the schema here with `<domain>.schema.ts`.
 * - Export an inferred type for use with React Hook Form.
 * - Consume via `zodResolver(schema)` in the component/hook.
 *
 * Fields here are shaped to match what the backend's `.strict()` DTOs accept
 * (see `api/src/modules/auth/dto/*`) — extra client-only fields (like
 * `rememberMe` or `confirmPassword`) are stripped before the request is
 * sent, never forwarded to the API.
 */

export const loginSchema = z.object({
  email: emailSchema,
  password: nonEmptyString("Password"),
  rememberMe: z.boolean().default(false),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerLearnerSchema = z
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

export type RegisterLearnerValues = z.infer<typeof registerLearnerSchema>;

export const registerBusinessSchema = z
  .object({
    name: nonEmptyString("Your name"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    companyName: nonEmptyString("Company name"),
    businessEmail: emailSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterBusinessValues = z.infer<typeof registerBusinessSchema>;

export const requestEmailVerificationSchema = z.object({
  email: emailSchema,
});

export type RequestEmailVerificationValues = z.infer<typeof requestEmailVerificationSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
