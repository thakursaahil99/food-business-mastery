"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useMemo, useState } from "react";
import { CalendarDays, List, X } from "lucide-react";
import type { ClassSession, SessionType } from "@/lib/types";
import { cn, istDayKey } from "@/lib/utils";
import { useNow } from "./shell";
import { useT, useFmt } from "@/components/i18n";
import { PageHeader } from "./ui";
import { ScheduleMonth } from "./schedule-month";
import { SessionCard, dayHeading, typeMeta } from "./session-ui";

type View = "list" | "calendar";
type When = "upcoming" | "past" | "all";

export function ScheduleView({ sessions, serverNow }: { sessions: ClassSession[]; serverNow: number }) {
  const { fmtDayLong } = useFmt();
  const { t } = useT();
  const S = t.schedule;
  const { fmtDay } = useFmt();
  const dayL = { today: t.common.today, tomorrow: t.common.tomorrow, yesterday: t.common.yesterday, fmtDay };
  const now = useNow();
  const ref = now ?? serverNow;
  const [view, setView] = useState<View>("list");
  const [when, setWhen] = useState<When>("upcoming");
  const [types, setTypes] = useState<SessionType[]>([]);

  // Re-bucket upcoming/past once a minute, not on every tick.
  const minute = Math.floor(ref / 60_000);
  const filtered = useMemo(() => {
    const cutoff = minute * 60_000;
    let list = sessions.filter((s) => types.length === 0 || types.includes(s.type));
    if (when === "upcoming") list = list.filter((s) => +new Date(s.endsAt) > cutoff);
    if (when === "past") list = list.filter((s) => +new Date(s.endsAt) <= cutoff).reverse();
    return list;
  }, [sessions, types, when, minute]);

  const groups = useMemo(() => {
    const map = new Map<string, ClassSession[]>();
    for (const s of filtered) {
      const k = istDayKey(s.startsAt);
      map.set(k, [...(map.get(k) ?? []), s]);
    }
    return [...map.entries()];
  }, [filtered]);

  const counts = useMemo(() => {
    const c: Record<SessionType, number> = { live: 0, webinar: 0, mentorship: 0 };
    sessions.forEach((s) => c[s.type]++);
    return c;
  }, [sessions]);

  return (
    <div className="space-y-6">
      <PageHeader icon={CalendarDays} title={S.title} sub={S.sub} actions={
        <Segmented
          id="view"
          value={view}
          onChange={setView}
          options={[
            { value: "list", label: S.list, icon: List },
            { value: "calendar", label: S.calendar, icon: CalendarDays },
          ]}
        />
      } />

      <div className="flex flex-wrap items-center gap-2">
        {view === "list" && (
          <Segmented
            id="when"
            small
            value={when}
            onChange={setWhen}
            options={[
              { value: "upcoming", label: S.upcoming },
              { value: "past", label: S.past },
              { value: "all", label: S.all },
            ]}
          />
        )}
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
        {(Object.keys(typeMeta) as SessionType[]).map((t) => {
          const on = types.includes(t);
          const M = typeMeta[t];
          return (
            <motion.button
              key={t}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTypes((cur) => (on ? cur.filter((x) => x !== t) : [...cur, t]))}
              className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors", on ? "border-bean-600 bg-bean-50 text-bean-800" : "border-line bg-surface text-fg-muted hover:text-fg")}
            >
              <span className={cn("size-2 rounded-full", M.dot)} />
              {S.types[t] ?? M.label}
              <span className={cn("text-xs tabular-nums", on ? "text-bean-700/70" : "text-fg-muted/70")}>{counts[t]}</span>
            </motion.button>
          );
        })}
        <AnimatePresence>
          {types.length > 0 && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => setTypes([])} className="inline-flex items-center gap-1 px-2 text-sm text-bean-600">
              <X className="size-3.5" /> {S.clear}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        {view === "list" ? (
          <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }}>
            {groups.length === 0 ? (
              <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong py-20 text-center">
                <CalendarDays className="size-10 text-fg-muted/50" />
                <p className="mt-4 text-lg font-semibold text-fg">{S.none}</p>
                <p className="mt-1 text-base text-fg-muted">{S.tryFilter}</p>
              </div>
            ) : (
              <LayoutGroup>
                <div className="space-y-8">
                  {groups.map(([day, list]) => (
                    <section key={day}>
                      <h2 className="sticky top-16 z-10 -mx-1 mb-3 flex items-center gap-3 bg-bg/85 px-1 py-2 backdrop-blur-md">
                        <span className={cn("text-lg font-semibold", dayHeading(list[0]!.startsAt, now, dayL) === t.common.today ? "text-bean-600" : "text-fg")}>
                          {dayHeading(list[0]!.startsAt, now, dayL)}
                        </span>
                        <span className="text-sm text-fg-muted">{fmtDayLong(list[0]!.startsAt)}</span>
                        <span className="h-px flex-1 bg-line" />
                      </h2>
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {list.map((s, i) => (
                            <SessionCard key={s.id} session={s} index={i} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </section>
                  ))}
                </div>
              </LayoutGroup>
            )}
          </motion.div>
        ) : (
          <motion.div key="cal" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.3 }}>
            <ScheduleMonth sessions={sessions.filter((s) => types.length === 0 || types.includes(s.type))} serverNow={serverNow} now={now} />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function Segmented<T extends string>({
  id,
  value,
  onChange,
  options,
  small,
}: {
  id: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: typeof List }[];
  small?: boolean;
}) {
  return (
    <div className="inline-flex rounded-xl bg-surface-2 p-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} aria-pressed={on} onClick={() => onChange(o.value)} className={cn("relative inline-flex min-h-10 items-center gap-1.5 rounded-lg font-semibold transition-colors", small ? "px-3.5 py-1.5 text-sm" : "px-4 py-2 text-sm", on ? "text-fg" : "text-fg-muted hover:text-fg")}>
            {on && <motion.span layoutId={`seg-${id}`} transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-lg bg-surface shadow-sm ring-1 ring-line" />}
            {o.icon && <o.icon className="relative size-4" />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
