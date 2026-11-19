"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, ArrowUpRight, BookOpenCheck, CalendarClock, ClipboardList, Megaphone, Pin, PlayCircle, Target, Video, Wallet } from "lucide-react";
import { getJoinState } from "@/lib/join-window";
import type { Announcement, ClassSession, Enrollment, Installment } from "@/lib/types";
import { cn, durationLabel, formatINR } from "@/lib/utils";
import { Greeting, useNow } from "./shell";
import { useT, useFmt } from "@/components/i18n";
import { AddToCalendar, Countdown, ProgressRing, SessionAction, TypeChip, dayHeading } from "./session-ui";
import { curriculum } from "@/content/site";

const EASE = [0.16, 1, 0.3, 1] as const;

/** One "what to do next" row on the dashboard, built server-side in app/student/page.tsx. */
export type TodoItem = {
  kind: "lesson" | "homework" | "recording";
  title: string;
  href: string;
  dueAt?: string;
  overdue?: boolean;
};
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

export function DashboardView({
  todos = [],
  userName,
  enrollment,
  sessions,
  nextDue,
  lessonsDone,
  lessonsTotal,
  announcements,
  serverNow,
}: {
  todos?: TodoItem[];
  userName: string;
  enrollment: Enrollment;
  sessions: ClassSession[];
  nextDue: Installment | null;
  lessonsDone: number;
  lessonsTotal: number;
  announcements: Announcement[];
  serverNow: number;
}) {
  const { fmtDate, fmtDayLong, fmtTime, fmtDay, locale } = useFmt();
  const { t } = useT();
  const dayL = { today: t.common.today, tomorrow: t.common.tomorrow, yesterday: t.common.yesterday, fmtDay };
  const H = t.home;
  const now = useNow();
  const ref = now ?? serverNow;
  const upcoming = sessions.filter((s) => s.status !== "cancelled" && +new Date(s.endsAt) > ref);
  const next = upcoming[0];
  const later = upcoming.slice(1, 5);
  const js = next && now ? getJoinState(next, now) : null;

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }} className="space-y-6">
      <motion.div variants={item} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-fg-muted">
            {enrollment.program.title} · {enrollment.batch.name}
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold tracking-tight text-fg sm:text-4xl">
            <Greeting name={userName} />
          </h1>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-surface px-4 py-2 text-sm sm:self-auto">
          <span className="size-2 rounded-full bg-emerald-500" />
          {H.week(enrollment.currentWeek, enrollment.program.durationWeeks)}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Next class */}
        <motion.section variants={item} className="relative overflow-hidden rounded-[28px] bg-ink-950 p-6 text-white grain sm:p-8 lg:col-span-2">
          <div aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-bean-600/40 blur-3xl" />
          {next ? (
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-white/65">{js?.state === "open" && js.live ? H.happeningNow : H.nextUp}</span>
                <TypeChip type={next.type} />
              </div>
              <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{next.title}</h2>
              <p className="mt-2 text-base text-white/70">
                {next.coach.name} · {dayHeading(next.startsAt, now, dayL)}, {fmtTime(next.startsAt)} IST · {durationLabel(next.startsAt, next.endsAt)}
              </p>

              <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
                <div>
                  {js?.state === "upcoming" ? (
                    <>
                      <div className="text-sm text-white/65">{H.startsIn}</div>
                      <Countdown ms={+new Date(next.startsAt) - ref} className="mt-1 text-4xl font-bold sm:text-5xl" />
                    </>
                  ) : js?.state === "open" ? (
                    <>
                      <div className="text-sm text-white/65">{js.live ? H.liveFor : H.startsIn}</div>
                      <Countdown ms={Math.abs(ref - +new Date(next.startsAt))} className="mt-1 text-4xl font-semibold text-white sm:text-5xl" />
                    </>
                  ) : (
                    <div className="h-14 w-48 animate-pulse rounded-xl bg-white/5" />
                  )}
                </div>
                <div className="flex items-center gap-2 [&_.border-line]:border-white/15">
                  <SessionAction session={next} js={js} size="lg" invert />
                  {js?.state === "upcoming" && <AddToCalendar session={next} />}
                </div>
              </div>
            </div>
          ) : (
            <div className="relative py-10 text-white/60">{H.noClasses}</div>
          )}
        </motion.section>

        {/* Progress */}
        <motion.section variants={item} className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-6 text-center">
          <ProgressRing value={enrollment.progressPct} size={148} stroke={12} />
          <h3 className="mt-5 text-lg font-semibold text-fg">{H.progress}</h3>
          <p className="mt-1 text-sm text-fg-muted">
            {H.lessonsDone(lessonsDone, lessonsTotal)}
          </p>
          <Link href="/student/learn" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-bean-600 hover:underline">
            {H.continueLearning} <ArrowUpRight className="size-4" />
          </Link>
        </motion.section>
      </div>

      {todos.length > 0 && <TodoCard items={todos} />}

      {/* Stat tiles */}
      <motion.div variants={item} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat dark icon={Target} label={H.attendance} value={`${enrollment.attendancePct}%`} hint={H.last4} bar={enrollment.attendancePct} />
        <Stat icon={BookOpenCheck} label={H.lessons} value={`${lessonsDone}/${lessonsTotal}`} hint={H.recordedLive} bar={(lessonsDone / lessonsTotal) * 100} />
        <Stat icon={CalendarClock} label={H.classesWeek} value={String(upcoming.filter((s) => +new Date(s.startsAt) - ref < 7 * 86_400_000).length)} hint={H.next7} />
        <Stat
          icon={Wallet}
          label={H.nextFee}
          value={nextDue ? formatINR(nextDue.amount) : H.allPaid}
          hint={nextDue ? H.due(fmtDate(nextDue.dueDate)) : H.thanks}
          href="/student/payments"
          tone={nextDue?.status === "due" || nextDue?.status === "overdue" ? "warn" : undefined}
        />
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <motion.section variants={item} className="rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-fg">{H.comingUp}</h3>
            <Link href="/student/schedule" className="text-sm font-medium text-bean-600 hover:underline">
              {H.fullSchedule}
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {later.map((s) => (
              <li key={s.id} className="flex items-center gap-4 py-3.5">
                <div className="w-14 shrink-0 text-center">
                  <div className="text-xs font-medium uppercase text-fg-muted">{new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "Asia/Kolkata" }).format(new Date(s.startsAt))}</div>
                  <div className="text-xl font-bold text-fg">{new Intl.DateTimeFormat(locale, { day: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(s.startsAt))}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{s.title}</div>
                  <div className="truncate text-xs text-fg-muted">
                    {fmtTime(s.startsAt)} · {s.coach.name}
                  </div>
                </div>
                <span className="hidden sm:inline-flex"><TypeChip type={s.type} /></span>
              </li>
            ))}
            {later.length === 0 && <li className="py-6 text-sm text-fg-muted">{H.nothingElse}</li>}
          </ul>
        </motion.section>

        <motion.section variants={item} className="rounded-2xl border border-line bg-surface p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-fg">
            <Megaphone className="size-5 text-bean-600" /> {H.announcements}
          </h3>
          <ul className="mt-4 space-y-3">
            {announcements.map((a) => (
              <li key={a.id} className={cn("rounded-2xl p-4", a.pinned ? "bg-bean-50" : "bg-surface-2")}>
                <div className="flex items-center gap-2 text-sm font-medium text-fg">
                  {a.pinned && <Pin className="size-3.5 text-bean-600" />}
                  {a.title}
                </div>
                <p className="mt-1 text-sm text-fg-muted">{a.body}</p>
                <p className="mt-2 text-[11px] text-fg-muted/70">{fmtDayLong(a.createdAt)}</p>
              </li>
            ))}
          </ul>
        </motion.section>
      </div>

      {/* Journey */}
      <motion.section variants={item} className="overflow-hidden rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-fg">{H.journey}</h3>
          <span className="text-sm text-fg-muted">{curriculum[Math.min(3, Math.floor((enrollment.currentWeek - 1) / 4))]?.title}</span>
        </div>
        <div className="mt-6 grid grid-cols-16 gap-1.5" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
          {Array.from({ length: 16 }, (_, i) => {
            const w = i + 1;
            const state = w < enrollment.currentWeek ? "done" : w === enrollment.currentWeek ? "now" : "next";
            return (
              <div key={w} className="group relative">
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.4 + i * 0.035, duration: 0.6, ease: EASE }}
                  className={cn("h-12 origin-bottom rounded-lg", state === "done" ? "bg-ink-300" : state === "now" ? "bg-bean-600" : "bg-surface-2 ring-1 ring-inset ring-line")}
                />
                <div className={cn("mt-1.5 text-center text-[10px] tabular-nums", state === "now" ? "font-semibold text-bean-600" : "text-fg-muted")}>{w}</div>

              </div>
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-4 text-[11px] text-fg-muted">
          {curriculum.slice(0, 4).map((c) => (
            <span key={c.title} className="truncate pr-2">
              {c.tag}
            </span>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
}

/** Same tile as the admin console's KPI row: icon chip, big number, label · hint. One dark tile per row. */
function Stat({ icon: Icon, label, value, hint, bar, href, tone, dark }: { icon: typeof Target; label: string; value: string; hint: string; bar?: number; href?: string; tone?: "warn"; dark?: boolean }) {
  const body = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-[22px] border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgb(0_0_0/0.35)]",
        dark ? "border-ink-800 bg-ink-950 text-white grain" : tone === "warn" ? "border-amber-300 bg-surface" : "border-line bg-surface",
      )}
    >
      {dark && <div aria-hidden className="absolute -right-10 -top-10 size-36 rounded-full bg-bean-600/40 blur-2xl" />}
      <div className="relative flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl", dark ? "bg-white/10 text-bean-300" : tone === "warn" ? "bg-amber-100 text-amber-700" : "bg-surface-2 text-fg")}>
          <Icon className="size-4" />
        </span>
        {href && <ArrowUpRight className={cn("size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5", dark ? "text-white/50" : "text-fg-muted")} />}
      </div>
      <div className={cn("font-display relative mt-4 text-3xl font-bold tracking-tight", dark ? "text-white" : "text-fg")}>{value}</div>
      <div className={cn("relative mt-0.5 text-sm", dark ? "text-white/55" : "text-fg-muted")}>
        {label} · {hint}
      </div>
      {bar !== undefined && (
        <div className={cn("relative mt-3 h-1.5 overflow-hidden rounded-full", dark ? "bg-white/10" : "bg-surface-2")}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${bar}%` }} transition={{ duration: 0.8, ease: EASE }} className="h-full rounded-full bg-gradient-to-r from-bean-400 to-bean-600" />
        </div>
      )}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

const todoMeta = {
  lesson: { icon: PlayCircle, cls: "bg-bean-50 text-bean-600", cta: "Watch" },
  homework: { icon: ClipboardList, cls: "bg-amber-50 text-amber-700", cta: "Open" },
  recording: { icon: Video, cls: "bg-sky-50 text-sky-700", cta: "Watch" },
} as const;

/** Big, plain-language "what to do next" list. Every row is one large tap target. */
function TodoCard({ items }: { items: TodoItem[] }) {
  const { fmtDate } = useFmt();
  const H = useT().t.home;
  const cta = { lesson: H.ctaLesson, homework: H.ctaHomework, recording: H.ctaRecording } as const;
  return (
    <motion.section variants={item} className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="px-5 pb-2 pt-5 sm:px-6">
        <h3 className="text-xl font-semibold text-fg">{H.todo}</h3>
        <p className="text-base text-fg-muted">
          {H.todoCount(items.length)}
        </p>
      </div>
      <ul>
        {items.map((t) => {
          const m = todoMeta[t.kind];
          const Icon = m.icon;
          return (
            <li key={t.href + t.title} className="border-t border-line first:border-t-0">
              <Link href={t.href} className="group flex min-h-16 items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2 sm:px-6">
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", m.cls)}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium leading-snug text-fg">{t.title}</span>
                  {t.dueAt && (
                    <span className={cn("mt-0.5 block text-sm", t.overdue ? "font-medium text-bean-600" : "text-fg-muted")}>
                      {t.overdue ? H.late : H.due(fmtDate(t.dueAt))}
                    </span>
                  )}
                </span>
                <span className="hidden shrink-0 items-center gap-1 text-base font-semibold text-bean-600 sm:inline-flex">
                  {cta[t.kind]} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                <ArrowRight className="size-5 shrink-0 text-fg-muted sm:hidden" />
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}
