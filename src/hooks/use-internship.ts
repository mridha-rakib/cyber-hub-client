"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { internshipService, type ListParams } from "@/services/internship.service";

export const internshipKeys = {
  all: ["internships"] as const,
  publishedList: (params: ListParams) =>
    [...internshipKeys.all, "published", "list", params] as const,
  published: (id: string) => [...internshipKeys.all, "published", "detail", id] as const,
  adminList: (params: ListParams & { status?: string; q?: string }) =>
    [...internshipKeys.all, "admin", "list", params] as const,
  admin: (id: string) => [...internshipKeys.all, "admin", "detail", id] as const,
  tasks: (internshipId: string) => [...internshipKeys.all, "tasks", internshipId] as const,
};

export const applicationKeys = {
  all: ["internship-applications"] as const,
  ownList: (params: ListParams & { status?: string }) =>
    [...applicationKeys.all, "own", "list", params] as const,
  own: (id: string) => [...applicationKeys.all, "own", "detail", id] as const,
  adminList: (params: ListParams & { status?: string; internshipId?: string }) =>
    [...applicationKeys.all, "admin", "list", params] as const,
  admin: (id: string) => [...applicationKeys.all, "admin", "detail", id] as const,
};

export const enrollmentKeys = {
  all: ["internship-enrollments"] as const,
  ownList: (params: ListParams) => [...enrollmentKeys.all, "own", "list", params] as const,
  own: (id: string) => [...enrollmentKeys.all, "own", "detail", id] as const,
  ownTaskAssignments: (id: string) =>
    [...enrollmentKeys.all, "own", "task-assignments", id] as const,
  admin: (id: string) => [...enrollmentKeys.all, "admin", "detail", id] as const,
  completion: (id: string) => [...enrollmentKeys.all, "completion", id] as const,
};

export const submissionKeys = {
  all: ["submissions"] as const,
  own: (id: string) => [...submissionKeys.all, "own", "detail", id] as const,
  reviewList: (params: ListParams & { status?: string }) =>
    [...submissionKeys.all, "review", "list", params] as const,
  review: (id: string) => [...submissionKeys.all, "review", "detail", id] as const,
};

// --- Public catalogue ------------------------------------------------------

export function usePublishedInternships(params: ListParams = {}) {
  return useQuery({
    queryKey: internshipKeys.publishedList(params),
    queryFn: () => internshipService.listPublished(params),
  });
}

export function usePublishedInternship(internshipId: string) {
  return useQuery({
    queryKey: internshipKeys.published(internshipId),
    queryFn: () => internshipService.getPublished(internshipId),
    enabled: Boolean(internshipId),
  });
}

// --- Learner: applications ---------------------------------------------------

export function useCreateApplication(internshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (applicationData: Record<string, unknown>) =>
      internshipService.createApplication(internshipId, applicationData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useOwnApplications(params: ListParams & { status?: string } = {}) {
  return useQuery({
    queryKey: applicationKeys.ownList(params),
    queryFn: () => internshipService.listOwnApplications(params),
  });
}

export function useOwnApplication(applicationId: string) {
  return useQuery({
    queryKey: applicationKeys.own(applicationId),
    queryFn: () => internshipService.getOwnApplication(applicationId),
    enabled: Boolean(applicationId),
  });
}

// --- Learner: enrollments / tasks -------------------------------------------

export function useOwnEnrollments(params: ListParams = {}) {
  return useQuery({
    queryKey: enrollmentKeys.ownList(params),
    queryFn: () => internshipService.listOwnEnrollments(params),
  });
}

export function useOwnEnrollment(enrollmentId: string) {
  return useQuery({
    queryKey: enrollmentKeys.own(enrollmentId),
    queryFn: () => internshipService.getOwnEnrollment(enrollmentId),
    enabled: Boolean(enrollmentId),
  });
}

export function useOwnTaskAssignments(enrollmentId: string) {
  return useQuery({
    queryKey: enrollmentKeys.ownTaskAssignments(enrollmentId),
    queryFn: () => internshipService.listOwnTaskAssignments(enrollmentId),
    enabled: Boolean(enrollmentId),
  });
}

// --- Learner: submissions -----------------------------------------------------

export function useCreateSubmission(assignmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (evidenceText: string) =>
      internshipService.createSubmission(assignmentId, evidenceText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
}

export function useOwnSubmission(submissionId: string) {
  return useQuery({
    queryKey: submissionKeys.own(submissionId),
    queryFn: () => internshipService.getOwnSubmission(submissionId),
    enabled: Boolean(submissionId),
  });
}

export function useResubmit(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { expectedStateVersion: number; evidenceText: string }) =>
      internshipService.resubmit(submissionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.own(submissionId) });
    },
  });
}

// --- Mentor/Admin: review ------------------------------------------------------

export function useReviewQueue(params: ListParams & { status?: string } = {}) {
  return useQuery({
    queryKey: submissionKeys.reviewList(params),
    queryFn: () => internshipService.listReview(params),
  });
}

export function useReviewSubmission(submissionId: string) {
  return useQuery({
    queryKey: submissionKeys.review(submissionId),
    queryFn: () => internshipService.getReview(submissionId),
    enabled: Boolean(submissionId),
  });
}

export function useStartReviewSubmission(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      internshipService.startReviewSubmission(submissionId, expectedStateVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}

export function useApproveSubmission(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { expectedStateVersion: number; reviewNote?: string }) =>
      internshipService.approveSubmission(submissionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}

export function useRequestRevision(submissionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { expectedStateVersion: number; feedback: string }) =>
      internshipService.requestRevision(submissionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
    },
  });
}

export function useCompletion(enrollmentId: string) {
  return useQuery({
    queryKey: enrollmentKeys.completion(enrollmentId),
    queryFn: () => internshipService.getCompletion(enrollmentId),
    enabled: Boolean(enrollmentId),
  });
}

export function useEvaluateCompletion(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (evaluationNote?: string) =>
      internshipService.evaluateCompletion(enrollmentId, evaluationNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.completion(enrollmentId) });
    },
  });
}

// --- Admin: programmes -----------------------------------------------------

export function useAdminInternships(params: ListParams & { status?: string; q?: string } = {}) {
  return useQuery({
    queryKey: internshipKeys.adminList(params),
    queryFn: () => internshipService.listAdminInternships(params),
  });
}

export function useAdminInternship(internshipId: string) {
  return useQuery({
    queryKey: internshipKeys.admin(internshipId),
    queryFn: () => internshipService.getAdminInternship(internshipId),
    enabled: Boolean(internshipId),
  });
}

export function useCreateInternship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: internshipService.createInternship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internshipKeys.all });
    },
  });
}

function useInternshipTransition(
  internshipId: string,
  fn: (id: string, version: number) => Promise<unknown>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) => fn(internshipId, expectedStateVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internshipKeys.all });
    },
  });
}

export function usePublishInternship(internshipId: string) {
  return useInternshipTransition(internshipId, internshipService.publishInternship);
}

export function useCloseInternship(internshipId: string) {
  return useInternshipTransition(internshipId, internshipService.closeInternship);
}

export function useArchiveInternship(internshipId: string) {
  return useInternshipTransition(internshipId, internshipService.archiveInternship);
}

export function useReturnInternshipToDraft(internshipId: string) {
  return useInternshipTransition(internshipId, internshipService.returnInternshipToDraft);
}

// --- Admin: tasks ------------------------------------------------------------

export function useInternshipTasks(internshipId: string) {
  return useQuery({
    queryKey: internshipKeys.tasks(internshipId),
    queryFn: () => internshipService.listTasks(internshipId),
    enabled: Boolean(internshipId),
  });
}

export function useCreateTask(internshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      description: string;
      orderNo: number;
      requirements: Record<string, unknown>;
    }) => internshipService.createTask(internshipId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internshipKeys.tasks(internshipId) });
    },
  });
}

export function useDeleteTask(internshipId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => internshipService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: internshipKeys.tasks(internshipId) });
    },
  });
}

// --- Admin: applications ---------------------------------------------------

export function useAdminApplications(
  params: ListParams & { status?: string; internshipId?: string } = {},
) {
  return useQuery({
    queryKey: applicationKeys.adminList(params),
    queryFn: () => internshipService.listAdminApplications(params),
  });
}

export function useAdminApplication(applicationId: string) {
  return useQuery({
    queryKey: applicationKeys.admin(applicationId),
    queryFn: () => internshipService.getAdminApplication(applicationId),
    enabled: Boolean(applicationId),
  });
}

export function useStartReviewApplication(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      internshipService.startReviewApplication(applicationId, expectedStateVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

export function useAcceptApplication(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (expectedStateVersion: number) =>
      internshipService.acceptApplication(applicationId, expectedStateVersion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.all });
    },
  });
}

export function useRejectApplication(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { expectedStateVersion: number; reason: string }) =>
      internshipService.rejectApplication(applicationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.all });
    },
  });
}

// --- Admin: enrollments / task assignment ------------------------------------

export function useAdminEnrollment(enrollmentId: string) {
  return useQuery({
    queryKey: enrollmentKeys.admin(enrollmentId),
    queryFn: () => internshipService.getAdminEnrollment(enrollmentId),
    enabled: Boolean(enrollmentId),
  });
}

export function useAssignTasks(enrollmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskIds: string[]) => internshipService.assignTasks(enrollmentId, taskIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.admin(enrollmentId) });
    },
  });
}
