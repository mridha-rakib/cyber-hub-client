import { z } from "zod";

import { CONSULTING_SERVICES } from "@/types/consulting";
import { ASSESSMENT_STATUSES, FINDING_SEVERITIES, FINDING_STATUSES } from "@/types/security-work";

/**
 * Business client-safe projections (API Contract v1.5). Every Business
 * response is parsed through these schemas so only the approved keys ever
 * reach a component: Zod object parsing strips any property the contract
 * does not list. Score values are JSON numbers (D6C-3); a missing current
 * score is `null`, never 0.
 */

const timestamp = z.string().min(1);
const scoreValue = z.number().min(0).max(100);

/** AssessmentClientView — API-ASM-007/008 and dashboard previews. */
export const assessmentClientViewSchema = z.object({
  id: z.string(),
  service: z.enum(CONSULTING_SERVICES),
  status: z.enum(ASSESSMENT_STATUSES),
  startedAt: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  createdAt: timestamp,
});

/** FindingClientView — resolvedAt is present only while the finding is RESOLVED. */
export const findingClientViewSchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: z.enum(FINDING_SEVERITIES),
  recommendation: z.string(),
  status: z.enum(FINDING_STATUSES),
  resolvedAt: timestamp.nullable().optional(),
  createdAt: timestamp,
});

/** SecurityScoreView — overall plus seven nullable category scores. */
export const securityScoreViewSchema = z.object({
  id: z.string(),
  assessmentId: z.string(),
  overallScore: scoreValue,
  websiteSecurityScore: scoreValue.nullable(),
  networkSecurityScore: scoreValue.nullable(),
  emailSecurityScore: scoreValue.nullable(),
  authenticationSecurityScore: scoreValue.nullable(),
  employeeAwarenessScore: scoreValue.nullable(),
  cloudSecurityScore: scoreValue.nullable(),
  backupRecoveryScore: scoreValue.nullable(),
  methodologyVersion: z.string(),
  calculatedAt: timestamp,
});

/** SecurityDashboardView (D6C-1): exactly four properties. */
export const securityDashboardViewSchema = z.object({
  currentScore: securityScoreViewSchema.nullable(),
  openRiskCounts: z.object({
    CRITICAL: z.number().int().min(0),
    HIGH: z.number().int().min(0),
    MEDIUM: z.number().int().min(0),
    LOW: z.number().int().min(0),
  }),
  recentAssessments: z.array(assessmentClientViewSchema).max(5),
  recommendedActions: z.array(findingClientViewSchema).max(5),
});

export const CLIENT_REPORT_STATUSES = ["RELEASED", "SUPERSEDED"] as const;

/** SecurityReportClientView — Business sees only RELEASED or SUPERSEDED reports. */
export const securityReportClientViewSchema = z.object({
  id: z.string(),
  assessmentId: z.string(),
  status: z.enum(CLIENT_REPORT_STATUSES),
  versionNo: z.number().int().min(1),
  releasedAt: timestamp.nullable(),
  downloadAvailable: z.boolean(),
});

/** API-RPT-011 detail: metadata plus live included findings. */
export const securityReportClientDetailSchema = securityReportClientViewSchema.extend({
  includedFindings: z.array(findingClientViewSchema),
});

export const cursorMetaSchema = z.object({
  page: z.object({
    limit: z.number(),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});
