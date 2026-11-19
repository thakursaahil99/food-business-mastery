"use client";

import Image from "next/image";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { Building2, Factory, GraduationCap, HeartPulse } from "lucide-react";
import { Marquee, Reveal, SplitWords, Stagger } from "@/components/motion/primitives";
import { SectionLabel } from "./sections-program";

/**
 * Real photos from Red Bean Hospitality (redbeanhospitality.com), stored in /public/photos.
 * Swap or add files there; keep alt text descriptive.
 */

const SECTORS = [
  { src: "/photos/sector-hospitals.webp", title: "Hospitals", body: "Patient meals, staff canteens and NABH-ready kitchens.", icon: HeartPulse },
  { src: "/photos/sector-corporate.webp", title: "Corporate", body: "Cafeterias for IT parks, offices and campuses.", icon: Building2 },
  { src: "/photos/sector-institutions.webp", title: "Institutions", body: "Schools, colleges, hostels and training centres.", icon: GraduationCap },
  { src: "/photos/sector-industries.webp", title: "Industries", body: "High-volume canteens for plants and factories.", icon: Factory },
];

/** Four sector cards with real photos; the photo slowly zooms on hover. */
export function SectorsGallery({ heading = true }: { heading?: boolean }) {
  return (
    <section className="bg-cream-50 py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {heading && (
          <>
            <Reveal>
              <SectionLabel>Four sectors</SectionLabel>
            </Reveal>
            <SplitWords as="h2" animateOnView text="One playbook, four markets that eat every day." className="font-display mt-5 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-5xl" />
          </>
        )}
        <Stagger className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SECTORS.map(({ src, title, body, icon: Icon }) => (
            <article key={title} className="group relative h-full overflow-hidden rounded-[28px] bg-ink-900 text-white">
              <div className="relative aspect-[4/5] overflow-hidden">
                <Image src={src} alt={`${title} food service by Red Bean Hospitality`} fill sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-bean-600 shadow-lg transition-transform duration-500 group-hover:-rotate-6">
                  <Icon className="size-5" />
                </span>
                <h3 className="font-display mt-4 text-2xl font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-white/75">{body}</p>
              </div>
            </article>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/** Full-bleed community photo that opens up (clip-path) and settles (scale) as you scroll. */
export function CommunityPhoto() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const inset = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["12%", "0%"]);
  const radius = useTransform(scrollYProgress, [0, 1], reduce ? [28, 28] : [48, 28]);
  const scale = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [1.18, 1]);
  const clip = useMotionTemplate`inset(0% ${inset} round ${radius}px)`;

  return (
    <section ref={ref} className="bg-cream-100 pb-8 pt-24 sm:pt-32">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <Reveal>
          <SectionLabel>The community</SectionLabel>
        </Reveal>
        <SplitWords as="h2" animateOnView text="You won't be building alone." className="font-display mx-auto mt-5 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-6xl" />
      </div>
      <motion.div style={{ clipPath: clip }} className="relative mx-auto mt-14 aspect-[16/10] max-w-7xl overflow-hidden sm:aspect-[16/8]">
        <motion.div style={{ scale }} className="absolute inset-0">
          <Image src="/photos/community-group.webp" alt="Redbean Academy entrepreneurs together at a program meet-up" fill sizes="100vw" className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-left text-white sm:p-10">
          <div className="font-display text-3xl font-bold sm:text-5xl">350+</div>
          <div className="text-sm text-white/80 sm:text-base">entrepreneurs learning, sharing contracts and growing together</div>
        </div>
      </motion.div>
    </section>
  );
}

const AWARDS = [1, 2, 3, 4, 5, 6].map((n) => `/photos/award-${n}.webp`);

/** Moving strip of award moments; colour comes up on hover. */
export function AwardsStrip() {
  return (
    <section aria-label="Awards and recognition" className="overflow-hidden bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <SectionLabel>Recognition</SectionLabel>
        </Reveal>
        <SplitWords as="h2" animateOnView text="Recognised on national stages." className="font-display mt-5 max-w-3xl text-4xl font-bold leading-[1.02] tracking-tight text-ink-900 sm:text-5xl" />
        <Reveal delay={0.1}>
          <p className="mt-4 max-w-xl text-lg text-ink-400">Red Bean Hospitality has been honoured for its work in contract food services across India.</p>
        </Reveal>
      </div>
      <Marquee duration={50} className="mt-12 gap-5">
        {AWARDS.map((src, i) => (
          <div key={src} className="group relative h-56 w-[22rem] shrink-0 overflow-hidden rounded-3xl sm:h-64 sm:w-[30rem]">
            <Image src={src} alt={`Red Bean Hospitality award ceremony ${i + 1}`} fill sizes="480px" className="object-cover grayscale-[60%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" />
            <div className="absolute inset-0 ring-1 ring-inset ring-black/5" />
          </div>
        ))}
      </Marquee>
    </section>
  );
}
