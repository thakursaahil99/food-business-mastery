"use client";

import { motion, useMotionValue, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EASE, Magnetic, SplitWords } from "@/components/motion/primitives";
import { useReducedMotionSafe } from "@/components/motion/motion-provider";
import { PortalPreview } from "./portal-preview";
import { sectors } from "@/content/site";

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotionSafe();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Product shot tilts up into place as you scroll.
  const rotateX = useTransform(scrollYProgress, [0, 0.45], [reduce ? 0 : 28, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [reduce ? 1 : 0.88, 1]);
  const shotY = useTransform(scrollYProgress, [0, 0.45], [0, -40]);
  const textY = useTransform(scrollYProgress, [0, 0.4], [0, reduce ? 0 : -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  // Cursor-following glow orbs.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const ox = useSpring(mx, { stiffness: 40, damping: 20 });
  const oy = useSpring(my, { stiffness: 40, damping: 20 });
  const ox2 = useTransform(ox, (v) => v * -0.6);
  const oy2 = useTransform(oy, (v) => v * -0.6);

  return (
    <section
      ref={ref}
      onPointerMove={(e) => {
        if (reduce) return;
        mx.set((e.clientX / window.innerWidth - 0.5) * 120);
        my.set((e.clientY / window.innerHeight - 0.5) * 120);
      }}
      className="relative overflow-hidden bg-ink-950 pb-24 pt-36 text-white grain sm:pt-44"
    >
      {/* background */}
      <div aria-hidden className="absolute inset-0 line-grid [mask-image:radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
      <motion.div aria-hidden style={{ x: ox, y: oy }} className="absolute left-1/2 top-[8%] size-[46rem] -translate-x-1/2 rounded-full bg-bean-600/30 blur-[140px]" />
      <motion.div aria-hidden style={{ x: ox2, y: oy2 }} className="absolute -right-40 top-[40%] size-[30rem] rounded-full bg-gold-500/10 blur-[120px]" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-ink-950" />

      <motion.div style={{ y: textY, opacity: textOpacity }} className="relative z-10 mx-auto max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4 text-xs text-white/70 backdrop-blur-md"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-bean-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            <Sparkles className="size-3" /> Batch 08
          </span>
          Admissions open · Shark Tank India alumnus coach
        </motion.div>

        <h1 className="font-display mt-8 text-[clamp(2.6rem,7.5vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.035em] text-balance">
          <SplitWords text="Build a food contract business that runs on" delay={0.15} />
          <br />
          <SplitWords
            text="Cash, Growth & Royalty."
            delay={0.55}
            className="font-serif font-normal italic tracking-[-0.01em]"
            wordClassName="text-gradient-bean pr-[0.06em]"
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.9, ease: EASE }}
          className="mx-auto mt-7 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg"
        >
          The CGR Mastery Program by Bobby Singh: 16 weeks of live classes, mentorship and real contracts across
          corporate, hospital, institutional and industrial catering.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.9, ease: EASE }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Magnetic>
            <ButtonLink href="/apply" size="lg">
              Apply for CGR Workshop
              <ArrowUpRight className="transition-transform duration-300 group-hover/btn:rotate-45" />
            </ButtonLink>
          </Magnetic>
          <ButtonLink href="/programs/cgr-mastery#investment" variant="ghostDark" size="lg">
            Get investment details <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />
          </ButtonLink>
        </motion.div>

        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 1.35 } } }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.2em] text-white/40"
        >
          {sectors.map((s) => (
            <motion.li key={s} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-bean-500" />
              {s}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      {/* product shot */}
      <div className="relative z-10 mx-auto mt-20 max-w-5xl px-4 sm:px-6" style={{ perspective: 1600 }}>
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 1.4, ease: EASE }}
        >
          <motion.div style={{ rotateX, scale, y: shotY, transformOrigin: "50% 0%" }} className="relative">
            <div aria-hidden className="absolute -inset-px rounded-[23px] bg-gradient-to-b from-white/25 via-white/5 to-transparent" />
            <PortalPreview className="relative" />
            <FloatingChip className="-left-4 top-24 hidden md:flex" delay={1.6} label="Recording ready" sub="Licences, FSSAI & renewals" dot="bg-emerald-400" />
            <FloatingChip className="-right-6 bottom-20 hidden md:flex" delay={1.8} label="Reminder sent" sub="WhatsApp · 15 min before class" dot="bg-gold-400" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function FloatingChip({ className, label, sub, dot, delay }: { className?: string; label: string; sub: string; dot: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.8, ease: EASE }}
      className={`absolute z-20 ${className}`}
    >
      <div className="flex animate-float items-center gap-3 rounded-2xl border border-white/10 bg-ink-800/80 px-4 py-3 shadow-2xl backdrop-blur-xl">
        <span className={`size-2 rounded-full ${dot} shadow-[0_0_12px_currentColor]`} />
        <div>
          <div className="text-xs font-semibold text-white">{label}</div>
          <div className="text-[11px] text-white/50">{sub}</div>
        </div>
      </div>
    </motion.div>
  );
}
