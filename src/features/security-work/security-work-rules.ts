import type { OperationalAudience } from "@/hooks/use-consulting";
import type { AssessmentStatus, FindingStatus } from "@/types/security-work";

/**
 * The single place the UI derives which assessment/finding actions to show.
 * It mirrors WF-ASM and the D-3 parent-assessment matrix (State & Workflow
 * v1.1 §6.4.1) for usability only — it is NOT a security boundary. The
 * server re-checks role, assignment, authorised scope, state and version on
 * every command, and a stale view is reconciled from its 409 answer.
 *
 * Admin does not bypass the finding matrix: the audience only affects the
 * Admin-only cancel command (API-ASM-006).
 */

export interface AssessmentActions {
  start: boolean;
  complete: boolean;
  cancel: boolean;
}

export function assessmentActionsFor(
  status: AssessmentStatus,
  audience: OperationalAudience,
): AssessmentActions {
  return {
    start: status === "PLANNED",
    complete: status === "IN_PROGRESS",
    cancel: audience === "admin" && (status === "PLANNED" || status === "IN_PROGRESS"),
  };
}

/** D-3: findings may be created only while the parent assessment is IN_PROGRESS. */
export function canCreateFinding(parent: AssessmentStatus): boolean {
  return parent === "IN_PROGRESS";
}

export interface FindingActions {
  edit: boolean;
  startRemediation: boolean;
  resolve: boolean;
  reopen: boolean;
}

/**
 * D-3 matrix:
 * - PLANNED: nothing.
 * - IN_PROGRESS: edits while OPEN/REMEDIATION_IN_PROGRESS, plus valid commands.
 * - COMPLETED: valid commands only — no edits.
 * - CANCELLED: nothing, for every role including Admin.
 * A RESOLVED finding is never edited; it must be reopened first.
 */
export function findingActionsFor(
  parent: AssessmentStatus,
  finding: FindingStatus,
): FindingActions {
  const commandsAllowed = parent === "IN_PROGRESS" || parent === "COMPLETED";
  const unresolved = finding === "OPEN" || finding === "REMEDIATION_IN_PROGRESS";
  return {
    edit: parent === "IN_PROGRESS" && unresolved,
    startRemediation: commandsAllowed && finding === "OPEN",
    resolve: commandsAllowed && unresolved,
    reopen: commandsAllowed && finding === "RESOLVED",
  };
}

/** Explains, in user terms, why some finding actions are not offered. */
export function findingLockReason(parent: AssessmentStatus, finding: FindingStatus): string | null {
  switch (parent) {
    case "PLANNED":
      return "The assessment hasn't started, so this finding can't be changed yet.";
    case "CANCELLED":
      return "The assessment was cancelled. Its findings are frozen for every role.";
    case "COMPLETED":
      return "The assessment is completed, so finding details are locked. Remediation, resolution and reopening remain available.";
    case "IN_PROGRESS":
      return finding === "RESOLVED"
        ? "Resolved findings can't be edited. Reopen the finding first if it needs to change."
        : null;
  }
}

/** Explains why findings can't be recorded under the current assessment state. */
export function findingCreateLockReason(parent: AssessmentStatus): string | null {
  switch (parent) {
    case "PLANNED":
      return "Start the assessment to record findings.";
    case "COMPLETED":
      return "The assessment is completed. New findings can't be recorded.";
    case "CANCELLED":
      return "The assessment was cancelled. Findings can't be recorded or changed.";
    case "IN_PROGRESS":
      return null;
  }
}
