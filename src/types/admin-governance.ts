import type { z } from "zod";

import type {
  adminEmployerDetailSchema,
  adminEmployerViewSchema,
  adminUserViewSchema,
  auditLogViewSchema,
  EMPLOYER_STATUSES,
  employerMemberViewSchema,
} from "@/schemas/admin-governance.schema";

export type AuditLogView = z.infer<typeof auditLogViewSchema>;
export type AdminUserView = z.infer<typeof adminUserViewSchema>;
export type AdminEmployerView = z.infer<typeof adminEmployerViewSchema>;
export type EmployerMemberView = z.infer<typeof employerMemberViewSchema>;
export type AdminEmployerDetail = z.infer<typeof adminEmployerDetailSchema>;
export type EmployerStatus = (typeof EMPLOYER_STATUSES)[number];
