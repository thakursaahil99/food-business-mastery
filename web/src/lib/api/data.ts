import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import type {
  ReminderPrefs,
  Assignment,
  BillingProfile,
  CertificateEntry,
  Doubt,
  Announcement,
  ClassSession,
  Course,
  Enrollment,
  PaymentSummary,
  ProgramModule,
  User,
} from "../types";
import { apiFetch, getToken, isMock } from "./client";
import * as mock from "./mock";
import * as mstore from "./mock-store";
import { verifyMockToken } from "../auth-config";
import { PROGRAM_COVER } from "../course-covers";
import type { Role } from "../types";


export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getToken();
  if (!token) return null;
  if (isMock) return verifyMockToken(token);
  try {
    return await apiFetch<User>("/me");
  } catch {
    return null;
  }
});

/** For portal pages: returns the user or bounces to /login. */
export async function requireUser(): Promise<User> {
  // Portal data is per-request (and the mock data is time-relative), so opt out of prerendering here.
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect((await getToken()) ? "/auth/clear" : "/login");
  return user;
}

export const ADMIN_ROLES: Role[] = ["super_admin", "admin", "coach"];

/** For admin pages: user must hold one of the given roles, else bounce. */
export async function requireRole(roles: Role[] = ADMIN_ROLES): Promise<User> {
  await connection();
  const user = await getCurrentUser();
  if (!user) redirect((await getToken()) ? "/auth/clear?to=/admin/login" : "/admin/login");
  if (!roles.includes(user.role)) redirect("/student");
  return user;
}

export const isAdminRole = (role: Role) => ADMIN_ROLES.includes(role);

export async function getEnrollment(): Promise<Enrollment> {
  await requireUser();
  if (isMock) return mock.mockEnrollment(new Date());
  const list = await apiFetch<Enrollment[]>("/my/enrollments");
  return list[0]!;
}

export async function getSchedule(range?: { from?: string; to?: string }): Promise<ClassSession[]> {
  await requireUser();
  if (isMock) return mstore.withSessionOverlays(mock.mockSessions(new Date()));
  const q = new URLSearchParams(Object.entries(range ?? {}).filter(([, v]) => v) as [string, string][]);
  return apiFetch<ClassSession[]>(`/my/schedule?${q}`);
}

export async function getSessionById(id: number): Promise<ClassSession | null> {
  await requireUser();
  if (isMock) return mstore.withSessionOverlays(mock.mockSessions(new Date())).find((s) => s.id === id) ?? null;
  try {
    return await apiFetch<ClassSession>(`/sessions/${id}`);
  } catch {
    return null;
  }
}

export async function getModules(): Promise<ProgramModule[]> {
  await requireUser();
  if (isMock) return mock.mockModules(new Date()).map((m) => ({ ...m, lessons: [...m.lessons, ...(mstore.store.lessonsAdded.get(m.id) ?? [])] }));
  const e = await getEnrollment();
  return apiFetch<ProgramModule[]>(`/programs/${e.program.slug}/modules`);
}

/** Everything the student can watch: their enrolled program first, then short self-paced courses. */
export async function getCourses(): Promise<Course[]> {
  const [enrollment, modules] = await Promise.all([getEnrollment(), getModules()]);
  const program: Course = {
    id: enrollment.program.id,
    slug: enrollment.program.slug,
    title: enrollment.program.title,
    tagline: "Your 16-week cohort program: weekly recordings unlock with the live classes.",
    kind: "program",
    level: "Advanced",
    cover: PROGRAM_COVER,
    coach: enrollment.batch.coach,
    modules,
  };
  // Admin edits to the program change its name, summary and photo only; its lessons stay the student's own.
  const programEdit = isMock ? mstore.store.courseOverrides.get(program.slug) : undefined;
  if (programEdit) Object.assign(program, { title: programEdit.title, tagline: programEdit.tagline, cover: programEdit.cover ?? program.cover });
  const shortCourses = mock.mockShortCourses()
    .map(mstore.withCourseEdits)
    .filter((c): c is Course => c !== null && c.status !== "draft");
  const all = isMock
    ? [program, ...shortCourses, ...mstore.publishedCourses(await getRequestTime())]
    : [program, ...(await apiFetch<Course[]>("/my/courses?kind=short"))];
  return all.map(withoutLockedMedia);
}

/** Never send a locked lesson's video/poster URL to the browser: it would be readable in the page data. */
function withoutLockedMedia(c: Course): Course {
  return {
    ...c,
    modules: c.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.locked ? { ...l, videoSrc: null, posterSrc: null } : l)) })),
  };
}

/** One lesson with its course and module, for the player. Null when it does not exist for this student. */
export async function getLesson(id: number) {
  const courses = await getCourses();
  for (const course of courses) {
    for (const mod of course.modules) {
      const lesson = mod.lessons.find((l) => l.id === id);
      if (lesson) return { course, module: mod, lesson };
    }
  }
  return null;
}

export async function getPayments(): Promise<PaymentSummary> {
  await requireUser();
  if (isMock) return mock.mockPayments(new Date());
  return apiFetch<PaymentSummary>("/my/payments");
}

export async function getAnnouncements(): Promise<Announcement[]> {
  await requireUser();
  if (isMock) return mock.mockAnnouncements(new Date());
  return apiFetch<Announcement[]>("/my/announcements");
}

/** Request time on the server, so client views can render time-relative state before hydration. */
export async function getRequestTime(): Promise<number> {
  await connection();
  return Date.now();
}

export async function getAssignments(): Promise<Assignment[]> {
  const user = await requireUser();
  if (isMock) return mstore.studentAssignments(user, new Date());
  return apiFetch<Assignment[]>("/my/assignments");
}

export async function getDoubts(): Promise<Doubt[]> {
  const user = await requireUser();
  if (isMock) return mstore.studentDoubts(user, new Date());
  return apiFetch<Doubt[]>("/my/doubts");
}

export async function getBillingProfile(): Promise<BillingProfile | null> {
  const user = await requireUser();
  if (isMock) return mstore.store.billing.get(user.id) ?? null;
  return apiFetch<BillingProfile | null>("/my/billing-profile");
}

export async function getReminderPrefs(): Promise<ReminderPrefs> {
  const user = await requireUser();
  if (isMock) return mstore.store.prefs.get(user.id) ?? mstore.DEFAULT_PREFS;
  return apiFetch<ReminderPrefs>("/my/reminder-prefs");
}

/** Certificates: the steps left on each course and the certificate once earned. */
export async function getCertificates(): Promise<CertificateEntry[]> {
  const user = await requireUser();
  if (!isMock) return apiFetch<CertificateEntry[]>("/my/certificates");

  // Mock: same rules as the Laravel CertificateService, from the demo enrollment.
  const [e, modules, assignments] = await Promise.all([getEnrollment(), getModules(), getAssignments()]);
  const lessons = modules.flatMap((m) => m.lessons);
  const lessonsDone = lessons.filter((l) => l.completed).length;
  const sent = assignments.filter((a) => a.submission).length;
  const steps: CertificateEntry["steps"] = [
    { key: "attendance", label: "Attend 75% or more of the classes", done: e.attendancePct >= 75, current: e.attendancePct, total: 100, unit: "%" },
    { key: "lessons", label: "Finish every lesson", done: lessons.length > 0 && lessonsDone >= lessons.length, current: lessonsDone, total: lessons.length, unit: null },
    { key: "homework", label: "Send all your homework", done: assignments.length > 0 && sent >= assignments.length, current: sent, total: assignments.length, unit: null },
    { key: "final", label: "Pass the final test", done: false, current: 0, total: 1, unit: null, hint: "The final test is in the last week." },
  ];
  const short = mock.mockShortCourses()[0]!;
  return [
    { course: { id: e.program.id, slug: e.program.slug, title: e.program.title, kind: "program", batchName: e.batch.name }, status: "in_progress", steps, stepsDone: steps.filter((x) => x.done).length, certificate: null },
    {
      course: { id: short.id, slug: short.slug, title: short.title, kind: "short", batchName: null },
      status: "earned",
      steps: [{ key: "lessons", label: "Finish every lesson", done: true, current: 5, total: 5, unit: null }],
      stepsDone: 1,
      certificate: { code: "RB-DEMO7K2Q", studentName: user.name, courseTitle: short.title, issuedAt: new Date(Date.now() - 3 * 86_400_000).toISOString(), url: null },
    },
  ];
}
