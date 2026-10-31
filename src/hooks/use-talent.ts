"use client";

import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { talentService } from "@/services/talent.service";
import type { TalentListParams } from "@/types/talent";

export const talentKeys = {
  all: ["talent"] as const,
  lists: () => [...talentKeys.all, "list"] as const,
};

/**
 * API-PORT-025. Each skill value is its own query identity, so pages from a
 * previous search never append to a new one. Callers gate on the Business
 * role so other roles never send this request.
 */
export const useTalentDirectory = (params: TalentListParams, enabled = true) =>
  useCursorPagination(talentKeys.lists(), params, talentService.list, { enabled });
