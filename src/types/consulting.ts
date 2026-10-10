/**
 * Consulting (Wave 4) types. Every interface mirrors a real Wave 4B response
 * projection in `api/src/modules/consulting/services/consulting.service.ts`
 * — the Business client view deliberately omits operational fields, so do
 * not widen it with fields the API never returns to a Business.
 */

export const CONSULTING_STATUSES = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ACCEPTED",
  "DECLINED",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export type ConsultingStatus = (typeof CONSULTING_STATUSES)[number];

/** `security_service_type` — the only approved service (and scope activity) vocabulary. */
export const CONSULTING_SERVICES = [
  "WEBSITE_ASSESSMENT",
  "NETWORK_ASSESSMENT",
  "VULNERABILITY_ASSESSMENT",
  "PHISHING_AWARENESS",
  "CLOUD_REVIEW",
  "CYBER_RISK_ASSESSMENT",
  "SECURITY_DOCUMENTATION",
] as const;

export type ConsultingService = (typeof CONSULTING_SERVICES)[number];

export type JsonRecord = Record<string, unknown>;
/** Scope fields are stored as JSON containers (array or object) by the API. */
export type JsonContainer = unknown[] | JsonRecord;

/** API-CON-001/002/003 — Business client projection (never internal notes). */
export interface ConsultingRequestClient {
  id: string;
  requestedService: ConsultingService;
  companyDetails: JsonRecord;
  businessSize: string;
  status: ConsultingStatus;
  stateVersion: number;
  submittedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
}

/** API-CON-004/005 and the `currentAuthorization` embedded in API-CON-007. */
export interface ScopeAuthorization {
  id: string;
  versionNo: number;
  authorizedTargets: JsonContainer;
  allowedActivities: JsonContainer;
  restrictions: JsonContainer | null;
  confirmedAt: string;
  validFrom: string;
  validUntil: string | null;
  isCurrent: boolean;
  supersededAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

/** API-CON-006/008..013 — Consultant/Admin operational projection. */
export interface ConsultingRequestOperational {
  id: string;
  employerId: string;
  companyDetails: JsonRecord;
  businessSize: string;
  securityConcern: string;
  businessImpact: string | null;
  requestedService: ConsultingService;
  environmentDetails: JsonRecord | null;
  contactInformation: JsonRecord;
  status: ConsultingStatus;
  stateVersion: number;
  assignedConsultantId: string | null;
  submittedAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
}

/** API-CON-007 — operational request plus its current authorised scope (notes are separate). */
export interface ConsultingRequestDetail extends ConsultingRequestOperational {
  currentAuthorization: ScopeAuthorization | null;
}

/** API-CON-014/015 — restricted internal note. Never part of any Business projection. */
export interface ConsultingNote {
  id: string;
  consultingRequestId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

/** API-CON-001 `ConsultingRequestInput` (strict — no extra top-level keys). */
export interface ConsultingRequestInput {
  companyDetails: JsonRecord;
  businessSize: string;
  securityConcern: string;
  businessImpact?: string;
  requestedService: ConsultingService;
  environmentDetails?: JsonRecord;
  contactInformation: JsonRecord;
}

/** API-CON-004 `ScopeAuthorizationInput` (strict; `attestation` must be literally `true`). */
export interface ScopeAuthorizationInput {
  authorizedTargets: string[];
  allowedActivities: ConsultingService[];
  restrictions?: string[];
  validFrom: string;
  validUntil?: string;
  attestation: true;
}

export type ConsultingTransitionAction = "start-review" | "accept" | "start-delivery" | "complete";
