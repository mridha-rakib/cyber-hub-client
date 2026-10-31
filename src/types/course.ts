/**
 * Frontend-owned Course Deal contract types, hand-derived from the accepted
 * Wave 7C backend (`api/src/modules/courses`, API Contract v1.7
 * `CoursePublicView` / `CourseAdminView` / `CourseWriteInput`). Not generated
 * and not imported cross-repo: keep in sync by hand.
 */

export type CourseApprovalStatus = "DRAFT" | "APPROVED" | "REJECTED";

export const COURSE_STATUS_LABELS: Record<CourseApprovalStatus, string> = {
  DRAFT: "Draft",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/**
 * API-CRS-001/002 public projection. Never carries the stored external URL,
 * verification note, rejection reason, approval status or version. Prices are
 * exact decimal strings such as "49.00".
 */
export interface PublicCourse {
  id: string;
  title: string;
  provider: string;
  category: string;
  level: string;
  originalPrice: string;
  discountedPrice: string;
  currency: string;
  expiresAt: string | null;
  hasAffiliateRelationship: boolean | null;
  affiliateDisclosure: string | null;
  /** Computed by the server clock (W7C-8); false means the deal has expired. */
  outboundAvailable: boolean;
}

/** API-ADMCRS-006/007 Admin moderation projection (Admin screens only, UI-DEC-029). */
export interface AdminCourse {
  id: string;
  title: string;
  provider: string;
  category: string;
  level: string;
  originalPrice: string;
  discountedPrice: string;
  currency: string;
  externalUrl: string;
  expiresAt: string | null;
  hasAffiliateRelationship: boolean | null;
  affiliateDisclosure: string | null;
  verificationNote: string | null;
  rejectionReason: string | null;
  approvalStatus: CourseApprovalStatus;
  stateVersion: number;
  createdAt: string;
  updatedAt: string;
}

/** API-ADMCRS-001 body. Approval status, notes, reasons and version are server-owned. */
export interface CourseCreateInput {
  title: string;
  provider: string;
  category: string;
  level: string;
  originalPrice: string;
  discountedPrice: string;
  currency: string;
  externalUrl: string;
  expiresAt?: string | null;
  /** null = not declared (W7C-6); never defaulted to false. */
  hasAffiliateRelationship?: boolean | null;
  affiliateDisclosure?: string | null;
}

/** API-ADMCRS-002 body: any changed subset plus the displayed version (DRAFT/REJECTED only). */
export type CourseUpdateInput = Partial<CourseCreateInput> & { expectedStateVersion: number };

/** API-ADMCRS-003 `CourseApprovalInput`. */
export interface CourseApprovalInput {
  expectedStateVersion: number;
  verificationNote?: string;
}

/** API-ADMCRS-004 `ReasonTransitionInput` (reject a DRAFT or withdraw an APPROVED deal). */
export interface CourseReasonInput {
  expectedStateVersion: number;
  reason: string;
}
