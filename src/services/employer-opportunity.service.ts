import { api } from "@/services/api";
import type { CursorPage } from "@/types/api";
import type {
  EmployerOpportunity,
  EmployerOpportunityInput,
  EmployerOpportunityUpdateInput,
  PublicEmployerOpportunity,
} from "@/types/employer-opportunity";

interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

export interface PublicOpportunityListParams {
  type?: string;
  skill?: string;
  cursor?: string;
  limit?: number;
}

export interface OwnOpportunityListParams {
  type?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}

export interface AdminOpportunityListParams {
  status?: string;
  employerId?: string;
  type?: string;
  cursor?: string;
  limit?: number;
}

async function unwrap<T>(promise: Promise<{ data: Envelope<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Typed wrappers around the backend's real Employer Opportunity endpoints
 * (`api/src/modules/career`). Every write that targets an existing resource
 * carries `expectedStateVersion` explicitly.
 */
export const employerOpportunityService = {
  // --- Public discovery (API-EMP-001/002) ---------------------------------
  async listPublished(
    params: PublicOpportunityListParams = {},
  ): Promise<CursorPage<PublicEmployerOpportunity>> {
    return unwrap(api.get(`/opportunities${toQuery(params as Record<string, unknown>)}`));
  },

  async getPublished(opportunityId: string): Promise<PublicEmployerOpportunity> {
    return unwrap(api.get(`/opportunities/${opportunityId}`));
  },

  // --- Business: own management (API-BIZOPP-*) ----------------------------
  async create(input: EmployerOpportunityInput): Promise<EmployerOpportunity> {
    return unwrap(api.post("/business/opportunities", input));
  },

  async listOwn(params: OwnOpportunityListParams = {}): Promise<CursorPage<EmployerOpportunity>> {
    return unwrap(api.get(`/business/opportunities${toQuery(params as Record<string, unknown>)}`));
  },

  async getOwn(opportunityId: string): Promise<EmployerOpportunity> {
    return unwrap(api.get(`/business/opportunities/${opportunityId}`));
  },

  async update(
    opportunityId: string,
    input: EmployerOpportunityUpdateInput,
  ): Promise<EmployerOpportunity> {
    return unwrap(api.patch(`/business/opportunities/${opportunityId}`, input));
  },

  async resubmit(
    opportunityId: string,
    expectedStateVersion: number,
  ): Promise<EmployerOpportunity> {
    return unwrap(
      api.post(`/business/opportunities/${opportunityId}/resubmit`, { expectedStateVersion }),
    );
  },

  async close(opportunityId: string, expectedStateVersion: number): Promise<EmployerOpportunity> {
    return unwrap(
      api.post(`/business/opportunities/${opportunityId}/close`, { expectedStateVersion }),
    );
  },

  // --- Admin: moderation (API-MOD-002, API-MOD-OPP-*) ---------------------
  async listAdmin(
    params: AdminOpportunityListParams = {},
  ): Promise<CursorPage<EmployerOpportunity>> {
    return unwrap(api.get(`/admin/opportunities${toQuery(params as Record<string, unknown>)}`));
  },

  async startReview(
    opportunityId: string,
    expectedStateVersion: number,
  ): Promise<EmployerOpportunity> {
    return unwrap(
      api.post(`/admin/opportunities/${opportunityId}/start-review`, { expectedStateVersion }),
    );
  },

  async publish(opportunityId: string, expectedStateVersion: number): Promise<EmployerOpportunity> {
    return unwrap(
      api.post(`/admin/opportunities/${opportunityId}/publish`, { expectedStateVersion }),
    );
  },

  async reject(
    opportunityId: string,
    input: { expectedStateVersion: number; reason: string },
  ): Promise<EmployerOpportunity> {
    return unwrap(api.post(`/admin/opportunities/${opportunityId}/reject`, input));
  },

  async adminClose(
    opportunityId: string,
    expectedStateVersion: number,
  ): Promise<EmployerOpportunity> {
    return unwrap(
      api.post(`/admin/opportunities/${opportunityId}/close`, { expectedStateVersion }),
    );
  },
};
