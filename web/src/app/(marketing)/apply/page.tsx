import type { Metadata } from "next";
import { Check } from "lucide-react";
import { ApplyForm } from "@/components/marketing/apply-form";
import { Reveal, SplitWords } from "@/components/motion/primitives";

export const metadata: Metadata = {
  title: "Apply for the CGR Workshop",
  description: "Apply for Bobby Singh's 4-month CGR Food Contract Mastery Program. Our team calls you within 24 hours.",
};

const steps = [
  ["Apply", "Share your details and business goals."],
  ["Discovery call", "Our team calls within 24 hours to understand where you are."],
  ["Investment details", "Get the fee, instalment options and batch dates."],
  ["Enrol", "Pay securely via Razorpay and get instant portal access."],
];

export default function ApplyPage() {
  return (
    <section className="relative min-h-dvh overflow-hidden bg-ink-950 pb-24 pt-36 text-white grain">
      <div aria-hidden className="absolute inset-0 line-grid [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div aria-hidden className="absolute -top-40 left-1/4 size-[40rem] rounded-full bg-bean-600/25 blur-[140px]" />
      <div className="relative mx-auto grid grid-cols-1 max-w-6xl gap-14 px-6 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <SplitWords as="h1" text="Apply for the CGR Workshop." className="font-display text-5xl font-bold leading-[0.98] tracking-tight sm:text-7xl" />
          <Reveal delay={0.4}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-white/60">
              Four steps from here to your first class with Bobby Singh.
            </p>
            <ol className="mt-10 space-y-6">
              {steps.map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 font-mono text-sm text-bean-300">
                    {i === 0 ? <Check className="size-4" /> : i + 1}
                  </span>
                  <div>
                    <div className="font-semibold">{t}</div>
                    <div className="text-sm text-white/50">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <ApplyForm tone="glass" source="apply-page" />
        </Reveal>
      </div>
    </section>
  );
}
