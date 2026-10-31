"use client";

import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import {
  type AdminCourseListParams,
  courseService,
  type PublicCourseListParams,
} from "@/services/course.service";
import type {
  AdminCourse,
  CourseApprovalInput,
  CourseCreateInput,
  CourseReasonInput,
  CourseUpdateInput,
} from "@/types/course";

/**
 * Public and Admin projections of the same `courses` row expose different
 * fields (the Admin one carries notes, reasons and the stored URL), so each
 * gets its own key namespace and can never be served from the other's cache.
 */
export const courseKeys = {
  all: ["courses"] as const,
  activeLists: () => [...courseKeys.all, "active", "list"] as const,
  approved: (id: string) => [...courseKeys.all, "approved", "detail", id] as const,
  adminLists: () => [...courseKeys.all, "admin", "list"] as const,
  admin: (id: string) => [...courseKeys.all, "admin", "detail", id] as const,
};

// --- Public discovery --------------------------------------------------

export function useActiveCourses(params: PublicCourseListParams = {}) {
  return useCursorPagination(courseKeys.activeLists(), params, (pageParams) =>
    courseService.listActive(pageParams),
  );
}

export function useApprovedCourse(courseId: string) {
  return useQuery({
    queryKey: courseKeys.approved(courseId),
    queryFn: () => courseService.getApproved(courseId),
    enabled: Boolean(courseId),
    retry: false,
  });
}

// --- Admin management ----------------------------------------------------

export function useAdminCourses(params: AdminCourseListParams = {}) {
  return useCursorPagination(courseKeys.adminLists(), params, (pageParams) =>
    courseService.listAdmin(pageParams),
  );
}

export function useAdminCourse(courseId: string) {
  return useQuery({
    queryKey: courseKeys.admin(courseId),
    queryFn: () => courseService.getAdmin(courseId),
    enabled: Boolean(courseId),
    retry: false,
  });
}

/** Adopts the returned record (new stateVersion) and refreshes every list. */
async function adoptCourse(queryClient: QueryClient, record: AdminCourse) {
  queryClient.setQueryData(courseKeys.admin(record.id), record);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: courseKeys.adminLists() }),
    queryClient.invalidateQueries({ queryKey: courseKeys.activeLists() }),
    queryClient.invalidateQueries({ queryKey: courseKeys.approved(record.id) }),
  ]);
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (input: CourseCreateInput) => courseService.create(input),
    onSuccess: (record) => adoptCourse(queryClient, record),
  });
}

export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (input: CourseUpdateInput) => courseService.update(courseId, input),
    onSuccess: (record) => adoptCourse(queryClient, record),
  });
}

export function useApproveCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (input: CourseApprovalInput) => courseService.approve(courseId, input),
    onSuccess: (record) => adoptCourse(queryClient, record),
  });
}

export function useRejectCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (input: CourseReasonInput) => courseService.reject(courseId, input),
    onSuccess: (record) => adoptCourse(queryClient, record),
  });
}

export function useDeleteCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { inlineErrors: true },
    mutationFn: (expectedStateVersion: number) =>
      courseService.remove(courseId, expectedStateVersion),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: courseKeys.admin(courseId) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.adminLists() }),
        queryClient.invalidateQueries({ queryKey: courseKeys.activeLists() }),
      ]);
    },
  });
}
