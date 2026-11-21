"use client";

import Link from "next/link";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { CalendarPlus, Check, ChevronDown, Clock, Download, PlayCircle, Radio, Users, Video, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { countdownParts, getJoinState, type JoinState } from "@/lib/join-window";
import { downloadIcs, googleCalendarUrl } from "@/lib/ics";
import type { ClassSession, SessionType } from "@/lib/types";
import { cn, durationLabel, fmtDay as fmtDayEn } from "@/lib/utils";
import { useNow } from "./shell";
import { useT, useFmt } from "@/components/i18n";

export const typeMeta: Record<SessionType, { label: string; icon: typeof Video; dot: string; chip: string }> = {
  live: { label: "Live class", icon: Video, dot: "bg-bean-500", chip: "bg-bean-50 text-bean-700 ring-bean-200" },
  webinar: { label: "Webinar", icon: Users, dot: "bg-gold-500", chip: "bg-amber-50 text-amber-800 ring-amber-200" },
  mentorship: { label: "Mentorship", icon: Radio, dot: "bg-violet-500", chip: "bg-violet-50 text-violet-700 ring-violet-200" },
};

export function TypeChip({ type }: { type: SessionType }) {
  const { t } = useT();
  const m = typeMeta[type];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset", m.chip)}>
      <m.icon className="size-3" />
      {t.schedule.types[type] ?? m.label}
    </span>
  );
}

export function StatusBadge({ session, now }: { session: ClassSession; now: number | null }) {
  const S = useT().t.schedule.status;
  const js = now ? getJoinState(session, now) : null;
  if (!js) return <span className="h-6 w-20 animate-pulse rounded-full bg-surface-2" />;
  if (js.state === "cancelled") return <Badge className="bg-ink-100 text-ink-500 line-through decoration-ink-300">{S.cancelled}</Badge>;
  if (js.state === "ended") return <Badge className="bg-emerald-50 text-emerald-700">{S.completed}</Badge>;
  if (js.state === "open" && js.live)
    return (
      <Badge className="bg-bean-600 text-white">
        <span className="relative flex size-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-white" />
          <span className="relative size-1.5 rounded-full bg-white" />
        </span>
        {S.live}
      </Badge>
    );
  if (js.state === "open") return <Badge className="bg-amber-100 text-amber-800">{S.soon}</Badge>;
  return <Badge className="bg-sky-50 text-sky-700">{S.upcoming}</Badge>;
}

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", className)}>{children}</span>;
}

export function Countdown({ ms, className }: { ms: number; className?: string }) {
  const { d, h, m, s } = countdownParts(ms);
  const parts = d > 0 ? [[d, "d"], [h, "h"], [m, "m"]] : [[h, "h"], [m, "m"], [s, "s"]];
  return (
    <span className={cn("inline-flex gap-1.5 font-mono tabular-nums", className)}>
      {parts.map(([v, u]) => (
        <span key={u as string} className="inline-flex items-baseline">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={v as number} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 8, opacity: 0 }} transition={{ duration: 0.25 }}>
              {String(v).padStart(2, "0")}
            </motion.span>
          </AnimatePresence>
          <span className="ml-0.5 text-[0.7em] opacity-60">{u}</span>
        </span>
      ))}
    </span>
  );
}

/** Join / recording / countdown action for a session. */
export function SessionAction({ session, js, size = "sm", invert = false }: { session: ClassSession; js: JoinState | null; size?: "sm" | "md" | "lg"; invert?: boolean }) {
  const J = useT().t.join;
  if (!js) return <span className="h-9 w-28 animate-pulse rounded-full bg-surface-2" />;
  if (js.state === "open")
    return (
      <Link href={`/student/class/${session.id}`} transitionTypes={["nav-forward"]} className={cn(buttonVariants({ size, variant: invert ? "light" : "primary" }), invert && "text-bean-700")}>
        <span className="relative flex size-2">
          <span className={cn("absolute inset-0 animate-ping rounded-full", invert ? "bg-bean-500" : "bg-white")} />
          <span className={cn("relative size-2 rounded-full", invert ? "bg-bean-500" : "bg-white")} />
        </span>
        {js.live ? J.joinNow : J.join}
      </Link>
    );
  if (js.state === "ended")
    return session.recordingAvailable ? (
      <Link href={`/student/learn?session=${session.id}`} className={buttonVariants({ size, variant: "outline" })}>
        <PlayCircle /> {J.recording}
      </Link>
    ) : (
      <span className="text-xs text-fg-muted">{J.processing}</span>
    );
  if (js.state === "cancelled") return <span className="text-xs text-fg-muted">{J.rescheduling}</span>;
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs", invert ? "border-white/20 text-white/80" : "border-line text-fg-muted")}>
      <Clock className="size-3.5" /> {J.opensIn} <Countdown ms={js.opensInMs} className={invert ? "text-white" : "text-fg"} />
    </span>
  );
}

export function AddToCalendar({ session }: { session: ClassSession }) {
  const J = useT().t.join;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const joinUrl = typeof window !== "undefined" ? `${window.location.origin}/student/class/${session.id}` : "";
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg" aria-label={J.addCalendar} aria-expanded={open}>
        <CalendarPlus className="size-4" />
        <span className="hidden sm:inline">{J.addCalendar}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-11 z-20 w-52 origin-top-right overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-xl"
          >
            <a href={googleCalendarUrl(session, joinUrl)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm hover:bg-surface-2">
              <CalendarPlus className="size-4 text-bean-600" /> Google Calendar
            </a>
            <button onClick={() => { downloadIcs(session, joinUrl); setOpen(false); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface-2">
              <Download className="size-4 text-bean-600" /> Download .ics
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SessionCard({ session, index = 0 }: { session: ClassSession; index?: number }) {
  const { fmtTime } = useFmt();
  const { t } = useT();
  const now = useNow();
  const js = now ? getJoinState(session, now) : null;
  const [open, setOpen] = useState(false);
  const meta = typeMeta[session.type];
  const highlight = js?.state === "open";

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-surface transition-shadow duration-300 ",
        highlight ? "border-bean-300 ring-4 ring-bean-500/10" : "border-line",
        session.status === "cancelled" && "opacity-60",
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", meta.dot)} />
      <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center sm:p-5 sm:pl-6">
        <div className="flex shrink-0 items-center gap-4 sm:w-32 sm:flex-col sm:items-start sm:gap-0.5">
          <div className="text-lg font-semibold tabular-nums text-fg">{fmtTime(session.startsAt)}</div>
          <div className="text-xs text-fg-muted">
            {durationLabel(session.startsAt, session.endsAt)} · IST
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeChip type={session.type} />
            <StatusBadge session={session} now={now} />
            {session.attended === true && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <Check className="size-3.5" /> {t.schedule.attended}
              </span>
            )}
            {session.attended === false && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-400">
                <X className="size-3.5" /> {t.schedule.missed}
              </span>
            )}
          </div>
          <h3 className={cn("mt-2 truncate font-semibold text-fg", session.status === "cancelled" && "line-through")}>{session.title}</h3>
          <p className="mt-0.5 truncate text-sm text-fg-muted">
            {session.coach.name} · {session.batchName}
            {session.moduleTitle ? ` · ${session.moduleTitle}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SessionAction session={session} js={js} />
          {js?.state === "upcoming" && <AddToCalendar session={session} />}
          {session.description && (
            <button onClick={() => setOpen((o) => !o)} className="grid size-9 place-items-center rounded-full text-fg-muted hover:bg-surface-2" aria-label={t.common.open} aria-expanded={open}>
              <ChevronDown className={cn("size-4 transition-transform duration-300", open && "rotate-180")} />
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && session.description && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="border-t border-line px-6 py-4 text-sm text-fg-muted">{session.description}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

/** Animated SVG ring. */
export function ProgressRing({ value, size = 120, stroke = 10, className, trackClass = "stroke-ink-100", children }: { value: number; size?: number; stroke?: number; className?: string; trackClass?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const reduce = useReducedMotion();
  // Always start at 0: useReducedMotion() is null on the server, so seeding from it would break hydration.
  const mv = useMotionValue(0);
  const offset = useTransform(mv, (v) => c - (v / 100) * c);
  const label = useTransform(mv, (v) => `${Math.round(v)}%`);
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const ctl = animate(mv, value, { duration: 0.8, ease: [0.16, 1, 0.3, 1] });
    return () => ctl.stop();
  }, [mv, value, reduce]);
  return (
    <div className={cn("relative", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-bean-400)" }} />
            <stop offset="100%" style={{ stopColor: "var(--color-bean-700)" }} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClass} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ring-g)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} style={{ strokeDashoffset: offset }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children ?? <motion.span className="text-2xl font-bold text-fg">{label}</motion.span>}
      </div>
    </div>
  );
}

export function dayHeading(iso: string, now: number | null, labels: { today: string; tomorrow: string; yesterday: string; fmtDay?: (iso: string) => string } = { today: "Today", tomorrow: "Tomorrow", yesterday: "Yesterday" }) {
  const fmtDay = labels.fmtDay ?? fmtDayEn;
  if (!now) return fmtDay(iso);
  const key = (t: number | string) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date(t));
  const today = key(now);
  const tomorrow = key(now + 86_400_000);
  const yesterday = key(now - 86_400_000);
  const k = key(iso);
  if (k === today) return labels.today;
  if (k === tomorrow) return labels.tomorrow;
  if (k === yesterday) return labels.yesterday;
  return fmtDay(iso);
}
