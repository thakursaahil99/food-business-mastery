"use server";

import { z } from "zod";
import { apiFetch, isMock } from "../api/client";
import { requireUser } from "../api/data";
import { nextId, store, doubtRows } from "../api/mock-store";
import type { ActionResult, BillingProfile, Doubt, DoubtCategory, ReminderPrefs, Submission } from "../types";

const submissionSchema = z.object({
  assignmentId: z.number().int().positive(),
  text: z.string().trim().min(10, "Write at least a couple of lines about your work.").max(5000),
  fileName: z.string().max(200).nullable(),
});

/** File bytes go to Laravel's Storage (signed upload) in the backend phase; here we keep the name. */
export async function submitAssignment(input: z.infer<typeof submissionSchema>): Promise<ActionResult<Submission>> {
  const user = await requireUser();
  const p = submissionSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  const submission: Submission = { submittedAt: new Date().toISOString(), text: p.data.text, fileName: p.data.fileName, score: null, feedback: null, reviewedBy: null };
  if (isMock) {
    store.submissions.set(`${p.data.assignmentId}:${user.id}`, { ...submission, studentName: user.name });
    return { ok: true, data: submission };
  }
  try {
    return { ok: true, data: await apiFetch<Submission>(`/assignments/${p.data.assignmentId}/submissions`, { method: "POST", body: JSON.stringify({ text: p.data.text }) }) };
  } catch {
    return { ok: false, error: "Couldn't submit. Please try again." };
  }
}

const CATEGORIES: DoubtCategory[] = ["Live class", "Course content", "Business", "Technical", "Payments"];
const doubtSchema = z.object({
  category: z.enum(CATEGORIES as [DoubtCategory, ...DoubtCategory[]]),
  subject: z.string().trim().min(5, "Add a short subject (5+ characters).").max(140),
  body: z.string().trim().min(10, "Describe your question in a bit more detail.").max(3000),
  sessionTitle: z.string().max(200).nullable(),
});

export async function askDoubt(input: z.infer<typeof doubtSchema>): Promise<ActionResult<Doubt>> {
  const user = await requireUser();
  const p = doubtSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  if (isMock) {
    const doubt: Doubt = { id: nextId(), studentName: user.name, ...p.data, createdAt: new Date().toISOString(), status: "open", answer: null };
    doubtRows(new Date()).unshift({ ...doubt, studentId: user.id });
    return { ok: true, data: doubt };
  }
  try {
    return { ok: true, data: await apiFetch<Doubt>("/my/doubts", { method: "POST", body: JSON.stringify(p.data) }) };
  } catch {
    return { ok: false, error: "Couldn't send your question. Please try again." };
  }
}

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const billingSchema = z.object({
  businessName: z.string().trim().min(2, "Enter the business name on the invoice.").max(120),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => GSTIN_RE.test(v), "That doesn't look like a valid 15-character GSTIN."),
  address: z.string().trim().min(8, "Enter the billing address.").max(300),
  state: z.string().trim().min(2, "Enter the state.").max(60),
});

export async function saveBillingProfile(input: BillingProfile): Promise<ActionResult<BillingProfile>> {
  const user = await requireUser();
  const p = billingSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]!.message };
  if (isMock) {
    store.billing.set(user.id, p.data);
    return { ok: true, data: p.data };
  }
  try {
    return { ok: true, data: await apiFetch<BillingProfile>("/my/billing-profile", { method: "PUT", body: JSON.stringify(p.data) }) };
  } catch {
    return { ok: false, error: "Couldn't save billing details." };
  }
}

export async function saveReminderPrefs(prefs: ReminderPrefs): Promise<ActionResult> {
  const user = await requireUser();
  const clean: ReminderPrefs = { whatsapp: !!prefs.whatsapp, email: !!prefs.email, dayBefore: !!prefs.dayBefore, min15: !!prefs.min15 };
  if (isMock) {
    store.prefs.set(user.id, clean);
    return { ok: true };
  }
  try {
    await apiFetch("/my/reminder-prefs", { method: "PUT", body: JSON.stringify(clean) });
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't save. Please try again." };
  }
}
