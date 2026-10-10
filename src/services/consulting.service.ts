import { api } from "@/services/api";
import type { CursorPage } from "@/types/api";
import type {
  ConsultingNote,
  ConsultingRequestClient,
  ConsultingRequestDetail,
  ConsultingRequestInput,
  ConsultingRequestOperational,
  ConsultingStatus,
  ConsultingTransitionAction,
  ScopeAuthorization,
  ScopeAuthorizationInput,
} from "@/types/consulting";

interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

export interface BusinessConsultingListParams {
  status?: ConsultingStatus;
  cursor?: string;
  limit?: number;
}

/** `employerId` is accepted for Admin only; the API rejects it for a Consultant. */
export interface OperationalConsultingListParams extends BusinessConsultingListParams {
  employerId?: string;
}

export interface ConsultingNotesListParams {
  cursor?: string;
  limit?: number;
}

async function unwrap<T>(promise: Promise<{ data: Envelope<T> }>): Promise<T> {
  const response = await promise;
  return response.data.data;
}

/**
 * The response interceptor hoists pagination `meta` beside `data`
 * (`{ success, data: T[], meta, requestId }`), so a cursor page is rebuilt
 * from both fields rather than read from `data` alone.
 */
async function unwrapPage<T>(
  promise: Promise<{ data: Envelope<T[]> & { meta: CursorPage<T>["meta"] } }>,
): Promise<CursorPage<T>> {
  const response = await promise;
  return { data: response.data.data, meta: response.data.meta };
}

function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Typed wrappers around the real Wave 4B Consulting endpoints
 * (API-CON-001..015). Workflow commands carry the `expectedStateVersion`
 * the caller last read — never a guessed or incremented one.
 */
export const consultingService = {
  // API-CON-001
  create: (input: ConsultingRequestInput) =>
    unwrap<ConsultingRequestClient>(api.post("/business/consulting-requests", input)),
  // API-CON-002
  listOwn: (params: BusinessConsultingListParams = {}) =>
    unwrapPage<ConsultingRequestClient>(api.get(`/business/consulting-requests${toQuery(params)}`)),
  // API-CON-003
  getOwn: (requestId: string) =>
    unwrap<ConsultingRequestClient>(api.get(`/business/consulting-requests/${requestId}`)),
  // API-CON-004
  createScope: (requestId: string, input: ScopeAuthorizationInput) =>
    unwrap<ScopeAuthorization>(
      api.post(`/business/consulting-requests/${requestId}/scope-authorizations`, input),
    ),
  // API-CON-005
  getCurrentScope: (requestId: string) =>
    unwrap<ScopeAuthorization>(
      api.get(`/business/consulting-requests/${requestId}/scope-authorizations/current`),
    ),
  // API-CON-006
  listOperational: (params: OperationalConsultingListParams = {}) =>
    unwrapPage<ConsultingRequestOperational>(api.get(`/consulting/requests${toQuery(params)}`)),
  // API-CON-007
  getOperational: (requestId: string) =>
    unwrap<ConsultingRequestDetail>(api.get(`/consulting/requests/${requestId}`)),
  // API-CON-008
  assign: (requestId: string, consultantUserId: string) =>
    unwrap<ConsultingRequestOperational>(
      api.post(`/admin/consulting-requests/${requestId}/assign-consultant`, { consultantUserId }),
    ),
  // API-CON-009 / 010 / 012 / 013
  transition: (
    requestId: string,
    action: ConsultingTransitionAction,
    expectedStateVersion: number,
  ) =>
    unwrap<ConsultingRequestOperational>(
      api.post(`/consulting/requests/${requestId}/${action}`, { expectedStateVersion }),
    ),
  // API-CON-011
  decline: (requestId: string, expectedStateVersion: number, reason: string) =>
    unwrap<ConsultingRequestOperational>(
      api.post(`/consulting/requests/${requestId}/decline`, { expectedStateVersion, reason }),
    ),
  // API-CON-014
  listNotes: (requestId: string, params: ConsultingNotesListParams = {}) =>
    unwrapPage<ConsultingNote>(
      api.get(`/consulting/requests/${requestId}/notes${toQuery(params)}`),
    ),
  // API-CON-015
  createNote: (requestId: string, body: string) =>
    unwrap<ConsultingNote>(api.post(`/consulting/requests/${requestId}/notes`, { body })),
};
