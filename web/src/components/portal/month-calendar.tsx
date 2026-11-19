"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFmt } from "@/components/i18n";

export type YM = { y: number; m: number }; // m: 0-11
export type DayTone = "good" | "bad" | "warn" | "upcoming";

const TONE: Record<DayTone, string> = {
  good: "bg-emerald-500 text-white hover:bg-emerald-600",
  bad: "bg-bean-600 text-white hover:bg-bean-700",
  warn: "bg-amber-400 text-ink-950 hover:bg-amber-500",
  upcoming: "bg-surface text-fg ring-2 ring-inset ring-line-strong hover:bg-surface-2",
};
export const keyOf = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/** Year/month of an instant in IST. */
export function istYM(t: number | string): YM {
  const [y, m] = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).format(new Date(t)).split("-");
  return { y: Number(y), m: Number(m) - 1 };
}

/**
 * Month grid with coloured dots per day. Dots are never the only signal:
 * pages pair this with a labelled list and a legend.
 */
export function MonthCalendar({
  month,
  onMonthChange,
  dots,
  tones,
  toneLabels,
  todayKey,
  selected,
  onSelect,
}: {
  month: YM;
  onMonthChange: (ym: YM) => void;
  dots: Record<string, string[]>;
  /** Whole-day colour (green = good, red = bad…). Pages must also show a labelled legend/list. */
  tones?: Record<string, DayTone>;
  toneLabels?: Record<DayTone, string>;
  todayKey: string;
  selected: string | null;
  onSelect: (key: string | null) => void;
}) {
  const { locale } = useFmt();
  const weekdays = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 7 + i))));
  const first = new Date(Date.UTC(month.y, month.m, 1)).getUTCDay(); // 0 = Sun
  const days = new Date(Date.UTC(month.y, month.m + 1, 0)).getUTCDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const label = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(month.y, month.m, 1)));
  const shift = (n: number) => {
    const d = new Date(Date.UTC(month.y, month.m + n, 1));
    onMonthChange({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <button onClick={() => shift(-1)} className="grid size-9 place-items-center rounded-xl text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Previous month">
          <ChevronLeft className="size-5" />
        </button>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={label} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }} className="font-semibold text-fg">
            {label}
          </motion.div>
        </AnimatePresence>
        <button onClick={() => shift(1)} className="grid size-9 place-items-center rounded-xl text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Next month">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="mt-4 grid grid-cols-7 text-center text-[11px] font-medium text-fg-muted">
        {weekdays.map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={label} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const k = keyOf(month.y, month.m, d);
            const marks = dots[k] ?? [];
            const tone = tones?.[k];
            const isToday = k === todayKey;
            const isSel = k === selected;
            return (
              <button
                key={k}
                onClick={() => onSelect(isSel ? null : k)}
                disabled={!marks.length && !isToday}
                aria-pressed={isSel}
                aria-label={`${d} ${label}${tone && toneLabels ? `, ${toneLabels[tone]}` : marks.length ? `, ${marks.length} session${marks.length > 1 ? "s" : ""}` : ""}`}
                className={cn(
                  "relative flex h-12 flex-col items-center justify-center rounded-xl text-base tabular-nums transition-colors",
                  tone
                    ? cn(TONE[tone], "font-semibold")
                    : isToday
                      ? "bg-bean-600 font-semibold text-white"
                      : marks.length
                        ? "font-medium text-fg hover:bg-surface-2"
                        : "text-fg-muted/60",
                  isSel && "ring-4 ring-ink-900 ring-offset-2 ring-offset-surface",
                  isToday && tone && "outline-2 outline-offset-2 outline-dashed outline-bean-600",
                )}
              >
                {d}
                {!tone && marks.length > 0 && (
                  <span className="absolute bottom-1.5 flex gap-0.5">
                    {marks.slice(0, 3).map((c, j) => (
                      <span key={j} className={cn("size-1 rounded-full", isSel || isToday ? "bg-white" : c)} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
