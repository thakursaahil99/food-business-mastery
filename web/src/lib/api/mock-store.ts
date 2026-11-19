import "server-only";
import type {
  Course,
  ReminderPrefs,
  Assignment,
  AssignmentAdmin,
  BillingProfile,
  ClassSession,
  Doubt,
  LeadStatus,
  Lesson,
  Submission,
  User,
} from "../types";

/**
 * In-memory "database" for mock mode, so admin ↔ student flows work end to end
 * (answer a doubt → student sees it, review a submission → student sees the score…).
 * Lives on globalThis so it survives hot reloads; resets when the server restarts.
 * Replaced entirely by Postgres via the Laravel API once API_URL is set.
 */

type DoubtRow = Doubt & { studentId: number | "demo" };

type Store = {
  createdSessions: ClassSession[];
  sessionPatches: Map<number, Partial<ClassSession>>;
  leadStatus: Map<number, LeadStatus>;
  doubts: DoubtRow[] | null;
  submissions: Map<string, Submission & { studentName: string }>; // `${assignmentId}:${userId}`
  reviews: Map<string, Pick<Submission, "score" | "feedback" | "reviewedBy">>; // `${assignmentId}:${submissionId}`
  createdAssignments: Omit<Assignment, "submission">[];
  billing: Map<number, BillingProfile>;
  prefs: Map<number, ReminderPrefs>;
  lessonsAdded: Map<number, Lesson[]>;
  /** Courses created in the admin panel (lesson lock state is computed on read from releaseAt). */
  createdCourses: Course[];
  seq: number;
};

const g = globalThis as unknown as { __rbMockStore?: Store };
const fresh = (): Store => ({
  createdSessions: [],
  sessionPatches: new Map(),
  leadStatus: new Map(),
  doubts: null,
  submissions: new Map(),
  reviews: new Map(),
  createdAssignments: [],
  billing: new Map(),
  prefs: new Map(),
  lessonsAdded: new Map(),
  createdCourses: [],
  seq: 50_000,
});
// The store survives hot reloads on globalThis. Merge over fresh defaults so a field added to Store
// while the dev server is running exists too (otherwise e.g. store.prefs is undefined until restart).
export const store: Store = (g.__rbMockStore = { ...fresh(), ...g.__rbMockStore });

export const nextId = () => ++store.seq;

/* ───────── Sessions ───────── */

export function withSessionOverlays(base: ClassSession[]) {
  return [...base, ...store.createdSessions]
    .map((s) => ({ ...s, ...store.sessionPatches.get(s.id) }))
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
}

/* ───────── Assignments ───────── */

const DAY = 86_400_000;

function seedAssignments(now: Date): Omit<Assignment, "submission">[] {
  const at = (d: number, h = 23, m = 59) => {
    const x = new Date(now.getTime() + d * DAY);
    x.setUTCHours(h - 5, m - 30, 0, 0); // IST wall clock
    return x.toISOString();
  };
  const batchName = "Batch 07 · Oct 2026";
  return [
    { id: 701, title: "Map your kitchen workflow", description: "Draw the flow for breakfast, lunch and dinner service for a 200-bed hospital. Mark receiving, storage, prep, cooking, plating and dispatch zones. Upload a photo or PDF.", moduleTitle: "Healthcare Infrastructure", batchName, dueAt: at(-25), maxScore: 10 },
    { id: 702, title: "Site budget sheet", description: "Using the template from Week 3, prepare a capex + monthly opex budget for a 600-cover corporate cafeteria.", moduleTitle: "Healthcare Infrastructure", batchName, dueAt: at(-18), maxScore: 10 },
    { id: 703, title: "HACCP plan for one menu item", description: "Pick one high-risk menu item and write a full HACCP plan: hazards, CCPs, critical limits, monitoring, corrective actions and records.", moduleTitle: "Compliance & Standards", batchName, dueAt: at(-4), maxScore: 20 },
    { id: 704, title: "NABH gap checklist", description: "Walk through your current (or a visited) kitchen with the 62-point NABH checklist. List the top 10 gaps and how you'd close each within 30 days.", moduleTitle: "Compliance & Standards", batchName, dueAt: at(2), maxScore: 20 },
    { id: 705, title: "Cost-plus pricing for a real tender", description: "Find a live or recent tender (corporate or hospital). Build a cost-plus price per meal with your food cost, labour, overheads and margin. Explain your assumptions.", moduleTitle: "Business Development", batchName, dueAt: at(9), maxScore: 30 },
  ];
}

/** Default state for any demo student: first two reviewed, third submitted, rest open. */
function seededSubmission(id: number, a: Omit<Assignment, "submission">): Submission | null {
  const due = +new Date(a.dueAt);
  if (id === 701) return { submittedAt: new Date(due - 2 * DAY).toISOString(), text: "Workflow attached with 6 zones and one-way flow from receiving to dispatch.", fileName: "kitchen-flow.pdf", score: 9, feedback: "Clean one-way flow. Add a separate return path for used trays to avoid cross-contamination.", reviewedBy: "Bobby Singh" };
  if (id === 702) return { submittedAt: new Date(due - DAY).toISOString(), text: "Budget sheet with capex ₹38L and monthly opex ₹11.2L.", fileName: "site-budget.xlsx", score: 7, feedback: "Good structure. Your labour cost is under-estimated for 3 shifts. Revisit with the rostering template.", reviewedBy: "Coach Anjali" };
  if (id === 703) return { submittedAt: new Date(due - 6 * 3_600_000).toISOString(), text: "HACCP plan for chicken biryani, 5 CCPs identified.", fileName: "haccp-biryani.pdf", score: null, feedback: null, reviewedBy: null };
  return null;
}

const allAssignments = (now: Date) => [...seedAssignments(now), ...store.createdAssignments];

export function studentAssignments(user: User, now: Date): Assignment[] {
  return allAssignments(now)
    .map((a) => {
      const own = store.submissions.get(`${a.id}:${user.id}`);
      const base = own ?? seededSubmission(a.id, a);
      const review = store.reviews.get(`${a.id}:${own ? user.id : "demo"}`);
      return { ...a, submission: base ? { ...base, ...(review ?? {}) } : null };
    })
    .sort((a, b) => +new Date(a.dueAt) - +new Date(b.dueAt));
}

const classmates = ["Aarav Mehta", "Diya Reddy", "Kabir Singh", "Meera Nair", "Pranav Joshi", "Sneha Kapoor", "Varun Iyer", "Pooja Bansal"];

export function adminAssignments(now: Date): AssignmentAdmin[] {
  return allAssignments(now).map((a) => {
    const due = +new Date(a.dueAt);
    const past = due < now.getTime();
    const generatedCount = past ? 6 : Math.max(0, 3 - Math.ceil((due - now.getTime()) / (3 * DAY)));
    const generated = classmates.slice(0, a.id > 705 ? 0 : generatedCount).map((name, i) => {
      const sid = a.id * 100 + i;
      const reviewed = past && i < 3;
      const base: Submission = {
        submittedAt: new Date(Math.min(due, now.getTime()) - (i + 1) * 7_200_000).toISOString(),
        text: `Submission by ${name.split(" ")[0]} for “${a.title}”.`,
        fileName: `${name.split(" ")[0]!.toLowerCase()}-${a.id}.pdf`,
        score: reviewed ? Math.round(a.maxScore * (0.6 + i * 0.12)) : null,
        feedback: reviewed ? "Solid work. See inline notes." : null,
        reviewedBy: reviewed ? "Bobby Singh" : null,
      };
      return { id: sid, studentName: name, ...base, ...store.reviews.get(`${a.id}:${sid}`) };
    });
    const demo = seededSubmission(a.id, a);
    const demoRow = demo ? [{ id: -a.id, studentName: "Rohit Sharma", ...demo, ...store.reviews.get(`${a.id}:demo`) }] : [];
    const real = [...store.submissions.entries()]
      .filter(([k]) => k.startsWith(`${a.id}:`))
      .map(([k, v]) => {
        const uid = Number(k.split(":")[1]);
        return { ...v, id: uid, ...store.reviews.get(`${a.id}:${uid}`) };
      });
    return { ...a, enrolled: 34, submissions: [...real, ...demoRow, ...generated] };
  });
}

/** Maps an admin-visible submission id back to its review key. */
export const reviewKey = (assignmentId: number, submissionId: number) => `${assignmentId}:${submissionId < 0 ? "demo" : submissionId}`;

/* ───────── Doubts ───────── */

function seedDoubts(now: Date): DoubtRow[] {
  const ago = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
  return [
    { id: 801, studentId: "demo", studentName: "Rohit Sharma", category: "Business", subject: "Cost-plus vs fixed per-plate for a 300-bed hospital?", body: "The hospital wants a fixed per-plate rate but my food cost swings a lot with vegetable prices. How do I propose cost-plus without losing the deal?", sessionTitle: null, createdAt: ago(30), status: "answered", answer: { body: "Propose a hybrid: a fixed management fee plus actual food cost with a monthly ceiling. Show them 3 months of price variance data. Hospitals like predictability, so give them the ceiling. We'll role-play this in Saturday's hot seat.", by: "Bobby Singh", at: ago(22) } },
    { id: 802, studentId: "demo", studentName: "Rohit Sharma", category: "Live class", subject: "HACCP CCP for reheated dal", body: "In class we said reheating is a CCP. What critical limit should I write for dal that's reheated for dinner?", sessionTitle: "HACCP plan, step by step", createdAt: ago(80), status: "answered", answer: { body: "Core temperature of 75°C or above, checked with a probe and logged each batch. Reheat only once, and discard anything not served within 2 hours of reheating.", by: "Coach Anjali", at: ago(70) } },
    { id: 803, studentId: "demo", studentName: "Rohit Sharma", category: "Course content", subject: "Where is the NABH 62-point checklist?", body: "Announcement says it's uploaded but I can't find it in Learn.", sessionTitle: null, createdAt: ago(4), status: "open", answer: null },
    { id: 804, studentId: 9001, studentName: "Diya Reddy", category: "Technical", subject: "Zoom link not opening on phone", body: "Clicking Join opens the browser but not the Zoom app.", sessionTitle: null, createdAt: ago(9), status: "open", answer: null },
    { id: 805, studentId: 9002, studentName: "Kabir Singh", category: "Payments", subject: "GST invoice in company name", body: "Can my instalment invoices be issued to my company with GSTIN?", sessionTitle: null, createdAt: ago(26), status: "open", answer: null },
    { id: 806, studentId: 9003, studentName: "Meera Nair", category: "Business", subject: "Minimum team for an industrial canteen of 800", body: "How many cooks and helpers for 3 shifts, 800 meals per shift?", sessionTitle: null, createdAt: ago(50), status: "answered", answer: { body: "Start with 1 cook per 120–150 meals per shift and 1 helper per 80. Use the rostering template from Week 8 and adjust after the first 2 weeks of data.", by: "Bobby Singh", at: ago(40) } },
  ];
}

export function doubtRows(now: Date) {
  store.doubts ??= seedDoubts(now);
  return store.doubts;
}

const strip = (row: DoubtRow): Doubt => {
  const d: Partial<DoubtRow> = { ...row };
  delete d.studentId;
  return d as Doubt;
};

export const studentDoubts = (user: User, now: Date) =>
  doubtRows(now)
    .filter((d) => d.studentId === user.id || d.studentId === "demo")
    .map(strip)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

export const allDoubts = (now: Date) => doubtRows(now).map(strip).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

export const DEFAULT_PREFS: ReminderPrefs = { whatsapp: true, email: true, dayBefore: true, min15: true };

/* ───────── Courses created in admin ───────── */

/** Published admin-created courses as a student sees them: lessons stay locked until their releaseAt. */
export function publishedCourses(now: number): Course[] {
  return store.createdCourses
    .filter((c) => c.status === "published")
    .map((c) => ({
      ...c,
      modules: c.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({ ...l, locked: !!l.releaseAt && +new Date(l.releaseAt) > now })),
      })),
    }));
}
