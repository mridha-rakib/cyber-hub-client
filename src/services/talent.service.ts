import { cursorMetaSchema } from "@/schemas/business-security.schema";
import { api } from "@/services/api";
import type { CursorPage } from "@/types/api";
import { type TalentListParams, type TalentSummary, talentSummarySchema } from "@/types/talent";

interface Envelope {
  data: unknown;
  meta?: unknown;
}

/**
 * API-PORT-025 Business talent discovery through the shared API client.
 * Only the approved summary fields survive parsing; the opaque cursor is
 * passed back unchanged.
 */
export const talentService = {
  list: async (params: TalentListParams): Promise<CursorPage<TalentSummary>> => {
    const search = new URLSearchParams();
    if (params.skill) search.set("skill", params.skill);
    if (params.cursor) search.set("cursor", params.cursor);
    if (params.limit) search.set("limit", String(params.limit));
    const qs = search.toString();
    const response = await api.get<Envelope>(`/business/talent${qs ? `?${qs}` : ""}`);
    const items = Array.isArray(response.data.data) ? response.data.data : [];
    return {
      data: items.map((item) => talentSummarySchema.parse(item)),
      meta: cursorMetaSchema.parse(response.data.meta),
    };
  },
};
