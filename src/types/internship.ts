/**
 * Frontend-owned Internship contract types, hand-derived from the actual
 * backend implementation (`api/src/modules/internship`, verified against
 * API Contract v1.1 §9 and the Wave 0D-6 workflow registry) — not imported
 * cross-repo, not generated. Field names/shapes here must stay in sync with
 * the backend DTOs/response projections by hand.
 */

export type InternshipStatus = "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
export type ApplicationStatus = "SUBMITTED" | "UNDER_REVIEW" | "ACCEPTED" | "REJECTED";
export type SubmissionStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REVISION_REQUIRED";
export type CompletionEligibility = "NOT_ELIGIBLE" | "ELIGIBLE";

export interface Internship {
  id: string;
  title: string;
  description: string;
  requirements: Record<string, unknown>;
  duration: Record<string, unknown>;
  status: InternshipStatus;
  stateVersion: number;
  completionCriteria: unknown[];
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  internshipId: string;
  title: string;
  description: string;
  orderNo: number;
  requirements: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InternshipApplication {
  id: string;
  internshipId: string;
  userId: string;
  status: ApplicationStatus;
  stateVersion: number;
  applicationData: Record<string, unknown>;
  submittedAt: string;
  reviewStartedAt: string | null;
  reviewedAt: string | null;
  reviewerId: string | null;
  decisionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InternshipEnrollment {
  id: string;
  applicationId: string;
  internshipId: string;
  userId: string;
  completionEligibility: CompletionEligibility;
  eligibilityEvaluatedAt: string | null;
  eligibleAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAssignment {
  id: string;
  enrollmentId: string;
  taskId: string;
  assignedByUserId: string;
  assignedAt: string;
  dueAt: string | null;
}

export interface Submission {
  id: string;
  taskId: string;
  taskAssignmentId: string;
  userId: string;
  status: SubmissionStatus;
  reviewerId: string | null;
  stateVersion: number;
  currentVersion: number;
  submittedAt: string;
  reviewStartedAt: string | null;
  approvedAt: string | null;
  reviewFeedback: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionVersion {
  id: string;
  submissionId: string;
  versionNo: number;
  evidenceText: string | null;
  evidenceMetadata: Record<string, unknown>;
  createdByUserId: string;
  createdAt: string;
}

export interface SubmissionWithVersions {
  submission: Submission;
  versions: SubmissionVersion[];
}

export interface AcceptApplicationResult {
  application: InternshipApplication;
  enrollment: InternshipEnrollment;
}
