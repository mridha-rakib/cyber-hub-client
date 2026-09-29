/**
 * Frontend-owned Employer Opportunity contract types, hand-derived from the
 * actual backend implementation (`api/src/modules/career`, verified against
 * API Contract v1.1 and the Wave 3B controllers/DTOs).
 */

import type { ListingStatus } from "@/types/career";

export type EmployerOpportunityType = "INTERNSHIP_OPPORTUNITY" | "STUDENT_PROJECT";

export const EMPLOYER_OPPORTUNITY_TYPE_LABELS: Record<EmployerOpportunityType, string> = {
  INTERNSHIP_OPPORTUNITY: "Internship opportunity",
  STUDENT_PROJECT: "Student project",
};

/**
 * Public response shape (API-EMP-001/002). Unlike `PublicCareerListing`, the
 * ERD defines no employer-display-name snapshot column on
 * `employer_opportunities` — the public response genuinely has no company
 * name field. Do not invent one; see the Wave 3C report's UX contract note.
 */
export interface PublicEmployerOpportunity {
  id: string;
  type: EmployerOpportunityType;
  title: string;
  description: string;
  requirements: Record<string, unknown> | null;
  skills: string[] | null;
  applicationUrl: string | null;
  status: ListingStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Business/Admin response shape (API-BIZOPP-*, API-MOD-OPP-*) — the full persisted row. */
export interface EmployerOpportunity {
  id: string;
  employerId: string;
  createdByUserId: string;
  type: EmployerOpportunityType;
  title: string;
  description: string;
  requirements: Record<string, unknown> | null;
  skills: string[] | null;
  applicationUrl: string | null;
  status: ListingStatus;
  stateVersion: number;
  moderationReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** API-BIZOPP-001 request body. Ownership/status/moderation fields are server-owned. */
export interface EmployerOpportunityInput {
  type: EmployerOpportunityType;
  title: string;
  description: string;
  requirements?: Record<string, unknown>;
  skills?: string[];
  applicationUrl?: string;
}

/** API-BIZOPP-004 request body — any subset of the create fields, REJECTED-state only. */
export type EmployerOpportunityUpdateInput = Partial<EmployerOpportunityInput> & {
  expectedStateVersion: number;
};
