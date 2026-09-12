import { z } from "zod";

/** Reusable field-level schemas shared across forms. */

export const emailSchema = z.email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password must be at most 72 characters");

export const nonEmptyString = (label = "This field") =>
  z.string().trim().min(1, `${label} is required`);

export const idSchema = z.string().min(1);
