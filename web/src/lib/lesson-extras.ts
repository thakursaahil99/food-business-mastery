import type { Lesson } from "./types";

/**
 * Per-lesson "Overview" bullets and downloadable files (Udemy-style lesson tabs).
 * Mock content derived from the lesson title until the API serves
 * GET /lessons/{id} { overview: string[], resources: Resource[] } (files via signed URLs).
 */

export type Resource = { name: string; kind: "PDF" | "Excel" | "Word"; sizeKb: number };
export type LessonExtras = { overview: string[]; resources: Resource[] };

const TOPICS: { match: RegExp; overview: string[]; files: Resource[] }[] = [
  {
    match: /kitchen|workflow|layout|equipment/i,
    overview: ["How to zone a kitchen for one-way flow", "Where receiving, storage, prep and dispatch should sit", "Common layout mistakes that fail audits"],
    files: [{ name: "Kitchen zoning checklist", kind: "PDF", sizeKb: 420 }, { name: "Equipment planner", kind: "Excel", sizeKb: 96 }],
  },
  {
    match: /budget|cost|pric|tender|proposal|negotiat/i,
    overview: ["Build a cost-plus price per meal", "What to include in overheads and margin", "How to present numbers so clients say yes"],
    files: [{ name: "Cost-plus pricing sheet", kind: "Excel", sizeKb: 132 }, { name: "Proposal template", kind: "Word", sizeKb: 88 }],
  },
  {
    match: /nabh|haccp|safety|fssai|licen|audit|compliance/i,
    overview: ["What auditors look for, point by point", "The records you must keep every day", "A 30-day plan to close common gaps"],
    files: [{ name: "NABH 62-point checklist", kind: "PDF", sizeKb: 610 }, { name: "Daily food-safety log", kind: "Excel", sizeKb: 74 }],
  },
  {
    match: /roster|staff|inventory|vendor|kpi|review/i,
    overview: ["Plan staff for 3 shifts without overtime", "Track stock and vendors every week", "The 5 numbers to review with every client"],
    files: [{ name: "Shift roster template", kind: "Excel", sizeKb: 110 }, { name: "Monthly client review deck", kind: "PDF", sizeKb: 880 }],
  },
  {
    match: /nutrition|diet|patient|tray|quality/i,
    overview: ["Basics of therapeutic diets", "Running patient tray service on time", "Simple quality checks that patients notice"],
    files: [{ name: "Therapeutic diet chart", kind: "PDF", sizeKb: 540 }],
  },
];

const DEFAULT: LessonExtras = {
  overview: ["The key idea of this lesson in plain words", "A real example from a running contract", "One action to try at your own site this week"],
  resources: [{ name: "Lesson notes", kind: "PDF", sizeKb: 260 }],
};

export function lessonExtras(lesson: Pick<Lesson, "title" | "type">): LessonExtras {
  const t = TOPICS.find((x) => x.match.test(lesson.title));
  if (!t) return DEFAULT;
  return { overview: t.overview, resources: lesson.type === "pdf" ? [] : t.files };
}

export const sizeLabel = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
