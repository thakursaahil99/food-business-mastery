"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Plus, Quote } from "lucide-react";
import { Marquee, Reveal, SplitWords } from "@/components/motion/primitives";
import { faqs, stories } from "@/content/site";
import { SectionLabel } from "./sections-program";
import { ApplyForm } from "./apply-form";
import { cn } from "@/lib/utils";

/* ───────────── Stories ───────────── */
export function Stories() {
  const half = Math.ceil(stories.length / 2);
  return (
    <section className="overflow-hidden bg-cream-100 py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <SectionLabel>From the community</SectionLabel>
        </Reveal>
        <SplitWords
          as="h2"
          animateOnView
          text="350+ entrepreneurs. Real kitchens. Real contracts."
          className="font-display mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl"
        />
      </div>
      <div className="mt-16 space-y-5">
        <Marquee duration={55} className="gap-5">
          {stories.slice(0, half).map((s) => <StoryCard key={s.who} {...s} />)}
        </Marquee>
        <Marquee duration={60} reverse className="gap-5">
          {stories.slice(half).map((s) => <StoryCard key={s.who} {...s} />)}
        </Marquee>
      </div>
    </section>
  );
}

function StoryCard({ who, where, quote }: (typeof stories)[number]) {
  return (
    <figure className="w-[340px] shrink-0 rounded-3xl border border-line bg-white p-7 transition-transform duration-500 hover:-translate-y-1 sm:w-[420px]">
      <Quote className="size-6 text-bean-500" />
      <blockquote className="mt-4 text-lg leading-relaxed text-ink-800">{quote}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-bean-400 to-bean-700 text-sm font-semibold text-white">
          {who[0]}
        </span>
        <span className="text-sm">
          <span className="block font-medium text-ink-900">{who}</span>
          <span className="text-ink-400">{where}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/* ───────────── FAQ ───────────── */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-cream-50 py-28 sm:py-36">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-12 px-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <Reveal>
            <SectionLabel>Questions</SectionLabel>
          </Reveal>
          <SplitWords
            as="h2"
            animateOnView
            text="Everything you wanted to ask."
            className="font-display mt-5 text-4xl font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-5xl"
          />
        </div>
        <ul className="divide-y divide-line border-y border-line">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center justify-between gap-6 py-6 text-left"
                >
                  <span className={cn("font-display text-lg font-semibold tracking-tight transition-colors sm:text-xl", isOpen ? "text-bean-600" : "text-ink-900 group-hover:text-bean-600")}>
                    {f.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className={cn("grid size-9 shrink-0 place-items-center rounded-full border transition-colors", isOpen ? "border-bean-600 bg-bean-600 text-white" : "border-line-strong text-ink-700")}
                  >
                    <Plus className="size-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-2xl pb-7 leading-relaxed text-ink-400">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ───────────── Apply CTA ───────────── */
export function ApplySection() {
  return (
    <section id="apply" className="relative overflow-hidden bg-bean-600 py-28 text-white grain sm:py-36">
      <div aria-hidden className="absolute inset-0 dot-grid opacity-30" />
      <div aria-hidden className="absolute -left-40 -top-40 size-[36rem] animate-spin-slow rounded-full border border-white/10" />
      <div aria-hidden className="absolute -bottom-60 -right-20 size-[44rem] rounded-full bg-bean-900/60 blur-3xl" />
      <div className="relative mx-auto grid grid-cols-1 max-w-6xl gap-14 px-6 lg:grid-cols-2">
        <div>
          <SectionLabel dark>
            <span className="text-white/80">Batch 08 admissions</span>
          </SectionLabel>
          <SplitWords
            as="h2"
            animateOnView
            text="Your first contract is closer than you think."
            className="font-display mt-5 text-4xl font-bold leading-[1.02] tracking-tight sm:text-6xl"
          />
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/75">
              Apply for the CGR Workshop. Our team will call you within 24 hours to understand your goals and share the
              investment details.
            </p>
            <ul className="mt-8 space-y-3 text-white/85">
              {["Limited seats per batch", "Pay in full or in instalments", "GST invoice for every payment"].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <span className="size-1.5 rounded-full bg-white" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <ApplyForm tone="glass" />
        </Reveal>
      </div>
    </section>
  );
}
