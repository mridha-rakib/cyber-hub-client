import { api } from "@/services/api";
import type { CursorPage } from "@/types/api";
import type {
  AdminResource,
  PublicResource,
  ResourceCreateInput,
  ResourceStatus,
  ResourceUpdateInput,
} from "@/types/resource";

interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

export interface PublicResourceListParams {
  q?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
  sort?: "recent" | "featured";
  cursor?: string;
  limit?: number;
}

export interface AdminResourceListParams {
  q?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
  status?: ResourceStatus;
  cursor?: string;
  limit?: number;
}

async function unwrap<T>(promise: Promise<{ data: Envelope<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

async function unwrapPage<T>(
  promise: Promise<{ data: Envelope<T[]> & { meta: CursorPage<T>["meta"] } }>,
): Promise<CursorPage<T>> {
  const response = await promise;
  return { data: response.data.data, meta: response.data.meta };
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
 * Typed wrappers around the accepted Wave 7C resource endpoints
 * (API-RES-001/002, API-ADMRES-001..007). Every write to an existing record
 * carries the `expectedStateVersion` the screen last displayed (UI-DEC-030);
 * nothing here retries a mutation.
 */
export const resourceService = {
  // --- Public discovery (API-RES-001/002) ---------------------------------
  async listPublished(params: PublicResourceListParams = {}): Promise<CursorPage<PublicResource>> {
    return unwrapPage(api.get(`/resources${toQuery(params as Record<string, unknown>)}`));
  },

  async getPublished(resourceId: string): Promise<PublicResource> {
    return unwrap(api.get(`/resources/${resourceId}`));
  },

  // --- Admin management (API-ADMRES-001..007) -----------------------------
  async listAdmin(params: AdminResourceListParams = {}): Promise<CursorPage<AdminResource>> {
    return unwrapPage(api.get(`/admin/resources${toQuery(params as Record<string, unknown>)}`));
  },

  async getAdmin(resourceId: string): Promise<AdminResource> {
    return unwrap(api.get(`/admin/resources/${resourceId}`));
  },

  async create(input: ResourceCreateInput): Promise<AdminResource> {
    return unwrap(api.post("/admin/resources", input));
  },

  async update(resourceId: string, input: ResourceUpdateInput): Promise<AdminResource> {
    return unwrap(api.patch(`/admin/resources/${resourceId}`, input));
  },

  async publish(resourceId: string, expectedStateVersion: number): Promise<AdminResource> {
    return unwrap(api.post(`/admin/resources/${resourceId}/publish`, { expectedStateVersion }));
  },

  async archive(resourceId: string, expectedStateVersion: number): Promise<AdminResource> {
    return unwrap(api.post(`/admin/resources/${resourceId}/archive`, { expectedStateVersion }));
  },

  /** W7C-12: the version travels as the required query parameter; DELETE has no body. */
  async remove(resourceId: string, expectedStateVersion: number): Promise<void> {
    await api.delete(`/admin/resources/${resourceId}${toQuery({ expectedStateVersion })}`);
  },
};
