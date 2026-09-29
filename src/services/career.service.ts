import { api } from "@/services/api";
import type {
  BusinessCareerListingInput,
  BusinessCareerListingUpdateInput,
  CareerListing,
  PublicCareerListing,
} from "@/types/career";

interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

export interface PublicListingListParams {
  type?: string;
  location?: string;
  level?: string;
  skill?: string;
  remoteUk?: boolean;
  cursor?: string;
  limit?: number;
}

export interface OwnListingListParams {
  status?: string;
  cursor?: string;
  limit?: number;
}

export interface AdminListingListParams {
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
 * Typed wrappers around the backend's real Career Listing endpoints
 * (`api/src/modules/career`). Every write that targets an existing resource
 * carries `expectedStateVersion` explicitly — callers must supply the
 * version they last read, never a guessed/incremented one.
 */
export const careerService = {
  // --- Public discovery (API-CAR-001/002) ---------------------------------
  async listPublished(params: PublicListingListParams = {}): Promise<PublicCareerListing[]> {
    return unwrap(api.get(`/career-listings${toQuery(params as Record<string, unknown>)}`));
  },

  async getPublished(listingId: string): Promise<PublicCareerListing> {
    return unwrap(api.get(`/career-listings/${listingId}`));
  },

  // --- Business: own management (API-BIZCAR-*) ----------------------------
  async create(input: BusinessCareerListingInput): Promise<CareerListing> {
    return unwrap(api.post("/business/career-listings", input));
  },

  async listOwn(params: OwnListingListParams = {}): Promise<CareerListing[]> {
    return unwrap(
      api.get(`/business/career-listings${toQuery(params as Record<string, unknown>)}`),
    );
  },

  async getOwn(listingId: string): Promise<CareerListing> {
    return unwrap(api.get(`/business/career-listings/${listingId}`));
  },

  async update(listingId: string, input: BusinessCareerListingUpdateInput): Promise<CareerListing> {
    return unwrap(api.patch(`/business/career-listings/${listingId}`, input));
  },

  async resubmit(listingId: string, expectedStateVersion: number): Promise<CareerListing> {
    return unwrap(
      api.post(`/business/career-listings/${listingId}/resubmit`, { expectedStateVersion }),
    );
  },

  async close(listingId: string, expectedStateVersion: number): Promise<CareerListing> {
    return unwrap(
      api.post(`/business/career-listings/${listingId}/close`, { expectedStateVersion }),
    );
  },

  // --- Admin: moderation (API-MOD-001, API-MOD-CAR-*) ---------------------
  async listAdmin(params: AdminListingListParams = {}): Promise<CareerListing[]> {
    return unwrap(api.get(`/admin/career-listings${toQuery(params as Record<string, unknown>)}`));
  },

  async startReview(listingId: string, expectedStateVersion: number): Promise<CareerListing> {
    return unwrap(
      api.post(`/admin/career-listings/${listingId}/start-review`, { expectedStateVersion }),
    );
  },

  async publish(listingId: string, expectedStateVersion: number): Promise<CareerListing> {
    return unwrap(
      api.post(`/admin/career-listings/${listingId}/publish`, { expectedStateVersion }),
    );
  },

  async reject(
    listingId: string,
    input: { expectedStateVersion: number; reason: string },
  ): Promise<CareerListing> {
    return unwrap(api.post(`/admin/career-listings/${listingId}/reject`, input));
  },

  async adminClose(listingId: string, expectedStateVersion: number): Promise<CareerListing> {
    return unwrap(api.post(`/admin/career-listings/${listingId}/close`, { expectedStateVersion }));
  },
};
