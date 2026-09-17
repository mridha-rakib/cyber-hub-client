/**
 * Frontend-owned Certificate contract types, hand-derived from the actual
 * backend implementation (`api/src/modules/certificate`, verified against
 * API Contract v1.1 §9 and the Wave 0D-6 `Certificate` workflow) — not
 * imported cross-repo, not generated.
 */

export type CertificateStatus = "ISSUED" | "REVOKED";

export interface Certificate {
  id: string;
  userId: string;
  programmeId: string;
  enrollmentId: string;
  certificateNumber: string;
  verificationPath: string;
  status: CertificateStatus;
  recipientNameSnapshot: string;
  programmeTitleSnapshot: string;
  completedSkills: string[];
  issuedAt: string;
  revokedAt: string | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  createdAt: string;
}

/**
 * The public verification response — deliberately a narrower shape than
 * `Certificate`: no `id`/`userId`/`enrollmentId`/`programmeId`/revocation
 * actor, matching the backend's `CertificatePublicVerificationView`
 * allowlist exactly.
 */
export interface CertificatePublicVerification {
  certificateNumber: string;
  status: CertificateStatus;
  issuedAt: string;
  recipientNameSnapshot: string;
  programmeTitleSnapshot: string;
  completedSkills: string[];
}
