"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { sessionKeys } from "@/hooks/use-session";
import {
  authService,
  type ConfirmEmailVerificationPayload,
  type ConfirmPasswordResetPayload,
  type LoginPayload,
  type RegisterBusinessPayload,
  type RegisterLearnerPayload,
  type RequestEmailVerificationPayload,
  type RequestPasswordResetPayload,
} from "@/services/auth.service";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (session) => {
      // Seed the cache directly instead of just invalidating — the response
      // already *is* the session, so there's no reason to wait on a refetch
      // before the authenticated shell can render.
      queryClient.setQueryData(sessionKeys.all, session);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      // The backend owns session revocation (it clears the HttpOnly cookie);
      // this only clears what the frontend cached about that session. Clear
      // the whole cache, not just the session query — any per-user data
      // fetched while authenticated must not linger for whoever uses this
      // browser/tab next.
      queryClient.clear();
    },
  });
}

export function useRegisterLearner() {
  return useMutation({
    mutationFn: (payload: RegisterLearnerPayload) => authService.registerLearner(payload),
  });
}

export function useRegisterBusiness() {
  return useMutation({
    mutationFn: (payload: RegisterBusinessPayload) => authService.registerBusiness(payload),
  });
}

export function useRequestEmailVerification() {
  return useMutation({
    mutationFn: (payload: RequestEmailVerificationPayload) =>
      authService.requestEmailVerification(payload),
  });
}

export function useConfirmEmailVerification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmEmailVerificationPayload) =>
      authService.confirmEmailVerification(payload),
    onSuccess: () => {
      // `verified` may have flipped on the session user; refetch rather than
      // guess at the new shape.
      queryClient.invalidateQueries({ queryKey: sessionKeys.all });
    },
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (payload: RequestPasswordResetPayload) => authService.requestPasswordReset(payload),
  });
}

export function useConfirmPasswordReset() {
  return useMutation({
    mutationFn: (payload: ConfirmPasswordResetPayload) => authService.confirmPasswordReset(payload),
  });
}
