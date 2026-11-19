import "server-only";
import type { Doubt } from "../types";
import { apiFetch, isMock } from "./client";
import { requireUser } from "./data";
import { allDoubts } from "./mock-store";

/** Public Q&A for one lesson (Udemy-style): every student can read questions and answers on that lesson. */
export type LessonQuestion = Pick<Doubt, "id" | "subject" | "body" | "createdAt" | "status" | "answer"> & { asker: string; mine: boolean };

/** "Rohit Sharma" → "Rohit S." so other students' full names aren't shown. */
const shortName = (n: string) => {
  const [first, last] = n.split(" ");
  return last ? `${first} ${last[0]}.` : (first ?? "");
};

export async function getLessonQuestions(lesson: { id: number; title: string }): Promise<LessonQuestion[]> {
  const user = await requireUser();
  if (!isMock) return apiFetch<LessonQuestion[]>(`/lessons/${lesson.id}/questions`);
  return allDoubts(new Date())
    .filter((d) => d.sessionTitle === lesson.title)
    .map((d) => ({ id: d.id, subject: d.subject, body: d.body, createdAt: d.createdAt, status: d.status, answer: d.answer, asker: shortName(d.studentName), mine: d.studentName === user.name }));
}
