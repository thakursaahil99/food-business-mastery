import "server-only";
import type { BusinessAnalytics, LearningAnalytics, StudentProfile, StudentRow } from "../types";
import { mockAdminPayments, mockStudents } from "./mock-admin";
import { mockModules, mockSessions } from "./mock";
import { adminAssignments, allDoubts } from "./mock-store";
import { curriculum } from "@/content/site";

/**
 * Admin analytics computed from the same mock data the portals use, so numbers agree across screens.
 * With the API these come from GET /admin/analytics/business, /admin/analytics/learning, /admin/students/{id}.
 */

const DAY = 86_400_000;
const seeded = (n: number) => {
  const x = Math.sin(n * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

export function businessAnalytics(now = new Date()): BusinessAnalytics {
  const students = mockStudents(now);
  const payments = mockAdminPayments(now);

  const months: { label: string; value: number }[] = [];
  const base = [620000, 540000, 780000, 910000, 1185000, 1420000, 980000, 1760000, 2135000, 1890000, 2240000, 2075000];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleString("en-IN", { month: "short" }), value: base[11 - i]! });
  }

  const sources = ["Website", "Instagram", "YouTube", "Referral", "WhatsApp", "Webinar"];
  const leadVolume = [148, 96, 71, 42, 33, 22];
  const convPct = [14, 9, 12, 38, 21, 27];
  const leadsBySource = sources.map((s, i) => ({ label: s, value: leadVolume[i]!, note: `${convPct[i]}% enrolled` }));
  const totalLeads = leadVolume.reduce((a, b) => a + b, 0);
  const enrolled = leadVolume.reduce((a, v, i) => a + Math.round((v * convPct[i]!) / 100), 0);

  const dues = students
    .filter((s) => s.status !== "cancelled" && s.paid < s.total && s.nextDue)
    .map((s) => ({
      studentId: s.id,
      name: s.name,
      batch: s.batchName.split(" · ")[0]!,
      amount: 25000,
      dueDate: s.nextDue!,
      daysOverdue: Math.max(0, Math.floor((now.getTime() - +new Date(s.nextDue!)) / DAY)),
    }))
    .sort((a, b) => b.daysOverdue - a.daysOverdue || +new Date(a.dueDate) - +new Date(b.dueDate));

  const captured = payments.filter((p) => p.status === "captured");
  const methods = ["UPI", "Card", "Netbanking", "EMI"] as const;
  const methodShare = [58, 17, 11, 14];

  return {
    revenueFY: months.slice(-8).reduce((a, m) => a + m.value, 0),
    collectedThisMonth: months.at(-1)!.value,
    outstanding: students.filter((s) => s.status !== "cancelled").reduce((a, s) => a + (s.total - s.paid), 0),
    overdueCount: dues.filter((d) => d.daysOverdue > 0).length,
    avgFeePerStudent: Math.round(captured.reduce((a, p) => a + p.amount, 0) / Math.max(1, new Set(captured.map((p) => p.studentName)).size)),
    leadConversionPct: Math.round((enrolled / totalLeads) * 100),
    refundPct: Math.round((payments.filter((p) => p.status === "refunded").length / payments.length) * 100),
    revenueByMonth: months,
    leadsBySource,
    revenueByBatch: [
      { label: "Batch 08 · Jan 2027", value: 29 * 25000, note: "advance bookings" },
      { label: "Batch 07 · Oct 2026", value: 34 * 112000 },
      { label: "Batch 06 · Jun 2026", value: 38 * 135000 },
    ],
    paymentMethods: methods.map((m, i) => ({ label: m, value: methodShare[i]!, note: `${methodShare[i]}%` })),
    dues,
  };
}

export function learningAnalytics(now = new Date()): LearningAnalytics {
  const students = mockStudents(now).filter((s) => s.batchName.startsWith("Batch 07") && s.status !== "cancelled");
  const modules = mockModules(now);
  const assignments = adminAssignments(now);
  const doubts = allDoubts(now);
  const sessions = mockSessions(now).filter((s) => s.status === "completed");

  const weeks = Array.from(new Set(sessions.filter((s) => s.week).map((s) => s.week!))).sort((a, b) => a - b);
  const attendanceByWeek = (weeks.length ? weeks : [1, 2, 3, 4, 5, 6]).map((w, i) => ({ label: `W${w}`, value: Math.round(94 - i * 2.5 - seeded(w) * 6) }));

  const moduleCompletion = modules.map((m, i) => {
    const unlocked = m.lessons.filter((l) => !l.locked).length;
    const pct = unlocked === 0 ? 0 : Math.round((m.lessons.filter((l) => l.completed).length / m.lessons.length) * 100 * (0.85 + seeded(i) * 0.15));
    return { label: curriculum[i]?.title ?? m.title, value: pct };
  });

  const lessons = modules.flatMap((m) => m.lessons.filter((l) => !l.locked).map((l) => ({ l, m })));
  const lessonDropoff = lessons
    .map(({ l }, i) => ({ label: l.title, value: Math.round(97 - i * 3.4 - seeded(l.id) * 14), note: "finished" }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 6)
    .map((b) => ({ ...b, note: `${b.value}% finished` }));

  const homeworkSubmission = assignments
    .filter((a) => +new Date(a.dueAt) < now.getTime() + 3 * DAY)
    .map((a) => {
      const closed = +new Date(a.dueAt) < now.getTime();
      const value = Math.round(closed ? 72 + seeded(a.id) * 24 : 25 + seeded(a.id) * 30);
      return { label: a.title, value, note: `${value}% submitted` };
    });
  const scored = assignments.flatMap((a) => a.submissions.filter((s) => s.score !== null).map((s) => s.score! / a.maxScore));

  const answered = doubts.filter((d) => d.answer);
  const avgAnswerHours = answered.length ? Math.round(answered.reduce((a, d) => a + (+new Date(d.answer!.at) - +new Date(d.createdAt)) / 3_600_000, 0) / answered.length) : 0;

  const atRisk = students
    .filter((s) => s.attendancePct < 75 || s.progressPct < 35)
    .map((s) => ({
      studentId: s.id,
      name: s.name,
      batch: s.batchName.split(" · ")[0]!,
      attendancePct: s.attendancePct,
      progressPct: s.progressPct,
      reason: s.attendancePct < 75 && s.progressPct < 35 ? "Low attendance and behind on lessons" : s.attendancePct < 75 ? "Attendance below 75%" : "Behind on lessons",
    }))
    .sort((a, b) => a.attendancePct + a.progressPct - (b.attendancePct + b.progressPct));

  return {
    avgProgress: Math.round(students.reduce((a, s) => a + s.progressPct, 0) / students.length),
    avgAttendance: Math.round(students.reduce((a, s) => a + s.attendancePct, 0) / students.length),
    submissionRate: Math.round(homeworkSubmission.reduce((a, b) => a + b.value, 0) / Math.max(1, homeworkSubmission.length)),
    avgScore: scored.length ? Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 100) : 0,
    openDoubts: doubts.filter((d) => d.status === "open").length,
    avgAnswerHours,
    attendanceByWeek,
    moduleCompletion,
    lessonDropoff,
    homeworkSubmission,
    atRisk,
  };
}

const cities = ["Delhi", "Mumbai", "Pune", "Bengaluru", "Hyderabad", "Ahmedabad", "Jaipur", "Lucknow", "Chandigarh", "Indore"];
const businesses = ["Hospital canteen", "Corporate cafeteria", "Industrial canteen", "Institutional catering", "Starting a new business"];

export function studentProfile(id: number, now = new Date()): StudentProfile | null {
  const student: StudentRow | undefined = mockStudents(now).find((s) => s.id === id);
  if (!student) return null;
  const r = (k: number) => seeded(id * 31 + k);
  const sessions = mockSessions(now).filter((s) => s.type !== "mentorship" && s.status !== "cancelled" && +new Date(s.startsAt) < now.getTime());
  const attendRate = student.attendancePct / 100;

  const attendance = sessions.map((s, i) => {
    const dur = (+new Date(s.endsAt) - +new Date(s.startsAt)) / 1000;
    const ended = +new Date(s.endsAt) < now.getTime();
    const attended = !ended ? null : r(i + 10) < attendRate;
    return { id: s.id, title: s.title, startsAt: s.startsAt, attended, attendedSec: attended ? Math.round(dur * (0.7 + r(i + 40) * 0.3)) : null, durationSec: dur };
  });

  const modules = mockModules(now).map((m, i) => {
    const total = m.lessons.length;
    const unlocked = m.lessons.filter((l) => !l.locked).length;
    const done = Math.min(unlocked, Math.round(unlocked * (student.progressPct / 100) * (1.2 - r(i) * 0.3)));
    return { title: m.title, done, total };
  });

  const homework = adminAssignments(now).map((a, i) => {
    const due = +new Date(a.dueAt);
    const past = due < now.getTime();
    const submitted = r(i + 70) < attendRate + 0.05;
    const status: StudentProfile["homework"][number]["status"] = !submitted ? (past ? "missing" : "open") : past && r(i + 80) < 0.7 ? "reviewed" : "submitted";
    return { title: a.title, status, score: status === "reviewed" ? Math.round(a.maxScore * (0.55 + r(i + 90) * 0.45)) : null, maxScore: a.maxScore, dueAt: a.dueAt };
  });
  const reviewed = homework.filter((h) => h.score !== null);

  const paidCount = Math.round(student.paid / 25000);
  const payments = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(+new Date(student.joinedAt) + i * 30 * DAY).toISOString();
    const status: StudentProfile["payments"][number]["status"] = i < paidCount ? "paid" : i === paidCount ? (+new Date(student.nextDue ?? date) < now.getTime() ? "overdue" : "due") : "upcoming";
    return { label: i === 0 ? "Booking amount" : `Instalment ${i}`, amount: 25000, status, date: i === paidCount && student.nextDue ? student.nextDue : date };
  });

  const weeklyWatchMin = Array.from({ length: 8 }, (_, i) => ({ label: `W${i + 1}`, value: Math.round(40 + r(i + 120) * 140 * attendRate) }));

  return {
    student,
    city: cities[id % cities.length]!,
    businessType: businesses[id % businesses.length]!,
    lastActiveAt: new Date(now.getTime() - Math.round(r(5) * 72) * 3_600_000).toISOString(),
    watchTimeSec: weeklyWatchMin.reduce((a, w) => a + w.value, 0) * 60,
    loginsLast7d: Math.round(2 + r(6) * 9 * attendRate),
    homeworkAvgPct: reviewed.length ? Math.round((reviewed.reduce((a, h) => a + h.score! / h.maxScore, 0) / reviewed.length) * 100) : null,
    attendance,
    modules,
    homework,
    doubts: allDoubts(now)
      .filter((_, i) => r(i + 200) < 0.35)
      .slice(0, 3)
      .map((d) => ({ subject: d.subject, status: d.status, createdAt: d.createdAt })),
    payments,
    weeklyWatchMin,
  };
}
