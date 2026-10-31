import { z } from "zod";

import { ROLES } from "@/types/auth";

/**
 * Wave 7D self-service projections (API Contract v1.7). Parsed with Zod's
 * default stripping, so any key the server did not approve is dropped
 * before it reaches a component.
 */
const isoString = z.string().min(1);

/** UserSelfView (API-ACC-001/002/005). `profile` has no approved leaf fields yet. */
export const userSelfViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  verified: z.boolean(),
  profile: z.record(z.string(), z.unknown()),
  employerId: z.string().nullable(),
  deletionRequestedAt: isoString.nullable(),
  createdAt: isoString,
  updatedAt: isoString,
});

export const EMPLOYER_STATUSES = ["ACTIVE", "SUSPENDED", "CLOSED"] as const;

/** Business self-view (API-ACC-003/004), owner decision D4. */
export const businessSelfViewSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  email: z.string(),
  status: z.enum(EMPLOYER_STATUSES),
  createdAt: isoString,
  updatedAt: isoString,
});

export type UserSelfView = z.infer<typeof userSelfViewSchema>;
export type BusinessSelfView = z.infer<typeof businessSelfViewSchema>;

/** API-ACC-002 body: `name` is the only editable field. */
export interface UserProfileUpdate {
  name: string;
}

/** API-ACC-004 body: only the changed contract fields. */
export interface BusinessProfileUpdate {
  companyName?: string;
  email?: string;
}

/** API-ACC-005 optional reason limit (D5). */
export const DELETION_REASON_MAX_LENGTH = 1000;
