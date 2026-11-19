import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView, type TodoItem } from "@/components/portal/dashboard-view";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getAnnouncements, getAssignments, getEnrollment, getModules, getPayments, getRequestTime, getSchedule, requireUser } from "@/lib/api/data";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="dashboard" />}>
        <Dashboard />
      </Suspense>
    </PageTransition>
  );
}

async function Dashboard() {
  const user = await requireUser();
  const [enrollment, sessions, payments, modules, announcements, assignments, serverNow] = await Promise.all([
    getEnrollment(),
    getSchedule(),
    getPayments(),
    getModules(),
    getAnnouncements(),
    getAssignments(),
    getRequestTime(),
  ]);
  const lessons = modules.flatMap((m) => m.lessons);
  const nextDue = payments.installments.find((i) => i.status === "due" || i.status === "overdue" || i.status === "upcoming") ?? null;

  // "What should I do next?" — at most 4 plain-language items, most urgent first.
  const todos: TodoItem[] = [];
  const resume = lessons.find((l) => !l.completed && !l.locked && l.watchedSec > 0) ?? lessons.find((l) => !l.completed && !l.locked);
  if (resume) todos.push({ kind: "lesson", title: resume.watchedSec ? `Finish watching: ${resume.title}` : `Watch: ${resume.title}`, href: `/student/learn/${resume.id}` });
  for (const a of assignments.filter((x) => !x.submission).sort((x, y) => +new Date(x.dueAt) - +new Date(y.dueAt)).slice(0, 2)) {
    todos.push({ kind: "homework", title: `Submit homework: ${a.title}`, dueAt: a.dueAt, overdue: +new Date(a.dueAt) < serverNow, href: "/student/assignments" });
  }
  const week = 7 * 86_400_000;
  for (const r of sessions.filter((x) => x.recordingStatus === "ready" && serverNow - +new Date(x.startsAt) < week && !x.attendedSec).slice(-1)) {
    todos.push({ kind: "recording", title: `Missed class? Watch: ${r.title}`, href: `/student/learn?session=${r.id}` });
  }

  return (
    <DashboardView
      todos={todos.slice(0, 4)}
      userName={user.name}
      enrollment={enrollment}
      sessions={sessions}
      nextDue={nextDue}
      lessonsDone={lessons.filter((l) => l.completed).length}
      lessonsTotal={lessons.length}
      announcements={announcements}
      serverNow={serverNow}
    />
  );
}
