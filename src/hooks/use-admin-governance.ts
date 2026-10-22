"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import {
  type AdminEmployerListParams,
  type AdminUserListParams,
  type AuditLogListParams,
  adminGovernanceService,
  type EmployerProfileUpdate,
} from "@/services/admin-governance.service";
import type { EmployerStatus } from "@/types/admin-governance";
import type { Role } from "@/types/auth";

/**
 * Admin governance reads live under their own key root. Filters are part of
 * each list key, so a filter change starts a fresh cursor sequence; the whole
 * cache is cleared on login and logout (G6D-04), so entries never cross
 * accounts. 403/404 responses are final and are not retried.
 */
export const adminGovernanceKeys = {
  all: ["admin-governance"] as const,
  auditLists: () => [...adminGovernanceKeys.all, "audit-logs", "list"] as const,
  auditDetail: (id: string) => [...adminGovernanceKeys.all, "audit-logs", "detail", id] as const,
  userLists: () => [...adminGovernanceKeys.all, "users", "list"] as const,
  userDetail: (id: string) => [...adminGovernanceKeys.all, "users", "detail", id] as const,
  employerLists: () => [...adminGovernanceKeys.all, "employers", "list"] as const,
  employerDetail: (id: string) => [...adminGovernanceKeys.all, "employers", "detail", id] as const,
};

// API-AUD-001 / 002
export const useAuditLogs = (params: AuditLogListParams, enabled = true) =>
  useCursorPagination(
    adminGovernanceKeys.auditLists(),
    params,
    adminGovernanceService.listAuditLogs,
    { enabled },
  );

export const useAuditLog = (auditLogId: string) =>
  useQuery({
    queryKey: adminGovernanceKeys.auditDetail(auditLogId),
    queryFn: () => adminGovernanceService.getAuditLog(auditLogId),
  });

// API-ADM-001 / 002
export const useAdminUsers = (params: AdminUserListParams) =>
  useCursorPagination(adminGovernanceKeys.userLists(), params, adminGovernanceService.listUsers);

export const useAdminUser = (userId: string) =>
  useQuery({
    queryKey: adminGovernanceKeys.userDetail(userId),
    queryFn: () => adminGovernanceService.getUser(userId),
  });

// API-ADM-004 / 005
export const useAdminEmployers = (params: AdminEmployerListParams) =>
  useCursorPagination(
    adminGovernanceKeys.employerLists(),
    params,
    adminGovernanceService.listEmployers,
  );

export const useAdminEmployer = (employerId: string) =>
  useQuery({
    queryKey: adminGovernanceKeys.employerDetail(employerId),
    queryFn: () => adminGovernanceService.getEmployer(employerId),
  });

// --- Wave 7B mutations (API-ADM-003/006/007) ---------------------------
// Each renders its own inline error (meta.inlineErrors), so the global toast
// is suppressed. On success the server response replaces the detail cache
// and the affected lists plus all audit queries are invalidated; nothing is
// updated optimistically.

export const useChangeUserRole = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (role: Role) => adminGovernanceService.changeUserRole(userId, role),
    meta: { inlineErrors: true },
    onSuccess: async (user) => {
      queryClient.setQueryData(adminGovernanceKeys.userDetail(userId), user);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminGovernanceKeys.userDetail(userId) }),
        queryClient.invalidateQueries({ queryKey: adminGovernanceKeys.userLists() }),
        queryClient.invalidateQueries({ queryKey: [...adminGovernanceKeys.all, "employers"] }),
        queryClient.invalidateQueries({ queryKey: [...adminGovernanceKeys.all, "audit-logs"] }),
      ]);
    },
  });
};

function useEmployerMutation<TInput>(
  employerId: string,
  mutationFn: (input: TInput) => ReturnType<typeof adminGovernanceService.getEmployer>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { inlineErrors: true },
    onSuccess: async (employer) => {
      queryClient.setQueryData(adminGovernanceKeys.employerDetail(employerId), employer);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminGovernanceKeys.employerDetail(employerId) }),
        queryClient.invalidateQueries({ queryKey: adminGovernanceKeys.employerLists() }),
        queryClient.invalidateQueries({ queryKey: [...adminGovernanceKeys.all, "audit-logs"] }),
      ]);
    },
  });
}

export const useUpdateEmployerProfile = (employerId: string) =>
  useEmployerMutation(employerId, (input: EmployerProfileUpdate) =>
    adminGovernanceService.updateEmployerProfile(employerId, input),
  );

export const useUpdateEmployerStatus = (employerId: string) =>
  useEmployerMutation(employerId, (status: EmployerStatus) =>
    adminGovernanceService.updateEmployerStatus(employerId, status),
  );
