import { z } from "zod";

/**
 * Wave 7E API-PORT-025 talent summary (owner decision D2). Parsed with Zod's
 * default stripping, so any property the server did not approve is dropped
 * before it can reach a component.
 */
export const talentSummarySchema = z.object({
  publicSlug: z.string().min(1),
  publishedAt: z.string().min(1).nullable(),
  skills: z.array(z.string()),
  counts: z.object({
    projects: z.number().int().nonnegative(),
    certifications: z.number().int().nonnegative(),
    evidence: z.number().int().nonnegative(),
    achievements: z.number().int().nonnegative(),
    links: z.number().int().nonnegative(),
    certificates: z.number().int().nonnegative(),
  }),
});

export type TalentSummary = z.infer<typeof talentSummarySchema>;

/** API-PORT-025 query. `skill` must be 1–100 characters after trimming. */
export interface TalentListParams {
  skill?: string;
  cursor?: string;
  limit?: number;
}

export const TALENT_SKILL_MAX_LENGTH = 100;
