"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useFmt, useT } from "@/components/i18n";
import type { ClassSession } from "@/lib/types";
import { cn, istDayKey } from "@/lib/utils";
import { SessionCard } from "./session-ui";
import { EmptyState } from "./ui";

/**
 * Month calendar for "My classes", designed for older students:
 * big month grid (class pills on desktop, dots on phones), tap a day → that day's classes as big cards.
 * Colours have one meaning each and are always explained by the legend and the cards' words:
 * green = attended, red = missed, dark = coming up, grey = cancelled.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
type YM = { y: number; m: number };

const ymOf = (t: number | string | Date) => {
  const [y, m] = istDayKey(t instanceof Date ? t : new Date(t)).split("-");
  return { y: Number(y), m: Number(m) - 1 };
};
const keyOf = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function tone(s: ClassSession) {
  if (s.status === "cancelled") return { pill: "bg-surface-2 text-fg-muted line-through", dot: "bg-ink-300", mark: "" };
  if (s.attended === true) return { pill: "bg-emerald-100 text-emerald-900", dot: "bg-emerald-500", mark: "✓ " };
  if (s.attended === false) return { pill: "bg-bean-100 text-bean-900", dot: "bg-bean-600", mark: "✗ " };
  if (s.type === "webinar") return { pill: "bg-amber-100 text-amber-900", dot: "bg-amber-500", mark: "" };
  if (s.type === "mentorship") return { pill: "bg-violet-100 text-violet-900", dot: "bg-violet-500", mark: "" };
  return { pill: "bg-ink-900 text-white", dot: "bg-ink-900", mark: "" };
}

export function ScheduleMonth({ sessions, serverNow, now }: { sessions: ClassSession[]; serverNow: number; now: number | null }) {
  const { t, lang } = useT();
  const { fmtTime, fmtDayLong, locale } = useFmt();
  const ref = now ?? serverNow;
  const todayKey = istDayKey(new Date(ref));

  const byDay = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    for (const s of sessions) {
      const k = istDayKey(s.startsAt);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    for (const list of map.values()) list.sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
    return map;
  }, [sessions]);

  const [month, setMonth] = useState<YM>(() => ymOf(serverNow));
  const [dir, setDir] = useState(0);
  const firstClassDay = (ym: YM) => {
    const prefix = `${ym.y}-${String(ym.m + 1).padStart(2, "0")}`;
    const keys = [...byDay.keys()].filter((k) => k.startsWith(prefix)).sort();
    return keys.find((k) => k >= todayKey) ?? keys[0] ?? null;
  };
  const [selected, setSelected] = useState<string | null>(() => (byDay.has(istDayKey(new Date(serverNow))) ? istDayKey(new Date(serverNow)) : firstClassDay(ymOf(serverNow))));

  const go = (n: number) => {
    const d = new Date(Date.UTC(month.y, month.m + n, 1));
    const ym = { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    setDir(n);
    setMonth(ym);
    setSelected(firstClassDay(ym));
  };
  const goToday = () => {
    const ym = ymOf(ref);
    setDir(ym.y * 12 + ym.m > month.y * 12 + month.m ? 1 : -1);
    setMonth(ym);
    setSelected(todayKey);
  };

  // Sunday-first grid with the neighbouring months' days greyed out.
  const first = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay();
  const daysIn = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const cells: { key: string; d: number; inMonth: boolean }[] = [];
  for (let i = 0; i < first; i++) {
    const d = new Date(Date.UTC(month.y, month.m, i - first + 1));
    cells.push({ key: keyOf(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), d: d.getUTCDate(), inMonth: false });
  }
  for (let d = 1; d <= daysIn; d++) cells.push({ key: keyOf(month.y, month.m, d), d, inMonth: true });
  while (cells.length % 7) {
    const d = new Date(Date.UTC(month.y, month.m + 1, cells.length - first - daysIn + 1));
    cells.push({ key: keyOf(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()), d: d.getUTCDate(), inMonth: false });
  }

  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(month.y, month.m, 1)));
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + i))));
  const monthCount = [...byDay.entries()].filter(([k]) => k.startsWith(`${month.y}-${String(month.m + 1).padStart(2, "0")}`)).reduce((a, [, v]) => a + v.filter((s) => s.status !== "cancelled").length, 0);
  const dayList = selected ? (byDay.get(selected) ?? []) : [];
  const L = lang === "hi" ? { classes: (n: number) => `इस महीने ${n} क्लास`, more: (n: number) => `+${n} और`, attended: "हाज़िर", missed: "छूट गई", upcoming: "आने वाली", cancelled: "रद्द", pick: "कोई दिन चुनें", noClass: "इस दिन कोई क्लास नहीं है" } : { classes: (n: number) => `${n} classes this month`, more: (n: number) => `+${n} more`, attended: "Attended", missed: "Missed", upcoming: "Coming up", cancelled: "Cancelled", pick: "Pick a day", noClass: "No class on this day" };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        {/* Month bar */}
        <div className="flex items-center gap-2 border-b border-line p-3 sm:p-4">
          <button onClick={() => go(-1)} className="grid size-12 place-items-center rounded-2xl border border-line text-fg transition-colors hover:bg-surface-2" aria-label="Previous month">
            <ChevronLeft className="size-6" />
          </button>
          <div className="min-w-0 flex-1 text-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={monthLabel} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}>
                <div className="text-xl font-bold text-fg sm:text-2xl">{monthLabel}</div>
                <div className="text-sm text-fg-muted">{L.classes(monthCount)}</div>
              </motion.div>
            </AnimatePresence>
          </div>
          <button onClick={() => go(1)} className="grid size-12 place-items-center rounded-2xl border border-line text-fg transition-colors hover:bg-surface-2" aria-label="Next month">
            <ChevronRight className="size-6" />
          </button>
          <button onClick={goToday} className="hidden min-h-12 rounded-2xl bg-ink-900 px-5 text-base font-semibold text-white transition-colors hover:bg-ink-700 sm:block">
            {t.common.today}
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-line bg-surface-2/50">
          {weekdays.map((w, i) => (
            <div key={i} className={cn("py-2.5 text-center text-xs font-semibold uppercase tracking-wide sm:text-sm", i === 0 ? "text-bean-600" : "text-fg-muted")}>
              {w}
            </div>
          ))}
        </div>

        {/* Days */}
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={`${month.y}-${month.m}`}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="grid grid-cols-7"
          >
            {cells.map(({ key, d, inMonth }, i) => {
              const list = byDay.get(key) ?? [];
              const isToday = key === todayKey;
              const isSel = key === selected;
              return (
                <button
                  key={key}
                  onClick={() => setSelected(key)}
                  aria-pressed={isSel}
                  aria-label={`${d}${list.length ? `, ${list.length}` : ""}`}
                  className={cn(
                    "group relative flex min-h-16 flex-col items-stretch gap-1 border-line p-1.5 text-left transition-colors sm:min-h-28 sm:p-2",
                    i % 7 !== 6 && "border-r",
                    i < cells.length - 7 && "border-b",
                    inMonth ? "bg-surface hover:bg-surface-2/70" : "bg-surface-2/40",
                    isSel && "bg-bean-50/70 hover:bg-bean-50",
                  )}
                >
                  {isSel && <motion.span layoutId="month-sel" transition={{ type: "spring", stiffness: 400, damping: 34 }} className="pointer-events-none absolute inset-0.5 rounded-xl ring-2 ring-bean-600" />}
                  <span
                    className={cn(
                      "relative mx-auto grid size-8 place-items-center rounded-full text-sm font-semibold tabular-nums sm:mx-0 sm:text-base",
                      isToday ? "bg-bean-600 text-white" : inMonth ? "text-fg" : "text-fg-muted/50",
                    )}
                  >
                    {d}
                  </span>
                  {/* phones: dots */}
                  {list.length > 0 && (
                    <span className="relative flex justify-center gap-1 sm:hidden">
                      {list.slice(0, 3).map((s) => (
                        <span key={s.id} className={cn("size-2 rounded-full", tone(s).dot)} />
                      ))}
                    </span>
                  )}
                  {/* tablet / desktop: pills */}
                  <span className="relative hidden flex-col gap-1 sm:flex">
                    {list.slice(0, 2).map((s) => {
                      const tn = tone(s);
                      return (
                        <span key={s.id} className={cn("truncate rounded-md px-1.5 py-0.5 text-xs font-medium leading-snug", tn.pill, !inMonth && "opacity-60")}>
                          {tn.mark}
                          <span className="tabular-nums">{fmtTime(s.startsAt).replace(/\s?(am|pm)$/i, (x) => x.trim().toLowerCase())}</span> {s.title}
                        </span>
                      );
                    })}
                    {list.length > 2 && <span className="px-1 text-xs font-semibold text-fg-muted">{L.more(list.length - 2)}</span>}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-line px-4 py-3 text-sm text-fg">
          {[
            ["bg-emerald-500", `✓ ${L.attended}`],
            ["bg-bean-600", `✗ ${L.missed}`],
            ["bg-ink-900", L.upcoming],
            ["bg-ink-300", L.cancelled],
          ].map(([c, label]) => (
            <span key={label} className="inline-flex items-center gap-2">
              <span className={cn("size-3.5 rounded-full", c)} /> {label}
            </span>
          ))}
        </div>
      </section>

      {/* Selected day */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-fg">{selected ? (selected === todayKey ? `${t.common.today} · ` : "") + fmtDayLong(`${selected}T12:00:00+05:30`) : L.pick}</h2>
          <button onClick={goToday} className="min-h-11 rounded-full border border-line px-4 text-sm font-semibold text-fg sm:hidden">
            {t.common.today}
          </button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={selected ?? "none"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }} className="space-y-3">
            {dayList.length ? dayList.map((s, i) => <SessionCard key={s.id} session={s} index={i} />) : <EmptyState icon={CalendarDays} title={selected ? L.noClass : L.pick} />}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
