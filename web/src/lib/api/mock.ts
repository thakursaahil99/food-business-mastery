import "server-only";
import type {
  Announcement,
  ClassSession,
  Coach,
  Course,
  Enrollment,
  PaymentSummary,
  ProgramModule,
  User,
} from "../types";
import { curriculum } from "@/content/site";

/**
 * Deterministic mock data, generated relative to "now" so the portal always has
 * a live class, past recordings and upcoming sessions to show.
 * Replaced by the Laravel API once API_URL is set (see ./client.ts).
 */

const bobby: Coach = { id: 1, name: "Bobby Singh", title: "MD, Red Bean Hospitality" };
const coachA: Coach = { id: 2, name: "Coach Anjali", title: "Operations coach" };

/** Everyone who can be named as a course coach (admin "create course" picker). */
export function mockCoaches(): Coach[] {
  return [bobby, coachA];
}

const PROGRAM = "CGR Mastery Program";
const BATCH = { id: 7, name: "Batch 07 · Oct 2026" };
const IST_OFFSET_MIN = 330;

/** Midnight IST of the day containing `d`, as a UTC Date. */
function istMidnight(d: Date) {
  const ist = new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MIN * 60_000);
}

function at(dayOffset: number, hourIst: number, minute = 0, base = new Date()) {
  const m = istMidnight(base);
  return new Date(m.getTime() + dayOffset * 86_400_000 + (hourIst * 60 + minute) * 60_000);
}

const BATCH_START = (now: Date) => at(-44, 0, 0, now); // ~6 weeks in

export function mockUser(identifier: string): User {
  const isEmail = identifier.includes("@");
  return {
    id: 101,
    name: "Rohit Sharma",
    email: isEmail ? identifier : "student@example.com",
    phone: isEmail ? null : identifier,
    role: "student",
    avatar: null,
  };
}

const lessonTitles: Record<number, string[]> = {
  0: ["Designing a hospital kitchen that flows", "Equipment: buy, lease or client-supplied", "Building the site budget", "Workflow mapping for 3 meal services"],
  1: ["NABH for F&B: what auditors check", "HACCP plan, step by step", "Food safety SOPs & logs", "Licences, FSSAI and renewals"],
  2: ["Rostering for 24×7 sites", "Inventory & vendor management", "Food-cost control dashboard", "KPIs and monthly client reviews"],
  3: ["Clinical nutrition basics", "Therapeutic diet planning", "Patient tray service", "Quality assurance & feedback loops"],
  4: ["Reading a tender like a pro", "Proposals that get signed", "Negotiating cost-plus terms", "From one site to five"],
  5: ["Live project brief", "Case study: 400-bed hospital", "Assessment prep", "Final mentorship"],
};

/** Silent branded clips made by scripts/make-demo-videos.mjs (public/demo). */
export const DEMO_VIDEOS = {
  welcome: { src: "/demo/welcome-12s.webm", poster: "/demo/welcome-12s.jpg", durationSec: 12 },
  lesson: { src: "/demo/lesson-3m30s.webm", poster: "/demo/lesson-3m30s.jpg", durationSec: 210 },
} as const;

export function mockModules(now = new Date()): ProgramModule[] {
  const weeksIn = Math.floor((now.getTime() - BATCH_START(now).getTime()) / (7 * 86_400_000)) + 1;
  let lessonId = 1;
  return curriculum.map((c, i) => {
    const weekFrom = i < 4 ? i * 4 + 1 : i === 4 ? 1 : 16;
    const weekTo = i < 4 ? weekFrom + 3 : 16;
    return {
      id: i + 1,
      title: c.title,
      summary: c.topics.join(" · "),
      order: i + 1,
      weekFrom,
      weekTo,
      lessons: lessonTitles[i]!.map((title, j) => {
        const week = i < 4 ? weekFrom + j : i === 4 ? 2 + j * 4 : 16;
        const unlocked = week <= weeksIn;
        const done = week < weeksIn - (i === 4 ? 1 : 0);
        const type = j === 3 && i === 1 ? ("pdf" as const) : ("video" as const);
        // Demo: the preview lesson plays the 12 s welcome clip, every other video lesson the 3:30 sample lesson.
        const demo = type === "pdf" ? null : i === 0 && j === 0 ? DEMO_VIDEOS.welcome : DEMO_VIDEOS.lesson;
        const duration = demo?.durationSec ?? 1800 + ((i * 7 + j * 13) % 9) * 300;
        return {
          id: lessonId++,
          moduleId: i + 1,
          title,
          type,
          videoSrc: demo?.src ?? null,
          posterSrc: demo?.poster ?? null,
          durationSec: duration,
          order: j + 1,
          isPreview: i === 0 && j === 0,
          watchedSec: done ? duration : week === weeksIn ? Math.round(duration * 0.42) : 0,
          completed: done,
          locked: !unlocked,
        };
      }),
    };
  });
}

/**
 * Short self-paced demo courses shown next to the program in Learn. Everything is unlocked;
 * lesson ids start at 9001 so they never collide with program lessons or admin uploads (50 000+).
 */
const shortCourseSeeds: { slug: string; title: string; tagline: string; level: Course["level"]; coach: Coach; modules: { title: string; lessons: string[] }[] }[] = [
  {
    slug: "kitchen-costing",
    title: "Kitchen Costing Masterclass",
    tagline: "Price every plate and protect your margin on cost-plus contracts.",
    level: "Beginner",
    coach: bobby,
    modules: [
      { title: "Costing basics", lessons: ["Welcome to the masterclass", "Recipe cost cards", "Yield and wastage"] },
      { title: "Daily control", lessons: ["The consumption sheet", "Variance and what to do about it"] },
    ],
  },
  {
    slug: "haccp-essentials",
    title: "HACCP & Food Safety Essentials",
    tagline: "Set up a HACCP plan and the daily logs auditors ask for.",
    level: "Intermediate",
    coach: coachA,
    modules: [{ title: "HACCP in practice", lessons: ["Course introduction", "The 7 HACCP principles", "Critical control points in a hospital kitchen", "Daily logs and record keeping"] }],
  },
  {
    slug: "first-hospital-contract",
    title: "Winning Your First Hospital Contract",
    tagline: "From tender reading to a signed cost-plus agreement.",
    level: "Advanced",
    coach: bobby,
    modules: [{ title: "The contract playbook", lessons: ["Before you bid", "Reading the tender", "Building the proposal", "Negotiation and closing"] }],
  },
];

export function mockShortCourses(): Course[] {
  let lessonId = 9001;
  let moduleId = 901;
  return shortCourseSeeds.map((c, ci) => ({
    id: 100 + ci,
    slug: c.slug,
    title: c.title,
    tagline: c.tagline,
    kind: "short" as const,
    level: c.level,
    coach: c.coach,
    modules: c.modules.map((m, mi) => {
      const id = moduleId++;
      return {
        id,
        title: m.title,
        summary: m.lessons.join(" · "),
        order: mi + 1,
        weekFrom: 1,
        weekTo: 1,
        lessons: m.lessons.map((title, j) => {
          const demo = mi === 0 && j === 0 ? DEMO_VIDEOS.welcome : DEMO_VIDEOS.lesson;
          // first course is part-watched so "Continue watching" has something to show
          const completed = ci === 0 && mi === 0 && j === 0;
          const watched = completed ? demo.durationSec : ci === 0 && mi === 0 && j === 1 ? 95 : 0;
          return {
            id: lessonId++,
            moduleId: id,
            title,
            type: "video" as const,
            durationSec: demo.durationSec,
            order: j + 1,
            isPreview: mi === 0 && j === 0,
            watchedSec: watched,
            completed,
            locked: false,
            videoSrc: demo.src,
            posterSrc: demo.poster,
          };
        }),
      };
    }),
  }));
}

export function mockEnrollment(now = new Date()): Enrollment {
  const start = BATCH_START(now);
  const end = new Date(start.getTime() + 16 * 7 * 86_400_000);
  const mods = mockModules(now);
  const all = mods.flatMap((m) => m.lessons);
  const progress = Math.round((all.filter((l) => l.completed).length / all.length) * 100);
  return {
    id: 501,
    status: "active",
    enrolledAt: new Date(start.getTime() - 9 * 86_400_000).toISOString(),
    program: { id: 1, title: PROGRAM, slug: "cgr-mastery", durationWeeks: 16 },
    batch: {
      id: BATCH.id,
      programId: 1,
      name: BATCH.name,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      seats: 40,
      seatsTaken: 34,
      coach: bobby,
      price: 150000,
      status: "running",
    },
    progressPct: progress,
    attendancePct: 87,
    currentWeek: Math.min(16, Math.floor((now.getTime() - start.getTime()) / (7 * 86_400_000)) + 1),
  };
}

type Seed = {
  day: number;
  h: number;
  m?: number;
  mins: number;
  title: string;
  type: ClassSession["type"];
  coach?: Coach;
  module?: string;
  week?: number;
  desc?: string;
  cancelled?: boolean;
};

/** Live classes & webinars auto-record to Zoom cloud; 1:1 mentorship is private and never recorded. */
function recordingFields(type: ClassSession["type"], past: boolean, cancelled: boolean, mins: number, i: number) {
  const enabled = type !== "mentorship";
  const status: ClassSession["recordingStatus"] = !enabled || cancelled ? "off" : past ? "ready" : "scheduled";
  return {
    platform: "zoom" as const,
    recordingEnabled: enabled,
    recordingStatus: status,
    recordingDurationSec: status === "ready" ? mins * 60 - 300 - (i % 5) * 120 : null,
    recordingAvailable: status === "ready",
  };
}

export function mockSessions(now = new Date()): ClassSession[] {
  const live = new Date(now.getTime() - 22 * 60_000);
  const soon = new Date(now.getTime() + 7 * 60_000);

  const seeds: Seed[] = [
    { day: -12, h: 19, mins: 120, title: "Workflow mapping for 3 meal services", type: "live", module: "Healthcare Infrastructure", week: 4 },
    { day: -10, h: 19, mins: 120, title: "NABH for F&B: what auditors check", type: "live", module: "Compliance & Standards", week: 5 },
    { day: -8, h: 11, mins: 90, title: "Webinar: Winning hospital tenders in 2027", type: "webinar", coach: bobby, desc: "Open webinar with guest procurement heads." },
    { day: -7, h: 19, mins: 120, title: "HACCP plan, step by step", type: "live", module: "Compliance & Standards", week: 5 },
    { day: -5, h: 19, mins: 120, title: "Food safety SOPs & logs", type: "live", module: "Compliance & Standards", week: 6 },
    { day: -3, h: 19, mins: 120, title: "Licences, FSSAI and renewals", type: "live", module: "Compliance & Standards", week: 6, cancelled: false },
    { day: -2, h: 17, mins: 30, title: "Mentorship: proposal review", type: "mentorship", coach: bobby, desc: "1:1 with MD Sir on your hospital proposal." },
    { day: 1, h: 19, mins: 120, title: "Discipline class: The owner's morning", type: "live", coach: coachA, week: 7 },
    { day: 2, h: 19, mins: 120, title: "Audit simulation: NABH walkthrough", type: "live", module: "Compliance & Standards", week: 7 },
    { day: 4, h: 11, mins: 90, title: "Webinar: Pricing cost-plus contracts", type: "webinar", desc: "Live breakdown of three real contract P&Ls." },
    { day: 5, h: 19, mins: 120, title: "Rostering for 24×7 sites", type: "live", module: "Operations Management", week: 8 },
    { day: 7, h: 16, mins: 30, title: "Mentorship: site expansion plan", type: "mentorship", coach: bobby },
    { day: 8, h: 19, mins: 120, title: "Inventory & vendor management", type: "live", module: "Operations Management", week: 8 },
    { day: 9, h: 19, mins: 120, title: "Guest session: Hospital procurement", type: "live", coach: coachA, cancelled: true },
    { day: 12, h: 19, mins: 120, title: "Food-cost control dashboard", type: "live", module: "Operations Management", week: 9 },
    { day: 15, h: 19, mins: 120, title: "KPIs and monthly client reviews", type: "live", module: "Operations Management", week: 9 },
    { day: 19, h: 19, mins: 120, title: "Reading a tender like a pro", type: "live", module: "Business Development", week: 10 },
    { day: 22, h: 19, mins: 120, title: "Clinical nutrition basics", type: "live", module: "Patient Care Integration", week: 10 },
  ];

  const sessions: ClassSession[] = seeds.map((s, i) => {
    const startsAt = at(s.day, s.h, s.m ?? 0, now);
    const endsAt = new Date(startsAt.getTime() + s.mins * 60_000);
    const past = endsAt < now;
    return {
      id: 1000 + i,
      batchId: BATCH.id,
      batchName: BATCH.name,
      programTitle: PROGRAM,
      title: s.title,
      description: s.desc ?? null,
      type: s.type,
      coach: s.coach ?? bobby,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status: s.cancelled ? "cancelled" : past ? "completed" : "scheduled",
      moduleTitle: s.module ?? null,
      week: s.week ?? null,
      ...recordingFields(s.type, past, !!s.cancelled, s.mins, i),
      attended: past && !s.cancelled ? i % 5 !== 3 : null,
      attendedSec: past && !s.cancelled && i % 5 !== 3 ? Math.round(s.mins * 60 * (0.82 + (i % 4) * 0.05)) : null,
    };
  });
  // The most recent finished class is still being processed after Zoom's recording.completed webhook.
  const lastPast = [...sessions].reverse().find((x) => x.status === "completed" && x.recordingEnabled);
  if (lastPast) Object.assign(lastPast, { recordingStatus: "processing", recordingAvailable: false, recordingDurationSec: null });

  // Always have one class running and one about to open, for demoing the join flow.
  sessions.push(
    {
      id: 2001,
      batchId: BATCH.id,
      batchName: BATCH.name,
      programTitle: PROGRAM,
      title: "Live Q&A: Your compliance doubts",
      description: "Bring your NABH and HACCP questions. Open floor with MD Sir.",
      type: "live",
      coach: bobby,
      startsAt: live.toISOString(),
      endsAt: new Date(live.getTime() + 90 * 60_000).toISOString(),
      status: "live",
      moduleTitle: "Compliance & Standards",
      week: 7,
      platform: "zoom",
      recordingEnabled: true,
      recordingStatus: "recording",
      recordingDurationSec: null,
      recordingAvailable: false,
      attended: null,
      attendedSec: null,
    },
    {
      id: 2002,
      batchId: BATCH.id,
      batchName: BATCH.name,
      programTitle: PROGRAM,
      title: "Hot seat: Cost-plus pricing clinic",
      description: "Three students present a live contract. Everyone learns.",
      type: "webinar",
      coach: bobby,
      startsAt: soon.toISOString(),
      endsAt: new Date(soon.getTime() + 60 * 60_000).toISOString(),
      status: "scheduled",
      moduleTitle: "Business Development",
      week: 7,
      platform: "zoom",
      recordingEnabled: true,
      recordingStatus: "scheduled",
      recordingDurationSec: null,
      recordingAvailable: false,
      attended: null,
      attendedSec: null,
    },
  );

  return sessions.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
}

export function mockPayments(now = new Date()): PaymentSummary {
  const start = BATCH_START(now);
  const d = (days: number) => new Date(start.getTime() + days * 86_400_000).toISOString();
  return {
    total: 150000,
    gstPct: 18,
    paid: 100000,
    installments: [
      { id: 1, label: "Booking amount", dueDate: d(-9), amount: 25000, status: "paid", paidAt: d(-9), invoiceNo: "RBH/26-27/0412" },
      { id: 2, label: "Instalment 1", dueDate: d(0), amount: 25000, status: "paid", paidAt: d(-1), invoiceNo: "RBH/26-27/0458" },
      { id: 3, label: "Instalment 2", dueDate: d(30), amount: 25000, status: "paid", paidAt: d(29), invoiceNo: "RBH/26-27/0533" },
      { id: 4, label: "Instalment 3", dueDate: d(60), amount: 25000, status: "paid", paidAt: d(58), invoiceNo: "RBH/26-27/0601" },
      { id: 5, label: "Instalment 4", dueDate: new Date(now.getTime() + 4 * 86_400_000).toISOString(), amount: 25000, status: "due", paidAt: null, invoiceNo: null },
      { id: 6, label: "Instalment 5", dueDate: new Date(now.getTime() + 34 * 86_400_000).toISOString(), amount: 25000, status: "upcoming", paidAt: null, invoiceNo: null },
    ],
  };
}

export function mockAnnouncements(now = new Date()): Announcement[] {
  const ago = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
  return [
    { id: 1, title: "NABH audit checklist uploaded", body: "Download the 62-point checklist from Resources before Thursday's simulation.", createdAt: ago(5), pinned: true },
    { id: 2, title: "Offline meet-up · Delhi", body: "Batch 07 meet-up on the 14th. Register from the Events tab.", createdAt: ago(30), pinned: false },
    { id: 3, title: "Recording added", body: "\"Licences, FSSAI and renewals\" is now available in Learn.", createdAt: ago(52), pinned: false },
  ];
}
