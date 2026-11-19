"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { CalendarCheck, Compass, Crown, Flame, GraduationCap, LayoutDashboard, Megaphone, Sparkles, type LucideIcon } from "lucide-react";
import { BadgeCheck, Bell, Mic, MicOff, Play, QrCode, Radio } from "lucide-react";

import { Reveal, ScrollHighlight, SplitWords, Spotlight, Stagger } from "@/components/motion/primitives";
import { BeanMark } from "@/components/ui/logo";
import { benefits, brand } from "@/content/site";
import { SectionLabel } from "./sections-program";
import { cn } from "@/lib/utils";
const iconMap: Record<string, LucideIcon> = { Radio, Crown, Compass, LayoutDashboard, Megaphone, CalendarCheck, Flame, GraduationCap };

/* ───────────── Benefits bento ───────────── */
export function Benefits() {
  return (
    <section className="bg-cream-50 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-3xl">
          <Reveal>
            <SectionLabel>Everything included</SectionLabel>
          </Reveal>
          <SplitWords
            as="h2"
            animateOnView
            text="Not just a course. A team behind your business."
            className="font-display mt-5 text-4xl font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl"
          />
        </div>

        <Stagger className="mt-16 grid grid-cols-1 auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-4" gap={0.06}>
          {benefits.map((b, i) => {
            const Icon = iconMap[b.icon] ?? Sparkles;
            const featured = i === 1;
            return (
              <Spotlight
                key={b.title}
                className={cn(
                  "group h-full rounded-3xl border p-7 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgb(224_20_38/0.35)]",
                  featured ? "border-ink-800 bg-ink-900 text-white" : "border-line bg-white",
                )}
                color={featured ? "rgb(248 48 63 / 0.25)" : "rgb(248 48 63 / 0.1)"}
              >
                <div
                  className={cn(
                    "grid size-12 place-items-center rounded-2xl transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110",
                    featured ? "bg-bean-600 text-white" : "bg-bean-50 text-bean-600",
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <h3 className="font-display mt-8 text-xl font-semibold tracking-tight">{b.title}</h3>
                <p className={cn("mt-2 text-sm leading-relaxed", featured ? "text-white/60" : "text-ink-400")}>{b.body}</p>
              </Spotlight>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────────── Coach ───────────── */
export function Coach() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const rotate = useTransform(scrollYProgress, [0, 1], [-6, 6]);

  return (
    <section id="coach" ref={ref} className="relative overflow-hidden bg-white py-28 sm:py-36">
      <div className="mx-auto grid grid-cols-1 max-w-6xl items-center gap-16 px-6 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div style={{ y }} className="relative mx-auto w-full max-w-sm">
          <motion.div style={{ rotate }} className="absolute -inset-6 rounded-[40px] bg-gradient-to-br from-bean-500 to-bean-900 opacity-90" />
          {/* Portrait slot: replace with a licensed photo of Bobby Singh (next/image, /public/coach.jpg). */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] bg-ink-900 grain">
            <div className="absolute inset-0 dot-grid opacity-50" />
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-display text-[9rem] font-extrabold tracking-tighter text-white/10">BS</span>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950 to-transparent p-6 pt-20">
              <div className="font-display text-2xl font-semibold text-white">{brand.coach}</div>
              <div className="mt-1 text-sm text-white/60">{brand.coachTitle}</div>
            </div>
          </div>
          <div className="absolute -right-4 top-10 rounded-2xl border border-line bg-white px-4 py-3 shadow-xl sm:-right-10">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-400">As seen on</div>
            <div className="font-display text-sm font-semibold text-ink-900">Shark Tank India</div>
          </div>
        </motion.div>

        <div>
          <Reveal>
            <SectionLabel>Your coach</SectionLabel>
          </Reveal>
          <ScrollHighlight
            className="font-display mt-6 text-3xl font-semibold leading-[1.15] tracking-tight text-ink-900 sm:text-[2.6rem]"
            text="“Contract food is the most underrated business in India. Hospitals, offices and factories need to eat every single day. I'll show you how to price it, run it and grow it so that it pays you for life.”"
          />
          <Reveal delay={0.1} className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
            {[
              ["20+", "years in F&B"],
              ["350+", "success stories"],
              ["4", "sectors mastered"],
            ].map(([v, l]) => (
              <div key={l}>
                <div className="font-display text-3xl font-bold text-bean-600">{v}</div>
                <div className="mt-1 text-sm text-ink-400">{l}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Pinned horizontal app showcase ───────────── */
const panels = [
  {
    kicker: "Schedule",
    title: "Every class, in IST, on every device.",
    body: "Day, week and month views, filters by batch and type, one-tap add to Google Calendar.",
    art: "schedule",
  },
  {
    kicker: "Live classes",
    title: "Join in one tap. No links to hunt for.",
    body: "Classes open 10 minutes early. Raise hand, chat and screen share, with attendance tracked automatically.",
    art: "live",
  },
  {
    kicker: "Recordings",
    title: "Missed a class? Pick up where you left off.",
    body: "Every class is recorded and added to your library, with progress saved across web and app.",
    art: "video",
  },
  {
    kicker: "Reminders",
    title: "WhatsApp nudges so you never miss a week.",
    body: "A reminder the day before and 15 minutes before each class, plus payment receipts and new recordings.",
    art: "whatsapp",
  },
  {
    kicker: "Certification",
    title: "A certificate anyone can verify.",
    body: "Finish the live project and assessment to earn a Redbean certificate with a QR verification link.",
    art: "cert",
  },
] as const;

export function PortalShowcase() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -distance]);

  useLayoutEffect(() => {
    const measure = () => {
      const t = trackRef.current;
      if (t) setDistance(Math.max(0, t.scrollWidth - window.innerWidth + 48));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <section id="portal" ref={ref} className="relative bg-ink-950 text-white" style={{ height: `${panels.length * 75}vh` }}>
      <div className="sticky top-0 flex h-dvh flex-col justify-center overflow-hidden grain">
        <div aria-hidden className="absolute left-1/3 top-1/4 size-[40rem] rounded-full bg-bean-700/20 blur-[150px]" />
        <div className="relative mx-auto mb-10 flex w-full max-w-6xl items-end justify-between gap-6 px-6">
          <div>
            <SectionLabel dark>The academy app</SectionLabel>
            <h2 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Your classroom, <span className="font-serif font-normal italic text-gradient-bean">in your pocket.</span>
            </h2>
          </div>
          <ProgressDots progress={scrollYProgress} count={panels.length} />
        </div>
        <motion.div ref={trackRef} style={{ x }} className="relative flex gap-5 pl-6 will-change-transform md:pl-[max(1.5rem,calc((100vw-72rem)/2+1.5rem))]">
          {panels.map((p, i) => (
            <article
              key={p.kicker}
              className="group flex w-[82vw] shrink-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.01] sm:w-[520px]"
            >
              <div className="relative h-56 overflow-hidden border-b border-white/8 bg-ink-900 sm:h-64">
                <PanelArt kind={p.art} />
              </div>
              <div className="p-7">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-bean-300">
                  <span className="font-mono text-white/30">0{i + 1}</span> {p.kicker}
                </div>
                <h3 className="font-display mt-3 text-2xl font-semibold tracking-tight">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">{p.body}</p>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ProgressDots({ progress, count }: { progress: MotionValue<number>; count: number }) {
  return (
    <div className="hidden items-center gap-2 sm:flex">
      {Array.from({ length: count }, (_, i) => (
        <Dot key={i} progress={progress} i={i} count={count} />
      ))}
    </div>
  );
}

function Dot({ progress, i, count }: { progress: MotionValue<number>; i: number; count: number }) {
  const start = i / count;
  const width = useTransform(progress, [start, start + 1 / count], [8, 32]);
  // Function form on purpose: a range like [start - 0.05, ...] goes negative for the first dot, and
  // Motion's scroll-accelerated (WAAPI) opacity then throws "Offsets must be monotonically non-decreasing".
  const fadeFrom = start - 0.05;
  const opacity = useTransform(progress, (p) =>
    p >= start ? 1 : p <= fadeFrom ? 0.3 : 0.3 + (0.7 * (p - fadeFrom)) / 0.05,
  );
  return <motion.span style={{ width, opacity }} className="h-2 rounded-full bg-bean-500" />;
}

function PanelArt({ kind }: { kind: (typeof panels)[number]["art"] }) {
  switch (kind) {
    case "schedule":
      return (
        <div className="absolute inset-0 p-6">
          <div className="grid grid-cols-5 gap-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d, i) => (
              <div key={d} className="space-y-2">
                <div className="text-center text-[10px] uppercase text-white/40">{d}</div>
                {[0, 1, 2].map((r) => {
                  const on = (i + r) % 3 === 0;
                  return (
                    <div
                      key={r}
                      className={cn(
                        "h-12 rounded-lg border transition-all duration-700 group-hover:translate-y-0",
                        on ? "border-bean-500/40 bg-bean-600/30" : "border-white/5 bg-white/[0.02]",
                        r === 1 && i === 2 && "bg-gold-500/30 border-gold-400/40",
                      )}
                      style={{ transitionDelay: `${(i + r) * 40}ms` }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    case "live":
      return (
        <div className="absolute inset-0 grid grid-cols-3 gap-2 p-5">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={cn("relative grid place-items-center rounded-xl", i === 0 ? "col-span-2 row-span-2 bg-gradient-to-br from-bean-700 to-ink-800" : "bg-white/[0.04]")}>
              <span className={cn("grid place-items-center rounded-full bg-white/10 font-semibold", i === 0 ? "size-16 text-lg" : "size-8 text-[10px]")}>
                {["BS", "RS", "AK", "PM", "NJ", "VT"][i]}
              </span>
              <span className="absolute bottom-1.5 left-1.5 rounded bg-black/40 p-1">
                {i % 2 ? <MicOff className="size-2.5 text-white/60" /> : <Mic className="size-2.5 text-white" />}
              </span>
              {i === 0 && (
                <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-bean-600 px-2 py-0.5 text-[9px] font-semibold uppercase">
                  <Radio className="size-2.5" /> Live
                </span>
              )}
            </div>
          ))}
        </div>
      );
    case "video":
      return (
        <div className="absolute inset-0 p-6">
          <div className="relative h-full overflow-hidden rounded-xl bg-gradient-to-br from-ink-700 to-ink-900">
            <div className="absolute inset-0 grid place-items-center">
              <span className="grid size-14 place-items-center rounded-full bg-white text-bean-600 shadow-2xl transition-transform duration-500 group-hover:scale-110">
                <Play className="ml-0.5 size-6 fill-current" />
              </span>
            </div>
            <div className="absolute inset-x-4 bottom-4">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>24:18</span>
                <span>58:00</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-white/15">
                <div className="h-full w-[42%] rounded-full bg-bean-500 transition-all duration-1000 group-hover:w-[64%]" />
              </div>
            </div>
          </div>
        </div>
      );
    case "whatsapp":
      return (
        <div className="absolute inset-0 space-y-3 bg-[#0b141a] p-6">
          {[
            "Hi Rohit 👋 Your class “Audit simulation: NABH walkthrough” starts tomorrow at 7:00 PM IST.",
            "Starting in 15 minutes. Tap to join: academy.redbean/class/1008",
          ].map((m, i) => (
            <div
              key={i}
              className="max-w-[85%] translate-y-2 rounded-xl rounded-tl-sm bg-[#202c33] px-3.5 py-2.5 text-[12px] leading-relaxed text-white/85 opacity-80 transition-all duration-700 group-hover:translate-y-0 group-hover:opacity-100"
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {m}
              <div className="mt-1 text-right text-[9px] text-white/40">{i ? "6:45 PM" : "7:00 PM"}</div>
            </div>
          ))}
          <Bell className="absolute bottom-5 right-5 size-5 animate-float text-emerald-400" />
        </div>
      );
    case "cert":
      return (
        <div className="absolute inset-0 grid place-items-center p-6">
          <div className="relative w-full max-w-sm rotate-[-3deg] rounded-xl border border-gold-400/30 bg-cream-50 p-5 text-ink-900 shadow-2xl transition-transform duration-700 group-hover:rotate-0">
            <div className="flex items-center justify-between">
              <BeanMark className="size-7" />
              <BadgeCheck className="size-6 text-gold-500" />
            </div>
            <div className="mt-3 text-[9px] uppercase tracking-[0.3em] text-ink-400">Certificate of mastery</div>
            <div className="font-serif mt-1 text-2xl italic">Rohit Sharma</div>
            <div className="mt-1 text-[10px] text-ink-400">CGR Food Contract Mastery Program · Batch 07</div>
            <div className="mt-3 flex items-end justify-between">
              <div className="h-px w-24 bg-ink-300" />
              <QrCode className="size-9 text-ink-800" />
            </div>
          </div>
        </div>
      );
  }
}

