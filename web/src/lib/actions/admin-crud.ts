"use server";

/**
 * Admin create / edit / delete for every console section.
 * Mock mode writes to the in-memory store (lib/api/mock-store.ts); with API_URL set, each call goes to
 * Laravel: POST /admin/{things}, PATCH /admin/{things}/{id}, DELETE /admin/{things}/{id}.
 * Every action re-checks the role on the server and validates with zod (the forms check the same rules).
 */

import { z } from "zod";
import { apiFetch, isMock } from "../api/client";
import { requireRole } from "../api/data";
import { getAdminCourses, getBatches, getStudents } from "../api/data-admin";
import { DEMO_VIDEOS, mockCoaches } from "../api/mock";
import { nextId, store } from "../api/mock-store";
import { isSafeCover } from "../course-covers";
import type { ActionResult, BatchSummary, ClassSession, Course, CourseDraft, Lead, Lesson, PaymentRow, StudentRow } from "../types";

const STAFF = ["super_admin", "admin"] as const;
const TEACHING = ["super_admin", "admin", "coach"] as const;
const DAY = 86_400_000;

const first = (e: z.ZodError) => e.issues[0]?.message ?? "Please check the form.";
async function remote<T>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown, fail = "Couldn't save. Please try again."): Promise<ActionResult<T>> {
  try {
    const data = await apiFetch<T>(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
    return { ok: true, data } as ActionResult<T>;
  } catch {
    return { ok: false, error: fail };
  }
}

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .refine((v) => /^\+?\d{10,13}$/.test(v), "Enter a valid phone number (10 digits).");
const isoDate = z.iso.datetime({ message: "Pick a valid date." });

/* ───────── Leads ───────── */

const leadSchema = z.object({
  name: z.string().trim().min(2, "Enter the lead's name.").max(80),
  email: z.email("Enter a valid email."),
  phone,
  city: z.string().trim().max(60),
  businessGoals: z.string().trim().max(1000),
  source: z.string().trim().min(2, "Pick a source.").max(40),
  status: z.enum(["new", "contacted", "approved", "rejected"]),
  assignedTo: z.string().trim().max(80).nullable(),
});
export type LeadInput = z.input<typeof leadSchema>;

export async function saveLead(id: number | null, input: LeadInput): Promise<ActionResult<Lead>> {
  await requireRole([...STAFF]);
  const p = leadSchema.safeParse(input);
  if (!p.success) return { ok: false, error: first(p.error) };
  const d = { ...p.data, assignedTo: p.data.assignedTo || null };
  if (!isMock) return id ? remote(`/admin/leads/${id}`, "PATCH", d) : remote("/admin/leads", "POST", d);
  if (id) {
    store.leads.patches.set(id, { ...store.leads.patches.get(id), ...d });
    store.leadStatus.delete(id); // the patch now owns the status
    return { ok: true, data: { id, createdAt: new Date().toISOString(), ...d } };
  }
  const lead: Lead = { id: nextId(), createdAt: new Date().toISOString(), ...d };
  store.leads.created.unshift(lead);
  return { ok: true, data: lead };
}

export async function deleteLead(id: number): Promise<ActionResult> {
  await requireRole([...STAFF]);
  if (!isMock) return remote(`/admin/leads/${id}`, "DELETE", undefined, "Couldn't delete the lead.");
  store.leads.deleted.add(id);
  return { ok: true };
}

/* ───────── Students ───────── */

const studentSchema = z.object({
  name: z.string().trim().min(2, "Enter the student's name.").max(80),
  email: z.email("Enter a valid email."),
  phone,
  batchName: z.string().trim().min(2, "Pick a batch."),
  status: z.enum(["pending", "active", "completed", "cancelled"]),
  total: z.number().int().min(0, "Fee can't be negative.").max(10_000_000),
});
export type StudentInput = z.input<typeof studentSchema>;

export async function saveStudent(id: number | null, input: StudentInput): Promise<ActionResult<StudentRow>> {
  await requireRole([...STAFF]);
  const p = studentSchema.safeParse(input);
  if (!p.success) return { ok: false, error: first(p.error) };
  const d = p.data;
  if (!isMock) return id ? remote(`/admin/students/${id}`, "PATCH", d) : remote("/admin/students", "POST", d);
  if (id) {
    const current = (await getStudents()).find((s) => s.id === id);
    if (!current) return { ok: false, error: "Student not found." };
    store.students.patches.set(id, { ...store.students.patches.get(id), ...d });
    return { ok: true, data: { ...current, ...d } };
  }
  const row: StudentRow = { id: nextId(), ...d, progressPct: 0, attendancePct: 0, paid: 0, nextDue: null, joinedAt: new Date().toISOString() };
  store.students.created.unshift(row);
  return { ok: true, data: row };
}

export async function deleteStudent(id: number): Promise<ActionResult> {
  await requireRole([...STAFF]);
  if (!isMock) return remote(`/admin/students/${id}`, "DELETE", undefined, "Couldn't remove the student.");
  store.students.deleted.add(id);
  return { ok: true };
}

/* ───────── Batches ───────── */

const batchSchema = z
  .object({
    name: z.string().trim().min(3, "Give the batch a name.").max(80),
    programTitle: z.string().trim().min(3).max(120),
    startDate: isoDate,
    endDate: isoDate,
    seats: z.number().int().min(1, "At least 1 seat.").max(1000),
    coachName: z.string().trim().min(2, "Pick a coach."),
    price: z.number().int().min(0, "Fee can't be negative.").max(10_000_000),
    status: z.enum(["upcoming", "running", "completed"]),
  })
  .refine((b) => +new Date(b.endDate) > +new Date(b.startDate), { message: "The end date must be after the start date.", path: ["endDate"] });
export type BatchInput = z.input<typeof batchSchema>;

export async function saveBatch(id: number | null, input: BatchInput): Promise<ActionResult<BatchSummary>> {
  await requireRole([...STAFF]);
  const p = batchSchema.safeParse(input);
  if (!p.success) return { ok: false, error: first(p.error) };
  const d = p.data;
  if (!isMock) return id ? remote(`/admin/batches/${id}`, "PATCH", d) : remote("/admin/batches", "POST", d);
  if (id) {
    const current = (await getBatches()).find((b) => b.id === id);
    if (!current) return { ok: false, error: "Batch not found." };
    if (d.seats < current.seatsTaken) return { ok: false, error: `This batch already has ${current.seatsTaken} students. Seats can't be fewer.` };
    store.batches.patches.set(id, { ...store.batches.patches.get(id), ...d });
    return { ok: true, data: { ...current, ...d } };
  }
  const row: BatchSummary = { id: nextId(), ...d, seatsTaken: 0, currentWeek: 0, attendancePct: 0 };
  store.batches.created.unshift(row);
  return { ok: true, data: row };
}

export async function deleteBatch(id: number): Promise<ActionResult> {
  await requireRole([...STAFF]);
  if (!isMock) return remote(`/admin/batches/${id}`, "DELETE", undefined, "Couldn't delete the batch.");
  const b = (await getBatches()).find((x) => x.id === id);
  if (b && b.seatsTaken > 0) return { ok: false, error: `${b.name} has ${b.seatsTaken} students. Move or remove them first.` };
  store.batches.deleted.add(id);
  return { ok: true };
}

/* ───────── Payments ───────── */

const paymentSchema = z.object({
  studentName: z.string().trim().min(2, "Pick a student."),
  batchName: z.string().trim().min(2, "Pick a batch."),
  amount: z.number().int().min(1, "Enter the amount.").max(10_000_000),
  method: z.enum(["UPI", "Card", "Netbanking", "EMI"]),
  status: z.enum(["captured", "pending", "failed", "refunded"]),
  paidAt: isoDate,
});
export type PaymentInput = z.input<typeof paymentSchema>;

export async function savePayment(id: number | null, input: PaymentInput): Promise<ActionResult<PaymentRow>> {
  await requireRole([...STAFF]);
  const p = paymentSchema.safeParse(input);
  if (!p.success) return { ok: false, error: first(p.error) };
  const d = { ...p.data, gst: Math.round(p.data.amount * 0.18) };
  if (!isMock) return id ? remote(`/admin/payments/${id}`, "PATCH", d) : remote("/admin/payments", "POST", d);
  if (id) {
    store.payments.patches.set(id, { ...store.payments.patches.get(id), ...d });
    return { ok: true, data: { id, invoiceNo: null, razorpayPaymentId: null, ...d } };
  }
  const n = nextId();
  const row: PaymentRow = { id: n, ...d, invoiceNo: d.status === "captured" ? `RB/26-27/${String(n).slice(-4)}` : null, razorpayPaymentId: null };
  store.payments.created.unshift(row);
  return { ok: true, data: row };
}

export async function deletePayment(id: number): Promise<ActionResult> {
  await requireRole(["super_admin"]);
  if (!isMock) return remote(`/admin/payments/${id}`, "DELETE", undefined, "Couldn't delete the payment.");
  store.payments.deleted.add(id);
  return { ok: true };
}

/* ───────── Classes (sessions) ───────── */

const sessionEditSchema = z.object({
  title: z.string().trim().min(3, "Give the session a title.").max(160),
  type: z.enum(["live", "webinar", "mentorship"]),
  startsAt: isoDate,
  durationMin: z.number().int().min(15, "Duration must be 15–480 minutes.").max(480, "Duration must be 15–480 minutes."),
});
export type SessionEditInput = z.input<typeof sessionEditSchema>;

export async function updateSession(id: number, input: SessionEditInput): Promise<ActionResult<Partial<ClassSession>>> {
  await requireRole([...TEACHING]);
  const p = sessionEditSchema.safeParse(input);
  if (!p.success) return { ok: false, error: first(p.error) };
  const d = p.data;
  const patch: Partial<ClassSession> = { title: d.title, type: d.type, startsAt: d.startsAt, endsAt: new Date(+new Date(d.startsAt) + d.durationMin * 60_000).toISOString() };
  if (!isMock) {
    const r = await remote(`/admin/sessions/${id}`, "PATCH", { title: d.title, type: d.type, starts_at: d.startsAt, duration_min: d.durationMin }, "Couldn't update the Zoom meeting.");
    return r.ok ? { ok: true, data: patch } : r;
  }
  const created = store.createdSessions.find((s) => s.id === id);
  if (created) Object.assign(created, patch);
  else store.sessionPatches.set(id, { ...store.sessionPatches.get(id), ...patch });
  return { ok: true, data: patch };
}

export async function deleteSession(id: number): Promise<ActionResult> {
  await requireRole([...TEACHING]);
  if (!isMock) return remote(`/admin/sessions/${id}`, "DELETE", undefined, "Couldn't cancel the Zoom meeting.");
  store.deletedSessions.add(id);
  return { ok: true };
}

/* ───────── Assignments ───────── */

const assignmentEditSchema = z.object({
  title: z.string().trim().min(3, "Give the assignment a title.").max(160),
  description: z.string().trim().min(10, "Describe what students should submit.").max(4000),
  moduleTitle: z.string().max(120).nullable(),
  dueAt: isoDate,
  maxScore: z.number().int().min(1).max(100),
});
export type AssignmentEditInput = z.input<typeof assignmentEditSchema>;

export async function updateAssignment(id: number, input: AssignmentEditInput): Promise<ActionResult> {
  await requireRole([...TEACHING]);
  const p = assignmentEditSchema.safeParse(input);
  if (!p.success) return { ok: false, error: first(p.error) };
  if (!isMock) return remote(`/admin/assignments/${id}`, "PATCH", p.data);
  const created = store.createdAssignments.find((a) => a.id === id);
  if (created) Object.assign(created, p.data);
  else store.assignmentPatches.set(id, { ...store.assignmentPatches.get(id), ...p.data });
  return { ok: true };
}

export async function deleteAssignment(id: number): Promise<ActionResult> {
  await requireRole([...TEACHING]);
  if (!isMock) return remote(`/admin/assignments/${id}`, "DELETE", undefined, "Couldn't delete the assignment.");
  store.deletedAssignments.add(id);
  return { ok: true };
}

/* ───────── Doubts ───────── */

export async function deleteDoubt(id: number): Promise<ActionResult> {
  await requireRole([...TEACHING]);
  if (!isMock) return remote(`/admin/doubts/${id}`, "DELETE", undefined, "Couldn't delete the question.");
  if (store.doubts) store.doubts = store.doubts.filter((d) => d.id !== id);
  return { ok: true };
}

/* ───────── Courses ───────── */

const lessonDraft = z.object({
  id: z.number().int().optional(),
  title: z.string().trim().min(3, "Every lesson needs a title (3+ letters).").max(160),
  releaseAt: isoDate,
  fileName: z.string().max(240).nullable(),
  isPreview: z.boolean(),
});
const detailsSchema = z.object({
  title: z.string().trim().min(3, "Give the course a name (3+ letters).").max(120),
  tagline: z.string().trim().min(10, "Write one line about the course (10+ letters).").max(200),
  description: z.string().trim().max(4000),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]),
  coachId: z.number().int().positive("Choose a coach."),
  publish: z.boolean(),
  cover: z.string().nullable().optional(),
});
const fullSchema = detailsSchema
  .extend({
    startsAt: isoDate,
    endsAt: isoDate,
    modules: z
      .array(z.object({ id: z.number().int().optional(), title: z.string().trim().min(2, "Every module needs a name.").max(120), lessons: z.array(lessonDraft).min(1, "Each module needs at least one lesson.").max(60) }))
      .min(1, "Add at least one module.")
      .max(30),
  })
  .refine((c) => +new Date(c.endsAt) > +new Date(c.startsAt), { message: "The end date must be after the start date.", path: ["endsAt"] })
  .refine((c) => c.modules.every((m) => m.lessons.every((l) => +new Date(l.releaseAt) >= +new Date(c.startsAt) && +new Date(l.releaseAt) < +new Date(c.endsAt) + DAY)), {
    message: "Every lesson's opening date must be between the course start and end dates.",
    path: ["modules"],
  });

/**
 * Edit a course. Courses made in the admin panel can change everything (dates, modules, lessons).
 * Built-in courses (the CGR program and the starter short courses) change their details only, so
 * students keep their progress on the existing lessons.
 */
export async function updateCourse(slug: string, input: CourseDraft): Promise<ActionResult<{ slug: string }>> {
  await requireRole([...STAFF]);
  const cover = input.cover ?? null;
  if (cover !== null && !isSafeCover(cover)) return { ok: false, error: "Pick a cover photo from the library." };
  if (!isMock) {
    const p = detailsSchema.safeParse(input);
    if (!p.success) return { ok: false, error: first(p.error) };
    return remote(`/admin/courses/${slug}`, "PATCH", input, "Couldn't save the course.");
  }
  const coach = mockCoaches().find((c) => c.id === input.coachId);
  if (!coach) return { ok: false, error: "Choose a coach." };
  const created = store.createdCourses.find((c) => c.slug === slug);

  if (!created) {
    const p = detailsSchema.safeParse(input);
    if (!p.success) return { ok: false, error: first(p.error) };
    const base = (await getAdminCourses()).find((c) => c.slug === slug);
    if (!base) return { ok: false, error: "Course not found." };
    const d = p.data;
    store.courseOverrides.set(slug, { ...base, title: d.title, tagline: d.tagline, description: d.description || null, level: d.level, coach, cover, status: d.publish ? "published" : "draft" });
    return { ok: true, data: { slug } };
  }

  const p = fullSchema.safeParse(input);
  if (!p.success) return { ok: false, error: first(p.error) };
  const d = p.data;
  const oldLessons = new Map(created.modules.flatMap((m) => m.lessons).map((l) => [l.id, l]));
  Object.assign(created, {
    title: d.title,
    tagline: d.tagline,
    description: d.description || null,
    level: d.level,
    coach,
    cover,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    status: d.publish ? "published" : "draft",
    modules: d.modules.map((m, mi) => {
      const moduleId = m.id ?? nextId();
      return {
        id: moduleId,
        title: m.title,
        summary: m.lessons.map((l) => l.title).join(" · "),
        order: mi + 1,
        weekFrom: mi + 1,
        weekTo: mi + 1,
        lessons: m.lessons.map((l, li): Lesson => {
          const old = l.id ? oldLessons.get(l.id) : undefined;
          const hasVideo = !!l.fileName;
          return {
            id: old?.id ?? nextId(),
            moduleId,
            title: l.title,
            type: "video",
            durationSec: hasVideo ? (old?.durationSec || DEMO_VIDEOS.lesson.durationSec) : 0,
            order: li + 1,
            isPreview: l.isPreview,
            watchedSec: 0,
            completed: false,
            locked: false,
            releaseAt: l.releaseAt,
            videoSrc: hasVideo ? (old?.videoSrc ?? DEMO_VIDEOS.lesson.src) : null,
            posterSrc: hasVideo ? (old?.posterSrc ?? DEMO_VIDEOS.lesson.poster) : null,
          };
        }),
      };
    }),
  } satisfies Partial<Course>);
  return { ok: true, data: { slug } };
}

export async function setCoursePublished(slug: string, publish: boolean): Promise<ActionResult> {
  await requireRole([...STAFF]);
  if (!isMock) return remote(`/admin/courses/${slug}`, "PATCH", { publish });
  if (slug === "cgr-mastery" && !publish) return { ok: false, error: "The CGR program is what enrolled students study. It can't be unpublished." };
  const created = store.createdCourses.find((c) => c.slug === slug);
  if (created) {
    created.status = publish ? "published" : "draft";
    return { ok: true };
  }
  const base = (await getAdminCourses()).find((c) => c.slug === slug);
  if (!base) return { ok: false, error: "Course not found." };
  store.courseOverrides.set(slug, { ...base, status: publish ? "published" : "draft" });
  return { ok: true };
}

export async function deleteCourse(slug: string): Promise<ActionResult> {
  await requireRole([...STAFF]);
  if (slug === "cgr-mastery") return { ok: false, error: "The CGR program can't be deleted: enrolled students study it." };
  if (!isMock) return remote(`/admin/courses/${slug}`, "DELETE", undefined, "Couldn't delete the course.");
  const i = store.createdCourses.findIndex((c) => c.slug === slug);
  if (i >= 0) store.createdCourses.splice(i, 1);
  else store.deletedCourses.add(slug);
  store.courseOverrides.delete(slug);
  return { ok: true };
}
