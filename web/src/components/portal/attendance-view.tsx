"use client";

import { PageHeader } from "./ui";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Flame, Timer, XCircle, CalendarCheck } from "lucide-react";
import type { ClassSession } from "@/lib/types";
import { cn, istDayKey, secondsLabel } from "@/lib/utils";
import { useNow } from "./shell";
import { ProgressRing, TypeChip } from "./session-ui";
import { MonthCalendar, istYM, type DayTone, type YM } from "./month-calendar";
import { useT, useFmt } from "@/components/i18n";

const EASE = [0.16, 1, 0.3, 1] as const;

type Mark = "present" | "absent" | "pending" | "upcoming";
const markUi: Record<Mark, { label: string; icon: typeof Clock; pill: string; dot: string }> = {
  present: { label: "Present", icon: CheckCircle2, pill: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  absent: { label: "Absent", icon: XCircle, pill: "bg-bean-50 text-bean-700", dot: "bg-bean-500" },
  pending: { label: "Being marked", icon: Clock, pill: "bg-amber-50 text-amber-800", dot: "bg-amber-500" },
  upcoming: { label: "Upcoming", icon: Clock, pill: "bg-surface-2 text-fg-muted", dot: "bg-ink-300" },
};

export function AttendanceView({ sessions, serverNow }: { sessions: ClassSession[]; serverNow: number }) {
  const { fmtDate, fmtTime } = useFmt();
  const T = useT().t.attendance;
  const label = (m: Mark) => (m === "present" ? T.present : m === "absent" ? T.absent : m === "pending" ? T.pending : T.upcoming);
  const now = useNow(60_000) ?? serverNow;
  const [month, setMonth] = useState<YM>(() => istYM(serverNow));
  const [day, setDay] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      sessions
        .filter((s) => s.status !== "cancelled")
        .map((s) => {
          const ended = +new Date(s.endsAt) <= now;
          const mark: Mark = !ended ? "upcoming" : s.attended === true ? "present" : s.attended === false ? "absent" : "pending";
          return { s, mark, key: istDayKey(s.startsAt) };
        }),
    [sessions, now],
  );

  const present = rows.filter((r) => r.mark === "present").length;
  const absent = rows.filter((r) => r.mark === "absent").length;
  const remaining = rows.filter((r) => r.mark === "upcoming").length;
  const pct = present + absent ? Math.round((present / (present + absent)) * 100) : 0;
  const marked = rows.filter((r) => r.mark === "present" || r.mark === "absent").sort((a, b) => +new Date(b.s.startsAt) - +new Date(a.s.startsAt));
  const streak = marked.findIndex((r) => r.mark !== "present");
  const streakN = streak === -1 ? marked.length : streak;
  const timeIn = rows.reduce((a, r) => a + (r.s.attendedSec ?? 0), 0);

  const dots = useMemo(() => {
    const d: Record<string, string[]> = {};
    rows.forEach((r) => (d[r.key] = [...(d[r.key] ?? []), markUi[r.mark].dot]));
    return d;
  }, [rows]);

  /** Whole-day colour: red if any class that day was missed, green if attended, amber while marking, outline if upcoming. */
  const tones = useMemo(() => {
    const out: Record<string, DayTone> = {};
    const rank: Record<Mark, number> = { absent: 3, pending: 2, present: 1, upcoming: 0 };
    const tone: Record<Mark, DayTone> = { absent: "bad", pending: "warn", present: "good", upcoming: "upcoming" };
    const worst: Record<string, Mark> = {};
    rows.forEach((r) => {
      if (!worst[r.key] || rank[r.mark] > rank[worst[r.key]!]) worst[r.key] = r.mark;
    });
    for (const [k, m] of Object.entries(worst)) out[k] = tone[m];
    return out;
  }, [rows]);
  const toneLabels: Record<DayTone, string> = { good: T.present, bad: T.absent, warn: T.pending, upcoming: T.upcoming };
  const legend: { tone: DayTone; cls: string }[] = [
    { tone: "good", cls: "bg-emerald-500" },
    { tone: "bad", cls: "bg-bean-600" },
    { tone: "warn", cls: "bg-amber-400" },
    { tone: "upcoming", cls: "bg-surface ring-2 ring-inset ring-line-strong" },
  ];

  const history = rows
    .filter((r) => (day ? r.key === day : r.mark !== "upcoming" || +new Date(r.s.startsAt) - now < 3 * 86_400_000))
    .sort((a, b) => +new Date(b.s.startsAt) - +new Date(a.s.startsAt));

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarCheck} title={T.title} sub={<>{T.sub}</>} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="rounded-2xl border border-line bg-surface p-6">
          <div className="flex items-center gap-6">
            <ProgressRing value={pct} size={128} stroke={11}>
              <div>
                <div className="text-3xl font-bold text-fg">{pct}%</div>
                <div className="text-sm text-fg-muted">{T.overall}</div>
              </div>
            </ProgressRing>
            <ul className="space-y-3 text-base">
              {[
                ["present", present],
                ["absent", absent],
                ["upcoming", remaining],
              ].map(([m, n]) => {
                const ui = markUi[m as Mark];
                return (
                  <li key={m} className="flex items-center gap-2.5">
                    <span className={cn("grid size-8 place-items-center rounded-xl", ui.pill)}>
                      <ui.icon className="size-4" />
                    </span>
                    <span>
                      <span className="block font-semibold tabular-nums text-fg">{n}</span>
                      <span className="text-sm text-fg-muted">{m === "upcoming" ? T.remaining : label(m as Mark)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line pt-5">
            <div className="rounded-2xl bg-surface-2 p-3.5">
              <Flame className="size-4 text-bean-500" />
              <div className="mt-2 text-xl font-bold text-fg">{streakN}</div>
              <div className="text-sm text-fg-muted">{T.streak}</div>
            </div>
            <div className="rounded-2xl bg-surface-2 p-3.5">
              <Timer className="size-4 text-bean-500" />
              <div className="mt-2 text-xl font-bold text-fg">{secondsLabel(timeIn)}</div>
              <div className="text-sm text-fg-muted">{T.timeIn}</div>
            </div>
          </div>
          {pct < 75 && present + absent > 0 && <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2.5 text-base text-amber-900">{T.need75}</p>}
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08, ease: EASE }} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <MonthCalendar month={month} onMonthChange={setMonth} dots={dots} tones={tones} toneLabels={toneLabels} todayKey={istDayKey(new Date(now))} selected={day} onSelect={setDay} />
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-3 text-base text-fg sm:flex sm:flex-wrap">
            {legend.map(({ tone, cls }) => (
              <span key={tone} className="inline-flex items-center gap-2">
                <span className={cn("size-5 rounded-md", cls)} /> {toneLabels[tone]}
              </span>
            ))}
          </div>
        </motion.section>
      </div>

      <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.14, ease: EASE }} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">{day ? T.onDay(fmtDate(`${day}T12:00:00+05:30`)) : T.history}</h2>
          {day && (
            <button onClick={() => setDay(null)} className="min-h-11 rounded-full border border-line px-4 text-base font-medium text-bean-700">
              {T.showAll}
            </button>
          )}
        </div>
        <ul className="mt-4 space-y-2">
          <AnimatePresence initial={false} mode="popLayout">
            {history.map(({ s, mark }) => {
              const ui = markUi[mark];
              const total = (+new Date(s.endsAt) - +new Date(s.startsAt)) / 1000;
              return (
                <motion.li key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3 rounded-2xl border border-line px-4 py-3">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", ui.pill)}>
                    <ui.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-medium leading-snug text-fg">{s.title}</div>
                    <div className="text-sm text-fg-muted">
                      {fmtDate(s.startsAt)} · {fmtTime(s.startsAt)}
                      {s.attendedSec ? ` · ${T.inClass(secondsLabel(s.attendedSec), secondsLabel(total))}` : ""}
                    </div>
                  </div>
                  <span className="hidden sm:block">
                    <TypeChip type={s.type} />
                  </span>
                  <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", ui.pill)}>
                    <ui.icon className="size-4" /> {label(mark)}
                  </span>
                </motion.li>
              );
            })}
          </AnimatePresence>
          {history.length === 0 && <li className="py-8 text-center text-base text-fg-muted">{T.noneDay}</li>}
        </ul>
      </motion.section>
    </div>
  );
}
