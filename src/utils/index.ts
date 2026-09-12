export { cn } from "@/lib/utils";

/** Promise-based delay helper. */
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Type-safe check for a plain object. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
