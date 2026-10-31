"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { sessionKeys } from "@/hooks/use-session";
import { accountService } from "@/services/account.service";
import type { BusinessProfileUpdate, UserProfileUpdate } from "@/types/account";

export const accountKeys = {
  all: ["account"] as const,
  self: () => [...accountKeys.all, "me"] as const,
  business: () => [...accountKeys.all, "business"] as const,
};

/** API-ACC-001. */
export const useAccountSelf = () =>
  useQuery({ queryKey: accountKeys.self(), queryFn: accountService.getSelf });

/** API-ACC-003 (Business only; callers gate on role so other roles never fire it). */
export const useBusinessProfile = (enabled = true) =>
  useQuery({ queryKey: accountKeys.business(), queryFn: accountService.getBusiness, enabled });

// Mutations render their own inline errors (meta.inlineErrors), so the global
// toast is suppressed. The server response replaces the cache; the session is
// refetched because it carries the user's name and the company name.

/** API-ACC-002. */
export const useUpdateAccountProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UserProfileUpdate) => accountService.updateProfile(input),
    meta: { inlineErrors: true },
    onSuccess: async (user) => {
      queryClient.setQueryData(accountKeys.self(), user);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
};

/** API-ACC-004. */
export const useUpdateBusinessProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BusinessProfileUpdate) => accountService.updateBusiness(input),
    meta: { inlineErrors: true },
    onSuccess: async (employer) => {
      queryClient.setQueryData(accountKeys.business(), employer);
      await queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
};

/** API-ACC-005. Never retried automatically. */
export const useRequestAccountDeletion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => accountService.requestDeletion(reason),
    meta: { inlineErrors: true },
    onSuccess: (user) => {
      queryClient.setQueryData(accountKeys.self(), user);
    },
  });
};
