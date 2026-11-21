import type { Metadata } from "next";
import { CalendarDays, GraduationCap, Users, Video } from "lucide-react";
import { Reveal, SplitWords, Stagger } from "@/components/motion/primitives";
import { ButtonLink } from "@/components/ui/button";
import { Curriculum, Pillars, SectionLabel } from "@/components/marketing/sections-program";
import { Benefits } from "@/components/marketing/sections-academy";
import { ApplySection, Faq } from "@/components/marketing/sections-close";
import { AwardsStrip, SectorsGallery } from "@/components/marketing/photo-sections";
import { CourseIncludes } from "@/components/marketing/course-includes";

export const metadata: Metadata = {
  title: "CGR Food Contract Mastery Program",
  description:
    "A 4-month practical workshop by Bobby Singh on building a contract food business across corporate, hospital, institutional and industrial catering.",
};

const facts = [
  { icon: CalendarDays, k: "Duration", v: "16 weeks" },
  { icon: Video, k: "Format", v: "Live online + recordings" },
  { icon: Users, k: "Batch size", v: "40 seats" },
  { icon: GraduationCap, k: "Outcome", v: "Verifiable certificate" },
];

export default function ProgramPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 pb-24 pt-40 text-white grain">
        <div aria-hidden className="absolute inset-0 line-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div aria-hidden className="absolute -right-40 top-0 size-[44rem] rounded-full bg-bean-600/30 blur-[150px]" />
        <div className="relative mx-auto max-w-6xl px-6">
          <Reveal>
            <SectionLabel dark>Flagship program · CMS Mastery</SectionLabel>
          </Reveal>
          <h1 className="font-display mt-6 max-w-4xl text-5xl font-bold leading-[0.95] tracking-tight sm:text-7xl">
            <SplitWords text="CGR Food Contract" />
            <br />
            <SplitWords text="Mastery Program" delay={0.25} className="font-serif font-normal italic" wordClassName="text-gradient-bean" />
          </h1>
          <Reveal delay={0.5}>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
              A 4-month practical workshop on the Cost-plus Management System: how to price, win and run food contracts
              that generate cash, growth and royalty.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="#apply" size="lg">Apply for CGR Workshop</ButtonLink>
              <ButtonLink href="#investment" variant="ghostDark" size="lg">Investment details</ButtonLink>
            </div>
          </Reveal>
          <Stagger className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 lg:grid-cols-4" delay={0.6}>
            {facts.map(({ icon: Icon, k, v }) => (
              <div key={k} className="h-full bg-ink-950/80 p-6 backdrop-blur">
                <Icon className="size-5 text-bean-400" />
                <div className="mt-4 text-xs uppercase tracking-[0.2em] text-white/40">{k}</div>
                <div className="font-display mt-1 text-lg font-semibold">{v}</div>
              </div>
            ))}
          </Stagger>
        </div>
      </section>

      <CourseIncludes />

      <SectorsGallery />

      <Pillars />
      <Curriculum />
      <Benefits />

      <section id="investment" className="bg-white py-28">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal className="relative overflow-hidden rounded-[32px] border border-line bg-cream-50 p-8 sm:p-12">
            <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full bg-bean-500/10 blur-3xl" />
            <SectionLabel>Investment</SectionLabel>
            <h2 className="font-display mt-5 text-3xl font-bold tracking-tight text-ink-900 sm:text-5xl">Next batch starts soon.</h2>
            <p className="mt-4 max-w-xl text-ink-400">
              Fees are shared on your discovery call so we can recommend the right plan. Pay in full or choose an
              instalment plan. Every payment comes with a GST invoice.
            </p>
            <div className="mt-8">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-ink-900">Batch 08 seats</span>
                <span className="text-ink-400">29 of 40 reserved</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100">
                <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-bean-500 to-bean-700" />
              </div>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <ButtonLink href="#apply" size="lg">Get investment details</ButtonLink>
              <ButtonLink href="/login" variant="outline" size="lg">Already enrolled? Log in</ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      <AwardsStrip />
      <Faq />
      <ApplySection />
    </>
  );
}
