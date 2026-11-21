import "server-only";
import type { Coach, Course, BusinessAnalytics, LearningAnalytics, StudentProfile, AdminOverview, AssignmentAdmin, BatchSummary, ClassSession, Doubt, Lead, PaymentRow, ProgramModule, StudentRow } from "../types";
import { apiFetch, isMock } from "./client";
import { requireRole } from "./data";
import * as mock from "./mock-admin";
import { mockCoaches, mockModules, mockSessions, mockShortCourses } from "./mock";
import * as mstore from "./mock-store";
import * as analytics from "./mock-analytics";
import { PROGRAM_COVER } from "../course-covers";

/** Admin console data. Every call re-checks the role server-side. */

export async function getOverview(): Promise<AdminOverview> {
  await requireRole();
  return isMock ? mock.mockOverview(new Date()) : apiFetch<AdminOverview>("/admin/overview");
}

export async function getLeads(): Promise<Lead[]> {
  await requireRole();
  return isMock ? mstore.applyOverlay(mock.mockLeads(new Date()), mstore.store.leads).map((l) => ({ ...l, status: mstore.store.leadStatus.get(l.id) ?? l.status })) : apiFetch<Lead[]>("/admin/leads");
}

export async function getStudents(): Promise<StudentRow[]> {
  await requireRole();
  return isMock ? mstore.applyOverlay(mock.mockStudents(new Date()), mstore.store.students) : apiFetch<StudentRow[]>("/admin/students");
}

export async function getAdminPayments(): Promise<PaymentRow[]> {
  await requireRole();
  return isMock ? mstore.applyOverlay(mock.mockAdminPayments(new Date()), mstore.store.payments) : apiFetch<PaymentRow[]>("/admin/payments");
}

export async function getBatches(): Promise<BatchSummary[]> {
  await requireRole();
  return isMock ? mstore.applyOverlay(mock.mockBatches(new Date()), mstore.store.batches) : apiFetch<BatchSummary[]>("/admin/batches");
}

export async function getAdminSessions(): Promise<ClassSession[]> {
  await requireRole();
  return isMock ? mstore.withSessionOverlays(mockSessions(new Date())) : apiFetch<ClassSession[]>("/admin/sessions");
}

export async function getAdminAssignments(): Promise<AssignmentAdmin[]> {
  await requireRole();
  return isMock ? mstore.adminAssignments(new Date()) : apiFetch<AssignmentAdmin[]>("/admin/assignments");
}

export async function getAllDoubts(): Promise<Doubt[]> {
  await requireRole();
  return isMock ? mstore.allDoubts(new Date()) : apiFetch<Doubt[]>("/admin/doubts");
}

export async function getCourseModules(): Promise<ProgramModule[]> {
  await requireRole();
  if (!isMock) return apiFetch<ProgramModule[]>("/admin/programs/cgr-mastery/modules");
  return mockModules(new Date()).map((m) => ({ ...m, lessons: [...m.lessons, ...(mstore.store.lessonsAdded.get(m.id) ?? [])] }));
}

export async function getBusinessAnalytics(): Promise<BusinessAnalytics> {
  await requireRole(["super_admin", "admin"]);
  return isMock ? analytics.businessAnalytics(new Date()) : apiFetch<BusinessAnalytics>("/admin/analytics/business");
}

export async function getLearningAnalytics(): Promise<LearningAnalytics> {
  await requireRole();
  return isMock ? analytics.learningAnalytics(new Date()) : apiFetch<LearningAnalytics>("/admin/analytics/learning");
}

export async function getStudentProfile(id: number): Promise<StudentProfile | null> {
  await requireRole();
  if (isMock) return analytics.studentProfile(id, new Date());
  try {
    return await apiFetch<StudentProfile>(`/admin/students/${id}`);
  } catch {
    return null;
  }
}

/* ───────── Courses ───────── */

/** Every course in the catalogue for the admin list: admin-created (newest first), then the built-in ones. */
export async function getAdminCourses(): Promise<Course[]> {
  await requireRole();
  if (!isMock) return apiFetch<Course[]>("/admin/courses");
  const program: Course = {
    id: 1,
    slug: "cgr-mastery",
    title: "CGR Mastery Program",
    tagline: "The 16-week cohort program. Weekly recordings unlock with the live classes.",
    kind: "program",
    level: "Advanced",
    cover: PROGRAM_COVER,
    coach: mockCoaches()[0]!,
    modules: await getCourseModules(),
    status: "published",
  };
  const builtIn = mockShortCourses().map((c) => ({ ...c, status: "published" as const }));
  // built-ins carry any admin edits; removed ones drop out
  const edited = [program, ...builtIn].map(mstore.withCourseEdits).filter((c): c is Course => c !== null);
  return [...mstore.store.createdCourses, ...edited];
}

export async function getCoaches(): Promise<Coach[]> {
  await requireRole();
  return isMock ? mockCoaches() : apiFetch<Coach[]>("/admin/coaches");
}

/** One course for the edit page. `fullEdit` is false for built-in courses (details and photo only). */
export async function getAdminCourse(slug: string): Promise<{ course: Course; fullEdit: boolean } | null> {
  await requireRole(["super_admin", "admin"]);
  if (!isMock) {
    try {
      const course = await apiFetch<Course & { builtIn?: boolean }>(`/admin/courses/${encodeURIComponent(slug)}`);
      return { course, fullEdit: !course.builtIn };
    } catch {
      return null;
    }
  }
  const course = (await getAdminCourses()).find((c) => c.slug === slug);
  if (!course) return null;
  return { course, fullEdit: mstore.store.createdCourses.some((c) => c.slug === slug) };
}
