"use client";

import type { CSSProperties } from "react";
import { motion } from "motion/react";
import { useReducedMotionSafe } from "@/components/motion/motion-provider";
import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/components/ui/logo";
import { EASE } from "@/components/motion/primitives";
import { ArrowUpRight } from "lucide-react";
import { AUTH_PHOTO, FLAGSHIP_COURSE } from "./course";

/** Decorative beans, kept to the edges so they stay clear of the centred logo and copy. */
const BEANS: { pos: CSSProperties; size: number; rotate: number }[] = [
  { pos: { left: "6%", top: "8%" }, size: 120, rotate: -30 },
  { pos: { right: "8%", top: "4%" }, size: 72, rotate: 25 },
  { pos: { left: "4%", top: "46%" }, size: 64, rotate: 40 },
  { pos: { right: "5%", top: "40%" }, size: 140, rotate: -15 },
  // Bottom row sits above the proof strip so no bean shows through it.
  { pos: { left: "8%", top: "64%" }, size: 72, rotate: 15 },
  { pos: { right: "10%", top: "66%" }, size: 56, rotate: -35 },
];

/** Coach credentials shown under the student panel (from bobbysingh.in). */
const PROOF = [
  ["20+", "years in F&B"],
  ["350+", "success stories"],
  ["Shark Tank", "India alumnus"],
] as const;

/** Left half of the login split layout: real workshop photo under a brand gradient, faded beans, course card. */
export function BrandPanel({ variant = "student" }: { variant?: "student" | "admin" }) {
  const admin = variant === "admin";
  const reduce = useReducedMotionSafe();

  return (
    <aside className="relative hidden overflow-hidden bg-ink-950 text-white lg:flex lg:flex-col">
      <Image src={AUTH_PHOTO.src} alt="" aria-hidden fill priority sizes="45vw" className="object-cover object-[50%_40%]" />
      {/* Brand tint over the photo; heavier at top and bottom where the text sits. */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-gradient-to-br ${admin ? "from-ink-950/95 via-ink-900/90 to-bean-950/85" : "from-ink-950/85 via-bean-950/70 to-bean-700/65"}`}
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-ink-950/50" />
      {/* Faded beans, matching the set on the form side (auth-layout.tsx), in white for the dark panel. */}
      {BEANS.map((b, i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none absolute"
          style={{ ...b.pos, rotate: b.rotate }}
          animate={reduce ? undefined : { y: [0, -12, 0] }}
          transition={reduce ? undefined : { duration: 8 + (i % 5), repeat: Infinity, ease: "easeInOut" }}
        >
          <Image src={BRAND.mark.src} width={BRAND.mark.width} height={BRAND.mark.height} alt="" className="object-contain opacity-[0.07] brightness-0 invert" style={{ width: b.size, height: b.size }} />
        </motion.div>
      ))}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-10 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={{ duration: 1, ease: EASE }}>
          <Link href="/" aria-label="Redbean Academy home" className="relative inline-block">
            {/* Soft glow behind the badge only — no visible rings or discs. */}
            <span aria-hidden className="absolute inset-x-0 top-0 aspect-square rounded-full bg-bean-600/35 blur-3xl" />
            <Image
              src={BRAND.logoWhite.src}
              width={BRAND.logoWhite.width}
              height={BRAND.logoWhite.height}
              alt="Red Bean Hospitality"
              priority
              className="relative h-auto w-44 drop-shadow-[0_10px_30px_rgb(0_0_0/0.45)]"
            />
          </Link>
        </motion.div>
        <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.8, ease: EASE }} className="font-display mt-8 text-4xl font-bold tracking-tight">
          Redbean <span className="text-bean-400">{admin ? "Console" : "Academy"}</span>
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: EASE }} className="mt-3 max-w-xs text-white/70">
          {admin ? "Run batches, classes, leads and payments for Redbean Academy." : "Live classes, recordings and mentorship with Bobby Singh for India’s contract food entrepreneurs."}
        </motion.p>
        {!admin && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8, ease: EASE }} className="mt-8 w-full max-w-md">
            <Link
              href={FLAGSHIP_COURSE.href}
              className="group flex items-center gap-4 rounded-2xl border border-white/15 bg-ink-950/50 p-3 pr-5 text-left backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-ink-950/60"
            >
              <span className="relative size-20 shrink-0 overflow-hidden rounded-xl">
                <Image src={FLAGSHIP_COURSE.thumb.src} alt={FLAGSHIP_COURSE.thumb.alt} fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-bean-300">{FLAGSHIP_COURSE.eyebrow}</span>
                <span className="font-display mt-1 block text-lg font-semibold leading-tight">{FLAGSHIP_COURSE.title}</span>
                <span className="mt-1 block text-xs text-white/60">{FLAGSHIP_COURSE.meta.join(" · ")}</span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-white/50 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
            </Link>
          </motion.div>
        )}
      </div>
      <div className="relative z-10 px-10 pb-8">
        {!admin && (
          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8, ease: EASE }}
            className="mx-auto grid max-w-md grid-cols-3 divide-x divide-white/10 py-1 text-center"
          >
            {PROOF.map(([value, label]) => (
              <li key={label} className="px-3">
                <div className="font-display text-lg font-semibold tracking-tight">{value}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-white/55">{label}</div>
              </li>
            ))}
          </motion.ul>
        )}
        <p className="mt-6 text-center text-xs text-white/40">© Red Bean Hospitality</p>
      </div>
    </aside>
  );
}
