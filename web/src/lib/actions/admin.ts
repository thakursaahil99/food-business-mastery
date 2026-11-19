"use server";

import { z } from "zod";
import { apiFetch, isMock } from "../api/client";
import { requireRole } from "../api/data";
import { getBatches } from "../api/data-admin";
import { nextId, reviewKey, store, doubtRows } from "../api/mock-store";
import type { ActionResult, Assignment, ClassSession, Course, CourseDraft, Doubt, LeadStatus, Lesson, Submission } from "../types";
import { DEMO_VIDEOS, mockCoaches } from "../api/mock";

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "approved", "rejected"];
const STAFF = ["super_admin", "admin"] as const;
const TEACHING = ["super_admin", "admin", "coach"] as const;

export async function updateLeadStatus(id: number, status: LeadStatus): Promise<ActionResult> {
  await requireRole([...STAFF]);
  if (!LEAD_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };
  if (isMock) {
    store.leadStatus.set(id, status);
    return { ok: true };
  }
  try {
    await apiFetch(`/admin/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update the lead." };
  }
}

export async function sendPaymentLink(leadId: number): Promise<ActionResult> {
  await requireRole([...STAFF]);
  if (isMock) return { ok: true };
  try {
    await apiFetch(`/admin/leads/${leadId}/payment-link`, { method: "POST" });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't send the payment link." };
  }
}

/* ───────── Classes (Zoom) ───────── */

const sessionSchema = z.object({
  title: z.string().trim().min(3, "Give the session a title.").max(160),
  type: z.enum(["live", "webinar", "mentorship"]),
  batchId: z.number().int(),
  startsAt: z.iso.datetime({ message: "Pick a valid date and time." }),
  durationMin: z.number().int().min(15, "Duration must be 15–480 minutes.").max(480, "Duration must be 15–480 minutes."),
  record: z.boolean(),
});

/**
 * Laravel creates the Zoom meeting via Server-to-Server OAuth (POST /users/me/meetings) with
 * settings.auto_recording = "cloud" when `record` is on, and registers each enrolled student so
 * every join link is unique (that's how participant webhooks map to attendance).
 */
export async function createSession(input: z.infer<typeof sessionSchema>): Promise<ActionResult<ClassSession>> {
  const user = await requireRole([...TEACHING]);
  const p = sessionSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const d = p.data;

  if (!isMock) {
    try {
      return { ok: true, data: await apiFetch<ClassSession>("/admin/sessions", { method: "POST", body: JSON.stringify({ title: d.title, type: d.type, batch_id: d.batchId, starts_at: d.startsAt, duration_min: d.durationMin, auto_record: d.record }) }) };
    } catch {
      return { ok: false, error: "Couldn't create the Zoom meeting." };
    }
  }

  const batch = (await getBatches()).find((b) => b.id === d.batchId);
  const session: ClassSession = {
    id: nextId(),
    batchId: d.batchId,
    batchName: batch?.name ?? "",
    programTitle: batch?.programTitle ?? "",
    title: d.title,
    description: null,
    type: d.type,
    coach: { id: user.id, name: user.role === "coach" ? user.name : (batch?.coachName ?? user.name), title: "" },
    startsAt: d.startsAt,
    endsAt: new Date(+new Date(d.startsAt) + d.durationMin * 60_000).toISOString(),
    status: "scheduled",
    moduleTitle: null,
    week: null,
    platform: "zoom",
    recordingEnabled: d.record,
    recordingStatus: d.record ? "scheduled" : "off",
    recordingDurationSec: null,
    recordingAvailable: false,
    attended: null,
    attendedSec: null,
  };
  store.createdSessions.push(session);
  return { ok: true, data: session };
}

/** Flip auto cloud-recording for an upcoming class (Zoom PATCH /meetings/{id} settings.auto_recording). */
export async function setSessionRecording(sessionId: number, record: boolean): Promise<ActionResult> {
  await requireRole([...TEACHING]);
  if (isMock) {
    store.sessionPatches.set(sessionId, { ...store.sessionPatches.get(sessionId), recordingEnabled: record, recordingStatus: record ? "scheduled" : "off" });
    return { ok: true };
  }
  try {
    await apiFetch(`/admin/sessions/${sessionId}`, { method: "PATCH", body: JSON.stringify({ auto_record: record }) });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't update recording on Zoom." };
  }
}

/** Host start link (Zoom start_url is short-lived, so it's always fetched fresh). */
export async function getHostLink(sessionId: number): Promise<ActionResult<{ url: string | null }>> {
  await requireRole([...TEACHING]);
  if (isMock) return { ok: true, data: { url: null } };
  try {
    return { ok: true, data: await apiFetch<{ url: string }>(`/admin/sessions/${sessionId}/start`, { method: "POST" }) };
  } catch {
    return { ok: false, error: "Couldn't get the Zoom host link." };
  }
}

/* ───────── Course content ───────── */

/** Mock upload: the real flow is a signed upload to Laravel → queue job → ffmpeg HLS (360p/720p). */
export async function addLesson(input: { moduleId: number; title: string; fileName: string; durationSec: number }): Promise<ActionResult<Lesson>> {
  await requireRole([...TEACHING]);
  if (input.title.trim().length < 3) return { ok: false, error: "Give the video a title." };
  if (!isMock) return { ok: false, error: "Video upload is handled by the backend upload endpoint." };
  const list = store.lessonsAdded.get(input.moduleId) ?? [];
  const lesson: Lesson = { id: nextId(), moduleId: input.moduleId, title: input.title.trim(), type: "video", durationSec: input.durationSec, order: 100 + list.length, isPreview: false, watchedSec: 0, completed: false, locked: false };
  store.lessonsAdded.set(input.moduleId, [...list, lesson]);
  return { ok: true, data: lesson };
}

/* ───────── Courses ───────── */

const DAY = 86_400_000;
const courseSchema = z
  .object({
    title: z.string().trim().min(3, "Give the course a name (3+ letters).").max(120),
    tagline: z.string().trim().min(10, "Write one line about the course (10+ letters).").max(200),
    description: z.string().trim().max(4000),
    level: z.enum(["Beginner", "Intermediate", "Advanced"]),
    coachId: z.number().int().positive("Choose a coach."),
    startsAt: z.iso.datetime({ message: "Pick a start date." }),
    endsAt: z.iso.datetime({ message: "Pick an end date." }),
    publish: z.boolean(),
    modules: z
      .array(
        z.object({
          title: z.string().trim().min(2, "Every module needs a name.").max(120),
          lessons: z
            .array(
              z.object({
                title: z.string().trim().min(3, "Every lesson needs a title (3+ letters).").max(160),
                releaseAt: z.iso.datetime({ message: "Every lesson needs an opening date." }),
                fileName: z.string().max(240).nullable(),
                isPreview: z.boolean(),
              }),
            )
            .min(1, "Each module needs at least one lesson.")
            .max(60),
        }),
      )
      .min(1, "Add at least one module.")
      .max(30),
  })
  .refine((c) => +new Date(c.endsAt) > +new Date(c.startsAt), { message: "The end date must be after the start date.", path: ["endsAt"] })
  .refine(
    (c) => c.modules.every((m) => m.lessons.every((l) => +new Date(l.releaseAt) >= +new Date(c.startsAt) && +new Date(l.releaseAt) < +new Date(c.endsAt) + DAY)),
    { message: "Every lesson's opening date must be between the course start and end dates.", path: ["modules"] },
  );

const slugify = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "course";

export async function createCourse(input: CourseDraft): Promise<ActionResult<{ id: number; slug: string }>> {
  await requireRole(["super_admin", "admin"]);
  const p = courseSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const d = p.data;
  if (!isMock) {
    try {
      return { ok: true, data: await apiFetch("/admin/courses", { method: "POST", body: JSON.stringify(d) }) };
    } catch {
      return { ok: false, error: "Couldn't create the course. Please try again." };
    }
  }
  const coach = mockCoaches().find((c) => c.id === d.coachId);
  if (!coach) return { ok: false, error: "Choose a coach." };
  const taken = new Set(["cgr-mastery", ...store.createdCourses.map((c) => c.slug)]);
  let slug = slugify(d.title);
  for (let n = 2; taken.has(slug); n++) slug = `${slugify(d.title)}-${n}`;

  // Demo mode: an attached file plays the sample lesson. Real uploads go to Laravel → ffmpeg HLS.
  const course: Course = {
    id: nextId(),
    slug,
    title: d.title,
    tagline: d.tagline,
    description: d.description || null,
    kind: "short",
    level: d.level,
    coach,
    startsAt: d.startsAt,
    endsAt: d.endsAt,
    status: d.publish ? "published" : "draft",
    modules: d.modules.map((m, mi) => {
      const moduleId = nextId();
      return {
        id: moduleId,
        title: m.title,
        summary: m.lessons.map((l) => l.title).join(" · "),
        order: mi + 1,
        weekFrom: mi + 1,
        weekTo: mi + 1,
        lessons: m.lessons.map((l, li): Lesson => ({
          id: nextId(),
          moduleId,
          title: l.title,
          type: "video",
          durationSec: l.fileName ? DEMO_VIDEOS.lesson.durationSec : 0,
          order: li + 1,
          isPreview: l.isPreview,
          watchedSec: 0,
          completed: false,
          locked: false,
          releaseAt: l.releaseAt,
          videoSrc: l.fileName ? DEMO_VIDEOS.lesson.src : null,
          posterSrc: l.fileName ? DEMO_VIDEOS.lesson.poster : null,
        })),
      };
    }),
  };
  store.createdCourses.unshift(course);
  return { ok: true, data: { id: course.id, slug } };
}

/* ───────── Assignments ───────── */

const assignmentSchema = z.object({
  title: z.string().trim().min(3, "Give the assignment a title.").max(160),
  description: z.string().trim().min(10, "Describe what students should submit.").max(4000),
  moduleTitle: z.string().max(120).nullable(),
  dueAt: z.iso.datetime({ message: "Pick a due date." }),
  maxScore: z.number().int().min(1).max(100),
});

export async function createAssignment(input: z.infer<typeof assignmentSchema>): Promise<ActionResult<Omit<Assignment, "submission">>> {
  await requireRole([...TEACHING]);
  const p = assignmentSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  if (!isMock) {
    try {
      return { ok: true, data: await apiFetch("/admin/assignments", { method: "POST", body: JSON.stringify(p.data) }) };
    } catch {
      return { ok: false, error: "Couldn't create the assignment." };
    }
  }
  const a = { id: nextId(), batchName: "Batch 07 · Oct 2026", ...p.data };
  store.createdAssignments.push(a);
  return { ok: true, data: a };
}

export async function reviewSubmission(input: { assignmentId: number; submissionId: number; score: number; maxScore: number; feedback: string }): Promise<ActionResult<Pick<Submission, "score" | "feedback" | "reviewedBy">>> {
  const user = await requireRole([...TEACHING]);
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > input.maxScore) return { ok: false, error: `Score must be between 0 and ${input.maxScore}.` };
  const review = { score: Math.round(input.score), feedback: input.feedback.trim() || null, reviewedBy: user.name };
  if (isMock) {
    store.reviews.set(reviewKey(input.assignmentId, input.submissionId), review);
    return { ok: true, data: review };
  }
  try {
    await apiFetch(`/admin/assignments/${input.assignmentId}/submissions/${input.submissionId}`, { method: "PATCH", body: JSON.stringify(review) });
    return { ok: true, data: review };
  } catch {
    return { ok: false, error: "Couldn't save the review." };
  }
}

/* ───────── Doubts ───────── */

export async function answerDoubt(doubtId: number, body: string): Promise<ActionResult<Doubt["answer"]>> {
  const user = await requireRole([...TEACHING]);
  if (body.trim().length < 5) return { ok: false, error: "Write a proper answer (5+ characters)." };
  const answer = { body: body.trim(), by: user.name, at: new Date().toISOString() };
  if (isMock) {
    const row = doubtRows(new Date()).find((d) => d.id === doubtId);
    if (!row) return { ok: false, error: "Question not found." };
    Object.assign(row, { status: "answered", answer });
    return { ok: true, data: answer };
  }
  try {
    await apiFetch(`/admin/doubts/${doubtId}/answer`, { method: "POST", body: JSON.stringify({ body: answer.body }) });
    return { ok: true, data: answer };
  } catch {
    return { ok: false, error: "Couldn't send the answer." };
  }
}
