"use client";

import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Student-portal design kit. Every page uses these so the portal stays consistent as it grows:
 * one header style, one card style, one set of status colours (always icon + words), one empty state.
 * Sizes are rem-based, so the "Text size" setting scales everything together.
 */

/** Card surface used everywhere in the portal: one border, one soft shadow, 16px radius. */
export const card = "rounded-[24px] border border-line bg-surface";

/** Page title + one line of help. Icons are passed for API stability but not drawn: the nav already shows them. */
export function PageHeader({ title, sub, actions }: { icon?: LucideIcon; title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-fg sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1.5 max-w-2xl text-base leading-relaxed text-fg-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Section({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** @deprecated entrance animations were removed; kept so callers compile */
  delay?: number;
}) {
  return (
    <section className={cn(card, "p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && (
            <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-fg">
              {Icon && <Icon className="size-[18px] text-fg-muted" strokeWidth={1.75} />}
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export type Tone = "good" | "bad" | "warn" | "info" | "neutral" | "brand";

export const toneCls: Record<Tone, string> = {
  good: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  bad: "bg-bean-50 text-bean-800 ring-bean-600/15",
  warn: "bg-amber-50 text-amber-900 ring-amber-600/20",
  info: "bg-sky-50 text-sky-800 ring-sky-600/15",
  neutral: "bg-surface-2 text-fg-muted ring-line",
  brand: "bg-bean-600 text-white ring-bean-600",
};

/** Status chip: colour + icon + words, never colour alone. */
export function StatusPill({ tone, icon: Icon, children, className }: { tone: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset", toneCls[tone], className)}>
      {Icon && <Icon className="size-4" />}
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-surface-2">
        <Icon className="size-7 text-fg-muted" />
      </span>
      <p className="mt-4 text-lg font-semibold text-fg">{title}</p>
      {body && <p className="mt-1 max-w-sm text-base text-fg-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Big on/off switch with its label on the left — easy to tap, clear state. */
export function ToggleRow({ label, hint, on, onChange, disabled }: { label: ReactNode; hint?: ReactNode; on: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className="flex min-h-16 w-full items-center gap-4 rounded-2xl px-1 py-2 text-left transition-colors hover:bg-surface-2/60 disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base font-medium text-fg">{label}</span>
        {hint && <span className="block text-sm text-fg-muted">{hint}</span>}
      </span>
      <span className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", on ? "bg-emerald-500" : "bg-ink-200")}>
        <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={cn("absolute top-1 size-6 rounded-full bg-white shadow", on ? "right-1" : "left-1")} />
      </span>
    </button>
  );
}
