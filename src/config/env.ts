import { z } from "zod";

/**
 * Runtime-validated environment configuration.
 *
 * Only `NEXT_PUBLIC_*` variables are referenced explicitly so that Next.js can
 * inline them for the browser bundle. Add new variables to the schema below and
 * they will be validated the first time this module is imported.
 */
const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().default("http://localhost:8000/api"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
});

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = {
  apiUrl: parsed.data.NEXT_PUBLIC_API_URL,
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const;
