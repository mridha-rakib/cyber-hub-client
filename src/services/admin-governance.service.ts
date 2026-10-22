import type { z } from "zod";

import {
  adminEmployerDetailSchema,
  adminEmployerViewSchema,
  adminUserViewSchema,
  auditLogViewSchema,
} from "@/schemas/admin-governance.schema";
import { cursorMetaSchema } from "@/schemas/business-security.schema";
import { api } from "@/services/api";
import type {
  AdminEmployerDetail,
  AdminEmployerView,
  AdminUserView,
  AuditLogView,
  EmployerStatus,
} from "@/types/admin-governance";
import type { CursorPage } from "@/types/api";
import type { Role } from "@/types/auth";

interface Envelope {
  data: unknown;
  meta?: unknown;
}

/** API-AUD-001 filters exactly as named by API Contract v1.5. */
export interface AuditLogListParams {
  actorUserId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  employerId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
}

export interface AdminUserListParams {
  role?: Role;
  verified?: boolean;
  cursor?: string;
  limit?: number;
}

export interface AdminEmployerListParams {
  status?: EmployerStatus;
  cursor?: string;
  limit?: number;
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function parseOne<T>(promise: Promise<{ data: Envelope }>, schema: z.ZodType<T>): Promise<T> {
  const response = await promise;
  return schema.parse(response.data.data);
}

async function parsePage<T>(
  promise: Promise<{ data: Envelope }>,
  schema: z.ZodType<T>,
): Promise<CursorPage<T>> {
  const response = await promise;
  const items = Array.isArray(response.data.data) ? response.data.data : [];
  return {
    data: items.map((item) => schema.parse(item)),
    meta: cursorMetaSchema.parse(response.data.meta),
  };
}

const segment = (id: string) => encodeURIComponent(id);

/** API-ADM-006 body: only the contract fields; `profile` has no allow-listed keys. */
export interface EmployerProfileUpdate {
  companyName?: string;
  email?: string;
}

/**
 * Admin governance API: Wave 7A reads plus the three Wave 7B mutations
 * (API-ADM-003/006/007). The API client attaches the CSRF header to every
 * PATCH; responses are re-parsed so only approved fields reach components.
 */
export const adminGovernanceService = {
  // API-ADM-003
  changeUserRole: (userId: string, role: Role): Promise<AdminUserView> =>
    parseOne(
      api.patch<Envelope>(`/admin/users/${segment(userId)}/role`, { role }),
      adminUserViewSchema,
    ),
  // API-ADM-006
  updateEmployerProfile: (
    employerId: string,
    input: EmployerProfileUpdate,
  ): Promise<AdminEmployerDetail> =>
    parseOne(
      api.patch<Envelope>(`/admin/employers/${segment(employerId)}/profile`, input),
      adminEmployerDetailSchema,
    ),
  // API-ADM-007
  updateEmployerStatus: (
    employerId: string,
    status: EmployerStatus,
  ): Promise<AdminEmployerDetail> =>
    parseOne(
      api.patch<Envelope>(`/admin/employers/${segment(employerId)}/status`, { status }),
      adminEmployerDetailSchema,
    ),
  // API-AUD-001
  listAuditLogs: (params: AuditLogListParams): Promise<CursorPage<AuditLogView>> =>
    parsePage(api.get<Envelope>(`/admin/audit-logs${toQuery(params)}`), auditLogViewSchema),
  // API-AUD-002
  getAuditLog: (auditLogId: string): Promise<AuditLogView> =>
    parseOne(api.get<Envelope>(`/admin/audit-logs/${segment(auditLogId)}`), auditLogViewSchema),
  // API-ADM-001
  listUsers: (params: AdminUserListParams): Promise<CursorPage<AdminUserView>> =>
    parsePage(api.get<Envelope>(`/admin/users${toQuery(params)}`), adminUserViewSchema),
  // API-ADM-002
  getUser: (userId: string): Promise<AdminUserView> =>
    parseOne(api.get<Envelope>(`/admin/users/${segment(userId)}`), adminUserViewSchema),
  // API-ADM-004
  listEmployers: (params: AdminEmployerListParams): Promise<CursorPage<AdminEmployerView>> =>
    parsePage(api.get<Envelope>(`/admin/employers${toQuery(params)}`), adminEmployerViewSchema),
  // API-ADM-005
  getEmployer: (employerId: string): Promise<AdminEmployerDetail> =>
    parseOne(
      api.get<Envelope>(`/admin/employers/${segment(employerId)}`),
      adminEmployerDetailSchema,
    ),
};
