"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { certificateService } from "@/services/certificate.service";

export const certificateKeys = {
  all: ["certificates"] as const,
  ownList: () => [...certificateKeys.all, "own", "list"] as const,
  own: (id: string) => [...certificateKeys.all, "own", "detail", id] as const,
  publicVerify: (verificationPath: string) =>
    [...certificateKeys.all, "public", "verify", verificationPath] as const,
};

export function useOwnCertificates() {
  return useQuery({
    queryKey: certificateKeys.ownList(),
    queryFn: () => certificateService.listOwn(),
  });
}

export function useOwnCertificate(certificateId: string) {
  return useQuery({
    queryKey: certificateKeys.own(certificateId),
    queryFn: () => certificateService.getOwn(certificateId),
    enabled: Boolean(certificateId),
  });
}

/**
 * Public verification — deliberately its own query key namespace, never
 * merged with or backed by `certificateKeys.own`'s cached (session-owner)
 * data, so a private field could never leak into the public path.
 */
export function useVerifyCertificate(verificationPath: string) {
  return useQuery({
    queryKey: certificateKeys.publicVerify(verificationPath),
    queryFn: () => certificateService.verifyPublic(verificationPath),
    enabled: Boolean(verificationPath),
    retry: false,
  });
}

export function useIssueCertificate(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (completedSkills: string[]) =>
      certificateService.issue(enrollmentId, completedSkills),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}

export function useRevokeCertificate(certificateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => certificateService.revoke(certificateId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: certificateKeys.all });
    },
  });
}
