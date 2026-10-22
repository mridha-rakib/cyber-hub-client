import { z } from "zod";

import { ROLES } from "@/types/auth";

/**
 * Wave 7A Admin governance projections (API-AUD-001/002, API-ADM-001/002/
 * 004/005). Objects are parsed with Zod's default stripping, so any key the
 * server did not approve is dropped before it can reach a component.
 */
export const EMPLOYER_STATUSES = ["ACTIVE", "SUSPENDED", "CLOSED"] as const;

const isoString = z.string().min(1);

const auditMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string()),
]);

export const auditLogViewSchema = z.object({
  id: z.string(),
  actorUserId: z.string().nullable(),
  actorRole: z.string().nullable(),
  serviceContext: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().nullable(),
  userId: z.string().nullable(),
  employerId: z.string().nullable(),
  timestamp: isoString,
  metadata: z.record(z.string(), auditMetadataValueSchema),
  requestId: z.string().nullable(),
});

export const adminUserViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  verified: z.boolean(),
  verifiedAt: isoString.nullable(),
  employerId: z.string().nullable(),
  deletionRequestedAt: isoString.nullable(),
  createdAt: isoString,
  updatedAt: isoString,
});

export const adminEmployerViewSchema = z.object({
  id: z.string(),
  companyName: z.string(),
  email: z.string(),
  status: z.enum(EMPLOYER_STATUSES),
  createdAt: isoString,
  updatedAt: isoString,
});

export const employerMemberViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  verified: z.boolean(),
  createdAt: isoString,
});

export const adminEmployerDetailSchema = adminEmployerViewSchema.extend({
  users: z.array(employerMemberViewSchema),
});
