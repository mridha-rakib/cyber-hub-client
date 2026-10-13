import { api } from "@/services/api";
import type { CursorPage } from "@/types/api";
import type { ConsultingService } from "@/types/consulting";
import type {
  Assessment,
  AssessmentCommand,
  AssessmentStatus,
  Finding,
  FindingCommand,
  FindingCreateInput,
  FindingSeverity,
  FindingStatus,
  FindingUpdateInput,
} from "@/types/security-work";

interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

/** `employerId` is accepted for Admin only; the API rejects it for a Consultant. */
export interface AssessmentListParams {
  status?: AssessmentStatus;
  service?: ConsultingService;
  employerId?: string;
  cursor?: string;
  limit?: number;
}

export interface FindingListParams {
  severity?: FindingSeverity;
  status?: FindingStatus;
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
 * Typed wrappers around the real Wave 5B operational endpoints
 * (API-ASM-001..006, API-FND-001..007). Commands carry the
 * `expectedStateVersion` the caller last read — never a guessed or
 * incremented one. Server-derived values (employer, scope, service,
 * assignment, status, owner, resolvedAt) are never sent.
 */
export const securityWorkService = {
  // API-ASM-001 — the strict AssessmentCreateInput has no fields.
  createAssessment: (requestId: string) =>
    unwrap<Assessment>(api.post(`/consulting/requests/${requestId}/assessments`, {})),
  // API-ASM-002
  listAssessments: (params: AssessmentListParams = {}) =>
    unwrapPage<Assessment>(api.get(`/assessments${toQuery(params)}`)),
  // API-ASM-003
  getAssessment: (assessmentId: string) =>
    unwrap<Assessment>(api.get(`/assessments/${assessmentId}`)),
  // API-ASM-004 / 005
  assessmentCommand: (
    assessmentId: string,
    command: AssessmentCommand,
    expectedStateVersion: number,
  ) =>
    unwrap<Assessment>(
      api.post(`/assessments/${assessmentId}/${command}`, { expectedStateVersion }),
    ),
  // API-ASM-006 (Admin)
  cancelAssessment: (assessmentId: string, expectedStateVersion: number, reason: string) =>
    unwrap<Assessment>(
      api.post(`/admin/assessments/${assessmentId}/cancel`, { expectedStateVersion, reason }),
    ),
  // API-FND-001
  createFinding: (assessmentId: string, input: FindingCreateInput) =>
    unwrap<Finding>(api.post(`/assessments/${assessmentId}/findings`, input)),
  // API-FND-002
  listFindings: (assessmentId: string, params: FindingListParams = {}) =>
    unwrapPage<Finding>(api.get(`/assessments/${assessmentId}/findings${toQuery(params)}`)),
  // API-FND-003
  getFinding: (findingId: string) => unwrap<Finding>(api.get(`/findings/${findingId}`)),
  // API-FND-004
  updateFinding: (findingId: string, input: FindingUpdateInput) =>
    unwrap<Finding>(api.patch(`/findings/${findingId}`, input)),
  // API-FND-005
  findingCommand: (findingId: string, command: FindingCommand, expectedStateVersion: number) =>
    unwrap<Finding>(api.post(`/findings/${findingId}/${command}`, { expectedStateVersion })),
  // API-FND-006
  resolveFinding: (findingId: string, expectedStateVersion: number, verificationNote: string) =>
    unwrap<Finding>(
      api.post(`/findings/${findingId}/resolve`, { expectedStateVersion, verificationNote }),
    ),
  // API-FND-007
  reopenFinding: (findingId: string, expectedStateVersion: number, reason: string) =>
    unwrap<Finding>(api.post(`/findings/${findingId}/reopen`, { expectedStateVersion, reason })),
};
