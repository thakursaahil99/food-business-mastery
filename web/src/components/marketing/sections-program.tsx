"use client";

import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { Check } from "lucide-react";
import { Counter, Marquee, Reveal, SplitWords, Spotlight, Stagger } from "@/components/motion/primitives";
import { curriculum, marqueeWords, pillars, stats } from "@/content/site";
import { cn } from "@/lib/utils";

export function SectionLabel({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em]", dark ? "text-bean-300" : "text-bean-600")}>
      <span className="h-px w-8 bg-current" />
      {children}
    </div>
  );
}

/* ───────────── Marquee band ───────────── */
export function MarqueeBand() {
  return (
    <section aria-label="What we cover" className="relative -mt-px overflow-hidden bg-ink-950 py-6">
      <div className="-rotate-1 scale-105 bg-bean-600 py-5 shadow-[0_0_80px_rgb(224_20_38/0.5)]">
        <Marquee duration={45} className="gap-10">
          {marqueeWords.map((w) => (
            <span key={w} className="font-display flex items-center gap-10 whitespace-nowrap text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {w}
              <svg viewBox="0 0 24 24" className="size-5 text-white/60" aria-hidden>
                <path d="M12 0 14.5 9.5 24 12 14.5 14.5 12 24 9.5 14.5 0 12 9.5 9.5Z" fill="currentColor" />
              </svg>
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}

/* ───────────── Stats ───────────── */
export function Stats() {
  return (
    <section className="bg-cream-50 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <Stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="group relative h-full bg-cream-50 p-8 transition-colors duration-500 hover:bg-white sm:p-10">
              <div className="font-display text-5xl font-bold tracking-tight text-ink-900 sm:text-6xl">
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="mt-3 text-sm text-ink-400">{s.label}</div>
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-bean-500 transition-all duration-700 group-hover:w-full" />
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────────── CGR pillars ───────────── */
export function Pillars() {
  return (
    <section id="program" className="relative bg-cream-50 pb-28 sm:pb-36">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-end gap-8 md:grid-cols-[1.2fr_1fr]">
          <div>
            <Reveal>
              <SectionLabel>The CGR framework</SectionLabel>
            </Reveal>
            <SplitWords
              as="h2"
              animateOnView
              text="Three pillars. One business that pays you back."
              className="font-display mt-5 text-4xl font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl"
            />
          </div>
          <Reveal delay={0.2}>
            <p className="text-lg leading-relaxed text-ink-400">
              Every class, case study and mentorship call maps back to Cash, Growth and Royalty, the operating system
              Bobby Singh has used across 20+ years of contract food.
            </p>
          </Reveal>
        </div>

        <Stagger className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3" gap={0.12}>
          {pillars.map((p, i) => (
            <Spotlight
              key={p.title}
              className={cn(
                "h-full rounded-[28px] border p-8 transition-transform duration-500 hover:-translate-y-1.5",
                i === 1 ? "border-bean-700 bg-bean-600 text-white" : "border-line bg-white text-ink-900",
              )}
              color={i === 1 ? "rgb(255 255 255 / 0.18)" : "rgb(248 48 63 / 0.12)"}
            >
              <div className="flex items-start justify-between">
                <span className={cn("font-display text-[7rem] font-extrabold leading-[0.8] tracking-tighter", i === 1 ? "text-white/25" : "text-bean-500/15")}>
                  {p.letter}
                </span>
                <span className={cn("rounded-full px-3 py-1 text-xs font-medium", i === 1 ? "bg-white/15" : "bg-bean-50 text-bean-700")}>
                  0{i + 1}
                </span>
              </div>
              <h3 className="font-display mt-6 text-3xl font-semibold tracking-tight">{p.title}</h3>
              <p className={cn("mt-3 leading-relaxed", i === 1 ? "text-white/80" : "text-ink-400")}>{p.blurb}</p>
              <ul className="mt-6 space-y-2">
                {p.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2 text-sm">
                    <span className={cn("grid size-5 place-items-center rounded-full", i === 1 ? "bg-white text-bean-600" : "bg-bean-600 text-white")}>
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    {pt}
                  </li>
                ))}
              </ul>
            </Spotlight>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ───────────── Curriculum: sticky heading + scroll-filled timeline ───────────── */
export function Curriculum() {
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 0.6", "end 0.6"] });
  const fill = useSpring(scrollYProgress, { stiffness: 100, damping: 25 });
  const pct = useTransform(scrollYProgress, (v) => `${Math.round(v * 100)}%`);

  return (
    <section id="curriculum" className="relative overflow-x-clip bg-ink-950 py-28 text-white grain sm:py-36">
      <div aria-hidden className="absolute inset-0 dot-grid opacity-40 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]" />
      <div className="relative mx-auto grid grid-cols-1 max-w-6xl gap-16 px-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-32 lg:h-fit">
          <SectionLabel dark>The 16-week curriculum</SectionLabel>
          <h2 className="font-display mt-5 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
            From kitchen layout to <span className="font-serif font-normal italic text-gradient-bean">signed contracts.</span>
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/55">
            A practical, month-by-month path through healthcare F&B consultancy, with business development running
            alongside every week.
          </p>
          <div className="mt-10 hidden max-w-xs lg:block">
            <div className="flex justify-between text-xs uppercase tracking-[0.2em] text-white/40">
              <span>Your journey</span>
              <motion.span>{pct}</motion.span>
            </div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div style={{ scaleX: fill }} className="h-full origin-left rounded-full bg-gradient-to-r from-bean-500 to-gold-400" />
            </div>
          </div>
        </div>

        <ol ref={listRef} className="relative space-y-6 pl-10 sm:pl-14">
          <div aria-hidden className="absolute bottom-4 left-[11px] top-4 w-px bg-white/10 sm:left-[19px]" />
          <motion.div aria-hidden style={{ scaleY: fill }} className="absolute bottom-4 left-[11px] top-4 w-px origin-top bg-gradient-to-b from-bean-400 via-bean-500 to-gold-400 sm:left-[19px]" />
          {curriculum.map((m, i) => (
            <CurriculumItem key={m.title} index={i} {...m} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function CurriculumItem({ tag, weeks, title, topics, index }: (typeof curriculum)[number] & { index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.55"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.25, 1]);
  const x = useTransform(scrollYProgress, [0, 1], [40, 0]);
  const dot = useTransform(scrollYProgress, [0.6, 1], [0, 1]);

  return (
    <motion.li ref={ref} style={{ opacity, x }} className="relative">
      <span className="absolute -left-10 top-7 grid size-6 place-items-center rounded-full border border-white/15 bg-ink-950 sm:-left-14 sm:size-10">
        <motion.span style={{ scale: dot }} className="size-2.5 rounded-full bg-bean-500 shadow-[0_0_16px_rgb(248_48_63)] sm:size-3" />
      </span>
      <Spotlight className="rounded-3xl border border-white/8 bg-white/[0.03] p-7 backdrop-blur-sm transition-colors hover:border-white/15 sm:p-8" color="rgb(248 48 63 / 0.12)">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="rounded-full bg-bean-600 px-3 py-1 font-semibold uppercase tracking-wider">{tag}</span>
          <span className="text-white/45">{weeks}</span>
          <span className="ml-auto font-mono text-white/25">0{index + 1}</span>
        </div>
        <h3 className="font-display mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h3>
        <ul className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {topics.map((t) => (
            <li key={t} className="flex items-center gap-2.5 text-sm text-white/65">
              <span className="size-1.5 rounded-full bg-bean-400" />
              {t}
            </li>
          ))}
        </ul>
      </Spotlight>
    </motion.li>
  );
}
