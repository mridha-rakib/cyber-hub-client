/**
 * Frontend-owned Career Listing contract types, hand-derived from the actual
 * backend implementation (`api/src/modules/career`, verified against API
 * Contract v1.1 and the Wave 3B controllers/DTOs) — not imported cross-repo,
 * not generated. Field names/shapes here must stay in sync with the backend
 * by hand.
 */

export type CareerListingType = "JOB" | "INTERNSHIP" | "GRADUATE_ROLE" | "APPRENTICESHIP";

export const CAREER_LISTING_TYPE_LABELS: Record<CareerListingType, string> = {
  JOB: "Job",
  INTERNSHIP: "Internship",
  GRADUATE_ROLE: "Graduate role",
  APPRENTICESHIP: "Apprenticeship",
};

/** Shared with EmployerOpportunity — both use the exact same `listing_status` workflow. */
export type ListingStatus = "SUBMITTED" | "UNDER_REVIEW" | "PUBLISHED" | "REJECTED" | "CLOSED";

/**
 * Public response shape (API-CAR-001/002) — the backend's own `toPublicView`
 * mapper deliberately omits `employerId`, `submittedByUserId`,
 * `moderationReason`, and `stateVersion`. Never widen this type to match the
 * Business/Admin shape below; that would imply fields the public endpoint
 * does not actually return.
 */
export interface PublicCareerListing {
  id: string;
  title: string;
  employerName: string;
  location: string;
  level: string;
  skills: string[];
  listingType: CareerListingType;
  remoteUk: boolean;
  publishedAt: string;
}

/**
 * Business/Admin response shape (API-BIZCAR-*, API-MOD-CAR-*) — the full
 * persisted row, including the caller's own moderation/ownership context.
 * `employerId`/`submittedByUserId` are read-only display context here, never
 * editable form fields.
 */
export interface CareerListing {
  id: string;
  title: string;
  employerName: string;
  employerId: string | null;
  location: string;
  level: string;
  skills: string[];
  applicationUrl: string;
  listingType: CareerListingType;
  remoteUk: boolean;
  status: ListingStatus;
  stateVersion: number;
  submittedByUserId: string | null;
  moderationReason: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** API-BIZCAR-001 request body. `employerId`/`employerName`/status fields are server-owned. */
export interface BusinessCareerListingInput {
  title: string;
  location: string;
  level: string;
  skills: string[];
  applicationUrl: string;
  listingType: CareerListingType;
  remoteUk?: boolean;
}

/** API-BIZCAR-004 request body — any subset of the create fields, REJECTED-state only. */
export type BusinessCareerListingUpdateInput = Partial<BusinessCareerListingInput> & {
  expectedStateVersion: number;
};
