"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CertificateDisplayInput, PublicationInput } from "@/services/portfolio.service";
import { portfolioService } from "@/services/portfolio.service";
import type {
  PortfolioAchievement,
  PortfolioCertification,
  PortfolioEvidence,
  PortfolioLink,
  PortfolioProject,
  PortfolioSkill,
} from "@/types/portfolio";

export const portfolioKeys = {
  own: ["portfolio", "own"] as const,
  public: (slug: string) => ["portfolio", "public", slug] as const,
};

export function useOwnPortfolio() {
  return useQuery({
    queryKey: portfolioKeys.own,
    queryFn: () => portfolioService.getOwn(),
  });
}

/**
 * Public portfolio — its own query key namespace, never sharing a cache
 * entry with `portfolioKeys.own` (Wave 2 Phase 39: the public page must
 * render only the backend's public DTO, never enriched by cached private
 * `/me/portfolio` data).
 */
export function usePublicPortfolio(publicSlug: string) {
  return useQuery({
    queryKey: portfolioKeys.public(publicSlug),
    queryFn: () => portfolioService.getPublic(publicSlug),
    enabled: Boolean(publicSlug),
    retry: false,
  });
}

export function useUpdatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PublicationInput) => portfolioService.updatePublication(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.own });
    },
  });
}

function useInvalidateOwnPortfolio() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: portfolioKeys.own });
}

// --- Projects ---------------------------------------------------------------
export function useCreateProject() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (input: Partial<PortfolioProject>) => portfolioService.createProject(input),
    onSuccess: invalidate,
  });
}
export function useUpdateProject() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PortfolioProject> }) =>
      portfolioService.updateProject(id, input),
    onSuccess: invalidate,
  });
}
export function useDeleteProject() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (id: string) => portfolioService.deleteProject(id),
    onSuccess: invalidate,
  });
}

// --- Links --------------------------------------------------------------------
export function useCreateLink() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (input: Partial<PortfolioLink>) => portfolioService.createLink(input),
    onSuccess: invalidate,
  });
}
export function useUpdateLink() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PortfolioLink> }) =>
      portfolioService.updateLink(id, input),
    onSuccess: invalidate,
  });
}
export function useDeleteLink() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (id: string) => portfolioService.deleteLink(id),
    onSuccess: invalidate,
  });
}

// --- Skills ---------------------------------------------------------------------
export function useCreateSkill() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (input: Partial<PortfolioSkill>) => portfolioService.createSkill(input),
    onSuccess: invalidate,
  });
}
export function useUpdateSkill() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PortfolioSkill> }) =>
      portfolioService.updateSkill(id, input),
    onSuccess: invalidate,
  });
}
export function useDeleteSkill() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (id: string) => portfolioService.deleteSkill(id),
    onSuccess: invalidate,
  });
}

// --- Certifications ---------------------------------------------------------------
export function useCreateCertification() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (input: Partial<PortfolioCertification>) =>
      portfolioService.createCertification(input),
    onSuccess: invalidate,
  });
}
export function useUpdateCertification() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PortfolioCertification> }) =>
      portfolioService.updateCertification(id, input),
    onSuccess: invalidate,
  });
}
export function useDeleteCertification() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (id: string) => portfolioService.deleteCertification(id),
    onSuccess: invalidate,
  });
}

// --- Evidence -----------------------------------------------------------------
export function useCreateEvidence() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (input: Partial<PortfolioEvidence>) => portfolioService.createEvidence(input),
    onSuccess: invalidate,
  });
}
export function useUpdateEvidence() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PortfolioEvidence> }) =>
      portfolioService.updateEvidence(id, input),
    onSuccess: invalidate,
  });
}
export function useDeleteEvidence() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (id: string) => portfolioService.deleteEvidence(id),
    onSuccess: invalidate,
  });
}

// --- Achievements -------------------------------------------------------------
export function useCreateAchievement() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (input: Partial<PortfolioAchievement>) => portfolioService.createAchievement(input),
    onSuccess: invalidate,
  });
}
export function useUpdateAchievement() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PortfolioAchievement> }) =>
      portfolioService.updateAchievement(id, input),
    onSuccess: invalidate,
  });
}
export function useDeleteAchievement() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (id: string) => portfolioService.deleteAchievement(id),
    onSuccess: invalidate,
  });
}

// --- Certificate display linking -----------------------------------------------
export function useAddOrUpdatePortfolioCertificate() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: ({
      certificateId,
      input,
    }: {
      certificateId: string;
      input: CertificateDisplayInput;
    }) => portfolioService.addOrUpdateCertificate(certificateId, input),
    onSuccess: invalidate,
  });
}
export function useUpdatePortfolioCertificateDisplay() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: ({
      certificateId,
      input,
    }: {
      certificateId: string;
      input: Partial<CertificateDisplayInput>;
    }) => portfolioService.updateCertificateDisplay(certificateId, input),
    onSuccess: invalidate,
  });
}
export function useRemovePortfolioCertificate() {
  const invalidate = useInvalidateOwnPortfolio();
  return useMutation({
    mutationFn: (certificateId: string) => portfolioService.removeCertificate(certificateId),
    onSuccess: invalidate,
  });
}
