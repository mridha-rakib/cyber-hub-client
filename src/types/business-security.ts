/**
 * Business security (Wave 6) client-safe types. They are inferred from the
 * Zod schemas the service layer parses every Business response with, so a
 * component can only ever see the approved API Contract v1.5 fields.
 */

import type { z } from "zod";

import type {
  assessmentClientViewSchema,
  CLIENT_REPORT_STATUSES,
  findingClientViewSchema,
  securityDashboardViewSchema,
  securityReportClientDetailSchema,
  securityReportClientViewSchema,
  securityScoreViewSchema,
} from "@/schemas/business-security.schema";

export type AssessmentClientView = z.infer<typeof assessmentClientViewSchema>;
export type FindingClientView = z.infer<typeof findingClientViewSchema>;
export type SecurityScoreView = z.infer<typeof securityScoreViewSchema>;
export type SecurityDashboardView = z.infer<typeof securityDashboardViewSchema>;
export type SecurityReportClientView = z.infer<typeof securityReportClientViewSchema>;
export type SecurityReportClientDetail = z.infer<typeof securityReportClientDetailSchema>;
export type ClientReportStatus = (typeof CLIENT_REPORT_STATUSES)[number];

/** The seven approved category score fields, in display order. */
export const SCORE_CATEGORIES = [
  { key: "websiteSecurityScore", label: "Website security" },
  { key: "networkSecurityScore", label: "Network security" },
  { key: "emailSecurityScore", label: "Email security" },
  { key: "authenticationSecurityScore", label: "Password & authentication" },
  { key: "employeeAwarenessScore", label: "Employee security awareness" },
  { key: "cloudSecurityScore", label: "Cloud security" },
  { key: "backupRecoveryScore", label: "Backup & recovery" },
] as const satisfies readonly { key: keyof SecurityScoreView; label: string }[];
