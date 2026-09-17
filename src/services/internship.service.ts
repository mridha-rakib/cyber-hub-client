import { api } from "@/services/api";
import type {
  AcceptApplicationResult,
  Internship,
  InternshipApplication,
  InternshipEnrollment,
  Submission,
  SubmissionWithVersions,
  Task,
  TaskAssignment,
} from "@/types/internship";

interface Envelope<T> {
  success: true;
  message: string;
  data: T;
  requestId: string;
}

export interface ListParams {
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
 * Typed wrappers around the backend's real Internship endpoints
 * (`api/src/modules/internship`). Every write that targets an existing
 * resource carries `expectedStateVersion` explicitly — callers must supply
 * the version they last read, never a guessed/incremented one.
 */
export const internshipService = {
  // --- Public catalogue -----------------------------------------------
  async listPublished(params: ListParams = {}): Promise<Internship[]> {
    return unwrap(api.get(`/internships${toQuery(params as Record<string, unknown>)}`));
  },

  async getPublished(internshipId: string): Promise<Internship> {
    return unwrap(api.get(`/internships/${internshipId}`));
  },

  // --- Learner: applications --------------------------------------------
  async createApplication(
    internshipId: string,
    applicationData: Record<string, unknown>,
  ): Promise<InternshipApplication> {
    return unwrap(api.post(`/internships/${internshipId}/applications`, { applicationData }));
  },

  async listOwnApplications(
    params: ListParams & { status?: string } = {},
  ): Promise<InternshipApplication[]> {
    return unwrap(
      api.get(`/me/internship-applications${toQuery(params as Record<string, unknown>)}`),
    );
  },

  async getOwnApplication(applicationId: string): Promise<InternshipApplication> {
    return unwrap(api.get(`/me/internship-applications/${applicationId}`));
  },

  // --- Learner: enrollments / tasks -------------------------------------
  async listOwnEnrollments(params: ListParams = {}): Promise<InternshipEnrollment[]> {
    return unwrap(
      api.get(`/me/internship-enrollments${toQuery(params as Record<string, unknown>)}`),
    );
  },

  async getOwnEnrollment(enrollmentId: string): Promise<InternshipEnrollment> {
    return unwrap(api.get(`/me/internship-enrollments/${enrollmentId}`));
  },

  async listOwnTaskAssignments(enrollmentId: string): Promise<TaskAssignment[]> {
    return unwrap(api.get(`/me/internship-enrollments/${enrollmentId}/task-assignments`));
  },

  // --- Learner: submissions ----------------------------------------------
  async createSubmission(assignmentId: string, evidenceText: string): Promise<Submission> {
    return unwrap(api.post(`/me/task-assignments/${assignmentId}/submission`, { evidenceText }));
  },

  async getOwnSubmission(submissionId: string): Promise<SubmissionWithVersions> {
    return unwrap(api.get(`/me/submissions/${submissionId}`));
  },

  async resubmit(
    submissionId: string,
    input: { expectedStateVersion: number; evidenceText: string },
  ): Promise<Submission> {
    return unwrap(api.post(`/me/submissions/${submissionId}/resubmit`, input));
  },

  // --- Mentor/Admin: review ------------------------------------------------
  async listReview(params: ListParams & { status?: string } = {}): Promise<Submission[]> {
    return unwrap(api.get(`/review/submissions${toQuery(params as Record<string, unknown>)}`));
  },

  async getReview(submissionId: string): Promise<Submission> {
    return unwrap(api.get(`/review/submissions/${submissionId}`));
  },

  async startReviewSubmission(
    submissionId: string,
    expectedStateVersion: number,
  ): Promise<Submission> {
    return unwrap(
      api.post(`/review/submissions/${submissionId}/start-review`, { expectedStateVersion }),
    );
  },

  async approveSubmission(
    submissionId: string,
    input: { expectedStateVersion: number; reviewNote?: string },
  ): Promise<Submission> {
    return unwrap(api.post(`/review/submissions/${submissionId}/approve`, input));
  },

  async requestRevision(
    submissionId: string,
    input: { expectedStateVersion: number; feedback: string },
  ): Promise<Submission> {
    return unwrap(api.post(`/review/submissions/${submissionId}/request-revision`, input));
  },

  async getCompletion(enrollmentId: string): Promise<InternshipEnrollment> {
    return unwrap(api.get(`/review/internship-enrollments/${enrollmentId}/completion`));
  },

  async evaluateCompletion(
    enrollmentId: string,
    evaluationNote?: string,
  ): Promise<InternshipEnrollment> {
    return unwrap(
      api.post(`/review/internship-enrollments/${enrollmentId}/evaluate-completion`, {
        evaluationNote,
      }),
    );
  },

  // --- Admin: programmes ---------------------------------------------------
  async listAdminInternships(
    params: ListParams & { status?: string; q?: string } = {},
  ): Promise<Internship[]> {
    return unwrap(api.get(`/admin/internships${toQuery(params as Record<string, unknown>)}`));
  },

  async getAdminInternship(internshipId: string): Promise<Internship> {
    return unwrap(api.get(`/admin/internships/${internshipId}`));
  },

  async createInternship(input: {
    title: string;
    description: string;
    requirements: Record<string, unknown>;
    duration: Record<string, unknown>;
    completionCriteria: unknown[];
  }): Promise<Internship> {
    return unwrap(api.post("/admin/internships", input));
  },

  async publishInternship(internshipId: string, expectedStateVersion: number): Promise<Internship> {
    return unwrap(api.post(`/admin/internships/${internshipId}/publish`, { expectedStateVersion }));
  },

  async closeInternship(internshipId: string, expectedStateVersion: number): Promise<Internship> {
    return unwrap(api.post(`/admin/internships/${internshipId}/close`, { expectedStateVersion }));
  },

  async archiveInternship(internshipId: string, expectedStateVersion: number): Promise<Internship> {
    return unwrap(api.post(`/admin/internships/${internshipId}/archive`, { expectedStateVersion }));
  },

  async returnInternshipToDraft(
    internshipId: string,
    expectedStateVersion: number,
  ): Promise<Internship> {
    return unwrap(
      api.post(`/admin/internships/${internshipId}/return-to-draft`, { expectedStateVersion }),
    );
  },

  // --- Admin: tasks ------------------------------------------------------
  async listTasks(internshipId: string): Promise<Task[]> {
    return unwrap(api.get(`/admin/internships/${internshipId}/tasks`));
  },

  async createTask(
    internshipId: string,
    input: {
      title: string;
      description: string;
      orderNo: number;
      requirements: Record<string, unknown>;
    },
  ): Promise<Task> {
    return unwrap(api.post(`/admin/internships/${internshipId}/tasks`, input));
  },

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/admin/tasks/${taskId}`);
  },

  // --- Admin: applications -------------------------------------------------
  async listAdminApplications(
    params: ListParams & { status?: string; internshipId?: string } = {},
  ): Promise<InternshipApplication[]> {
    return unwrap(
      api.get(`/admin/internship-applications${toQuery(params as Record<string, unknown>)}`),
    );
  },

  async getAdminApplication(applicationId: string): Promise<InternshipApplication> {
    return unwrap(api.get(`/admin/internship-applications/${applicationId}`));
  },

  async startReviewApplication(
    applicationId: string,
    expectedStateVersion: number,
  ): Promise<InternshipApplication> {
    return unwrap(
      api.post(`/admin/internship-applications/${applicationId}/start-review`, {
        expectedStateVersion,
      }),
    );
  },

  async acceptApplication(
    applicationId: string,
    expectedStateVersion: number,
  ): Promise<AcceptApplicationResult> {
    return unwrap(
      api.post(`/admin/internship-applications/${applicationId}/accept`, { expectedStateVersion }),
    );
  },

  async rejectApplication(
    applicationId: string,
    input: { expectedStateVersion: number; reason: string },
  ): Promise<InternshipApplication> {
    return unwrap(api.post(`/admin/internship-applications/${applicationId}/reject`, input));
  },

  // --- Admin: enrollments / task assignment gate ---------------------------
  async getAdminEnrollment(enrollmentId: string): Promise<InternshipEnrollment> {
    return unwrap(api.get(`/admin/internship-enrollments/${enrollmentId}`));
  },

  async assignTasks(enrollmentId: string, taskIds: string[]): Promise<TaskAssignment[]> {
    return unwrap(
      api.post(`/admin/internship-enrollments/${enrollmentId}/task-assignments`, { taskIds }),
    );
  },
};
