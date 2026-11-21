import { Award, CalendarCheck, Check, Crown, FileText, LayoutDashboard, PlayCircle, Smartphone, Users, Video, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/motion/primitives";
import { ButtonLink } from "@/components/ui/button";
import { programAudience, programIncludes, programOutcomes, programRequirements } from "@/content/site";
import { SectionLabel } from "./sections-program";

const icons: Record<string, LucideIcon> = { Video, PlayCircle, FileText, Crown, LayoutDashboard, CalendarCheck, Smartphone, Award };

/**
 * Udemy-style program overview: what you'll learn (checklist), who it's for, requirements,
 * and a sticky "This program includes" card with the main CTAs.
 */
export function CourseIncludes() {
  return (
    <section className="bg-cream-50 py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-10">
          <Reveal>
            <SectionLabel>Program overview</SectionLabel>
            <div className="mt-5 rounded-3xl border border-line bg-white p-6 sm:p-8">
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">What you will learn</h2>
              <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3.5 md:grid-cols-2">
                {programOutcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-base leading-relaxed text-ink-700">
                    <Check className="mt-1 size-4 shrink-0 text-bean-600" strokeWidth={2.5} />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Reveal delay={0.05} className="rounded-3xl border border-line bg-white p-6 sm:p-7">
              <h3 className="font-display flex items-center gap-2 text-xl font-semibold text-ink-900">
                <Users className="size-5 text-bean-600" /> Who this program is for
              </h3>
              <ul className="mt-4 space-y-3">
                {programAudience.map((a) => (
                  <li key={a} className="flex items-start gap-3 text-base text-ink-700">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-bean-500" />
                    {a}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.1} className="rounded-3xl border border-line bg-white p-6 sm:p-7">
              <h3 className="font-display text-xl font-semibold text-ink-900">Requirements</h3>
              <ul className="mt-4 space-y-3">
                {programRequirements.map((r) => (
                  <li key={r} className="flex items-start gap-3 text-base text-ink-700">
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink-300" />
                    {r}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <Reveal delay={0.1} className="overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_60px_-30px_rgb(0_0_0/0.25)]">
            <div className="bg-ink-950 px-6 py-5 text-white">
              <div className="text-sm text-white/60">CGR Food Contract Mastery Program</div>
              <div className="font-display mt-1 text-2xl font-bold">This program includes</div>
            </div>
            <ul className="space-y-3.5 p-6">
              {programIncludes.map(({ icon, text }) => {
                const Icon = icons[icon] ?? Check;
                return (
                  <li key={text} className="flex items-start gap-3 text-base text-ink-700">
                    <Icon className="mt-0.5 size-5 shrink-0 text-bean-600" />
                    {text}
                  </li>
                );
              })}
            </ul>
            <div className="space-y-2.5 border-t border-line p-6">
              <ButtonLink href="#apply" size="lg" className="w-full">
                Apply for CGR Workshop
              </ButtonLink>
              <ButtonLink href="#investment" variant="outline" size="lg" className="w-full">
                Get investment details
              </ButtonLink>
              <p className="pt-1 text-center text-sm text-ink-400">Pay in full or in instalments · GST invoice</p>
            </div>
          </Reveal>
        </aside>
      </div>
    </section>
  );
}
