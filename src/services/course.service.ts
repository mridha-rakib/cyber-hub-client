import { env } from "@/config/env";
import { api } from "@/services/api";
import type { CursorPage } from "@/types/api";
import type {
  AdminCourse,
  CourseApprovalInput,
  CourseApprovalStatus,
  CourseCreateInput,
  CourseReasonInput,
  CourseUpdateInput,
  PublicCourse,
} from "@/types/course";

interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

export interface PublicCourseListParams {
  q?: string;
  provider?: string;
  category?: string;
  level?: string;
  cursor?: string;
  limit?: number;
}

export interface AdminCourseListParams {
  q?: string;
  provider?: string;
  category?: string;
  level?: string;
  /** ISO 8601 timestamp with offset: deals active at that instant (W7C-8). */
  activeAt?: string;
  approvalStatus?: CourseApprovalStatus;
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
 * The only provider destination the client ever links to (UI-DEC-027,
 * API-CRS-003): the backend redirects to the stored URL of an active,
 * approved deal. The stored external URL itself is never used for navigation.
 */
export function courseOutboundUrl(courseId: string): string {
  return `${env.apiUrl}/courses/${encodeURIComponent(courseId)}/outbound`;
}

/**
 * Typed wrappers around the accepted Wave 7C course endpoints
 * (API-CRS-001/002, API-ADMCRS-001..007). Every write to an existing record
 * carries the `expectedStateVersion` the screen last displayed (UI-DEC-030);
 * nothing here retries a mutation.
 */
export const courseService = {
  // --- Public discovery (API-CRS-001/002) ---------------------------------
  async listActive(params: PublicCourseListParams = {}): Promise<CursorPage<PublicCourse>> {
    return unwrapPage(api.get(`/courses${toQuery(params as Record<string, unknown>)}`));
  },

  async getApproved(courseId: string): Promise<PublicCourse> {
    return unwrap(api.get(`/courses/${courseId}`));
  },

  // --- Admin management (API-ADMCRS-001..007) -----------------------------
  async listAdmin(params: AdminCourseListParams = {}): Promise<CursorPage<AdminCourse>> {
    return unwrapPage(api.get(`/admin/courses${toQuery(params as Record<string, unknown>)}`));
  },

  async getAdmin(courseId: string): Promise<AdminCourse> {
    return unwrap(api.get(`/admin/courses/${courseId}`));
  },

  async create(input: CourseCreateInput): Promise<AdminCourse> {
    return unwrap(api.post("/admin/courses", input));
  },

  async update(courseId: string, input: CourseUpdateInput): Promise<AdminCourse> {
    return unwrap(api.patch(`/admin/courses/${courseId}`, input));
  },

  async approve(courseId: string, input: CourseApprovalInput): Promise<AdminCourse> {
    return unwrap(api.post(`/admin/courses/${courseId}/approve`, input));
  },

  /** Rejects a DRAFT deal or withdraws an APPROVED one (WF-CRS-04/05). */
  async reject(courseId: string, input: CourseReasonInput): Promise<AdminCourse> {
    return unwrap(api.post(`/admin/courses/${courseId}/reject`, input));
  },

  /** W7C-12: the version travels as the required query parameter; DELETE has no body. */
  async remove(courseId: string, expectedStateVersion: number): Promise<void> {
    await api.delete(`/admin/courses/${courseId}${toQuery({ expectedStateVersion })}`);
  },
};
