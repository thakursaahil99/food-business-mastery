"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, useTransition, type ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitLead } from "@/lib/actions/lead";
import { leadSchema, type LeadForm } from "@/lib/schemas";
import { cn } from "@/lib/utils";


type Tone = "glass" | "light";

export function ApplyForm({ tone = "light", source = "website" }: { tone?: Tone; source?: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LeadForm>({ resolver: zodResolver(leadSchema), defaultValues: { name: "", email: "", phone: "", businessGoals: "", source } });

  const onSubmit = handleSubmit((values) =>
    start(async () => {
      const res = await submitLead(values);
      if (res.ok) {
        setDone(values.name.split(" ")[0] ?? "");
        return;
      }
      for (const [k, v] of Object.entries(res.fieldErrors ?? {})) {
        setError(k as keyof LeadForm, { message: v[0] });
      }
      toast.error(res.error);
    }),
  );

  const glass = tone === "glass";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] p-7 sm:p-9",
        glass ? "border border-white/20 bg-white/10 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.5)] backdrop-blur-2xl" : "border border-line bg-white shadow-[0_40px_80px_-40px_rgb(0_0_0/0.25)]",
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {done !== null ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <SuccessCheck light={glass} />
            <h3 className={cn("font-display mt-8 text-3xl font-semibold tracking-tight", glass ? "text-white" : "text-ink-900")}>
              Thank you{done ? `, ${done}` : ""}!
            </h3>
            <p className={cn("mt-3 max-w-xs", glass ? "text-white/70" : "text-ink-400")}>
              Your application is in. The Redbean team will reach out on WhatsApp within 24 hours.
            </p>
          </motion.div>
        ) : (
          <motion.form key="form" exit={{ opacity: 0, y: -10 }} onSubmit={onSubmit} noValidate className="space-y-4">
            <h3 className={cn("font-display text-2xl font-semibold tracking-tight", glass ? "text-white" : "text-ink-900")}>Apply for CGR Workshop</h3>
            <Field tone={tone} label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field tone={tone} label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
              <Field tone={tone} label="WhatsApp number" type="tel" inputMode="tel" autoComplete="tel" error={errors.phone?.message} {...register("phone")} />
            </div>
            <Field tone={tone} as="textarea" label="Your business goals" error={errors.businessGoals?.message} {...register("businessGoals")} />
            <Button type="submit" size="lg" variant={glass ? "light" : "primary"} disabled={pending} className={cn("w-full", glass && "text-bean-700")}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {pending ? "Submitting…" : "Submit application"}
              {!pending && <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />}
            </Button>
            <p className={cn("text-center text-xs", glass ? "text-white/55" : "text-ink-400")}>We&apos;ll never share your details. No spam, ever.</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

type FieldProps = {
  label: string;
  error?: string;
  tone: Tone;
  as?: "input" | "textarea";
} & ComponentProps<"input">;

function Field({ label, error, tone, as = "input", className, ...props }: FieldProps) {
  const id = useId();
  const glass = tone === "glass";
  const base = cn(
    "peer block w-full rounded-2xl border bg-transparent px-4 pb-2.5 pt-6 text-[15px] outline-none transition-all duration-300",
    glass
      ? "border-white/20 text-white placeholder-transparent focus:border-white/60 focus:bg-white/5"
      : "border-line-strong text-ink-900 focus:border-bean-500 focus:ring-4 focus:ring-bean-500/10",
    error && (glass ? "border-white" : "border-bean-500"),
    className,
  );
  return (
    <div>
      <div className="relative">
        {as === "textarea" ? (
          <textarea id={id} rows={3} placeholder=" " className={cn(base, "resize-none")} aria-invalid={!!error} {...(props as ComponentProps<"textarea">)} />
        ) : (
          <input id={id} placeholder=" " className={base} aria-invalid={!!error} {...props} />
        )}
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-4 top-4 origin-left text-[15px] transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] peer-focus:top-2 peer-focus:scale-75",
            "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:scale-75",
            glass ? "text-white/60 peer-focus:text-white" : "text-ink-400 peer-focus:text-bean-600",
          )}
        >
          {label}
        </label>
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn("px-1 pt-1.5 text-xs", glass ? "text-white" : "text-bean-600")}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SuccessCheck({ light = false }: { light?: boolean }) {
  return (
    <div className="relative grid size-24 place-items-center">
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className={cn("absolute inset-0 rounded-full", light ? "bg-white" : "bg-emerald-500")}
      />
      <motion.span
        initial={{ scale: 0.8, opacity: 0.8 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 1.2, delay: 0.2 }}
        className={cn("absolute inset-0 rounded-full", light ? "bg-white" : "bg-emerald-500")}
      />
      <svg viewBox="0 0 24 24" className={cn("relative size-11", light ? "text-bean-600" : "text-white")} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }} />
      </svg>
    </div>
  );
}
