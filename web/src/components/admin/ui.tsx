"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, CheckCircle2, Circle, Clock, PhoneCall, RotateCcw, Table2, XCircle, type LucideIcon } from "lucide-react";
import { Counter } from "@/components/motion/primitives";
import type { LeadStatus, PaymentRow } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
};

export function PageHeader({ title, sub, actions }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  return (
    <motion.div variants={fadeUp} className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-fg sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-fg-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </motion.div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
      {children}
    </motion.div>
  );
}

export function Card({ children, className, title, action }: { children: ReactNode; className?: string; title?: ReactNode; action?: ReactNode }) {
  return (
    <motion.section variants={fadeUp} className={cn("rounded-[24px] border border-line bg-surface p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-lg font-semibold text-fg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </motion.section>
  );
}

/** Hero-number tile. */
export function Kpi({
  icon: Icon,
  label,
  value,
  prefix = "",
  suffix = "",
  delta,
  hint,
  dark,
  format,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta?: number;
  hint?: string;
  dark?: boolean;
  format?: (n: number) => string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "group relative overflow-hidden rounded-[22px] border p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgb(0_0_0/0.35)]",
        dark ? "border-ink-800 bg-ink-950 text-white grain" : "border-line bg-surface",
      )}
    >
      {dark && <div aria-hidden className="absolute -right-10 -top-10 size-36 rounded-full bg-bean-600/40 blur-2xl" />}
      <div className="relative flex items-center justify-between">
        <span className={cn("grid size-9 place-items-center rounded-xl", dark ? "bg-white/10 text-bean-300" : "bg-surface-2 text-fg")}>
          <Icon className="size-4" />
        </span>
        {delta !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", up ? (dark ? "bg-emerald-400/15 text-emerald-300" : "bg-emerald-50 text-emerald-700") : "bg-bean-50 text-bean-700")}>
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className={cn("font-display relative mt-4 text-3xl font-bold tracking-tight", dark ? "text-white" : "text-fg")}>
        {prefix}
        <Counter to={value} suffix={suffix} format={format} />
      </div>
      <div className={cn("relative mt-0.5 text-xs", dark ? "text-white/50" : "text-fg-muted")}>
        {label}
        {hint ? ` · ${hint}` : ""}
      </div>
    </motion.div>
  );
}

/* ───────── Status pills: reserved colours, always icon + label ───────── */

const leadUi: Record<LeadStatus, { label: string; icon: LucideIcon; cls: string }> = {
  new: { label: "New", icon: Circle, cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  contacted: { label: "Contacted", icon: PhoneCall, cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, cls: "bg-ink-100 text-ink-500 ring-ink-200" },
};

const payUi: Record<PaymentRow["status"], { label: string; icon: LucideIcon; cls: string }> = {
  captured: { label: "Paid", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  pending: { label: "Pending", icon: Clock, cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  failed: { label: "Failed", icon: AlertTriangle, cls: "bg-bean-50 text-bean-700 ring-bean-200" },
  refunded: { label: "Refunded", icon: RotateCcw, cls: "bg-ink-100 text-ink-600 ring-ink-200" },
};

function Pill({ ui }: { ui: { label: string; icon: LucideIcon; cls: string } }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset", ui.cls)}>
      <ui.icon className="size-3" />
      {ui.label}
    </span>
  );
}

export const LeadPill = ({ status }: { status: LeadStatus }) => <Pill ui={leadUi[status]} />;
export const PaymentPill = ({ status }: { status: PaymentRow["status"] }) => <Pill ui={payUi[status]} />;
export const leadStatusLabel = (s: LeadStatus) => leadUi[s].label;

export function Avatar({ name, className }: { name: string; className?: string }) {
  const ini = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
  return <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ink-700 to-ink-900 text-xs font-semibold text-white", className)}>{ini}</span>;
}

export function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("block h-1.5 w-full overflow-hidden rounded-full bg-surface-2", className)}>
      <motion.span initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1, delay: 0.2, ease: EASE }} className="block h-full rounded-full bg-gradient-to-r from-bean-400 to-bean-600" />
    </span>
  );
}

/* ───────── Charts ───────── */

const compactINR = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2).replace(/\.0+$/, "")}L` : formatINR(n));

/** Single-series monthly revenue. No legend (the title names it); hover tooltip; table toggle. */
export function RevenueChart({ data }: { data: { month: string; amount: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 640;
  const H = 240;
  const pad = { t: 16, r: 8, b: 28, l: 48 };
  const max = Math.ceil(Math.max(...data.map((d) => d.amount)) / 500000) * 500000;
  const ticks = [0, max / 4, max / 2, (max * 3) / 4, max];
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const slot = iw / data.length;
  const bw = Math.min(56, slot * 0.56);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const last = data.length - 1;

  return (
    <Card
      title="Revenue, last 6 months"
      action={
        <button onClick={() => setTable((t) => !t)} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs", table ? "border-ink-900 bg-ink-900 text-white" : "border-line text-fg-muted hover:text-fg")} aria-pressed={table}>
          <Table2 className="size-3.5" /> Table
        </button>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {table ? (
          <motion.table key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-fg-muted">
                <th className="py-2 font-medium">Month</th>
                <th className="py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((d) => (
                <tr key={d.month}>
                  <td className="py-2 text-fg">{d.month}</td>
                  <td className="py-2 text-right tabular-nums text-fg">{formatINR(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </motion.table>
        ) : (
          <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Revenue by month: ${data.map((d) => `${d.month} ${formatINR(d.amount)}`).join(", ")}`}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} strokeDasharray={t === 0 ? undefined : "2 4"} />
                  <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-fg-muted text-[10px]">
                    {t === 0 ? "0" : compactINR(t)}
                  </text>
                </g>
              ))}
              {data.map((d, i) => {
                const x = pad.l + slot * i + (slot - bw) / 2;
                const top = y(d.amount);
                const h = pad.t + ih - top;
                const r = Math.min(4, h);
                const active = hover === i;
                return (
                  <g key={d.month} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                    <rect x={pad.l + slot * i} y={pad.t} width={slot} height={ih} fill="transparent" />
                    <motion.path
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.15 + i * 0.07, duration: 0.8, ease: EASE }}
                      style={{ transformOrigin: `0px ${pad.t + ih}px` }}
                      d={`M${x},${pad.t + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${pad.t + ih} Z`}
                      className={cn("transition-[fill] duration-200", i === last ? "fill-bean-600" : active ? "fill-bean-400" : "fill-bean-200")}
                    />
                    <text x={pad.l + slot * i + slot / 2} y={H - 8} textAnchor="middle" className={cn("text-[11px]", i === last ? "fill-fg font-semibold" : "fill-fg-muted")}>
                      {d.month}
                    </text>
                    {i === last && (
                      <text x={x + bw / 2} y={top - 8} textAnchor="middle" className="fill-fg text-[11px] font-semibold">
                        {compactINR(d.amount)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <AnimatePresence>
              {hover !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute top-0 rounded-xl bg-ink-900 px-3 py-2 text-xs text-white shadow-xl"
                  style={{ left: `${((pad.l + slot * hover + slot / 2) / W) * 100}%`, transform: "translateX(-50%)" }}
                >
                  <div className="text-white/60">{data[hover]!.month}</div>
                  <div className="font-semibold tabular-nums">{formatINR(data[hover]!.amount)}</div>
                  {hover > 0 && (
                    <div className="text-white/60">
                      {(((data[hover]!.amount - data[hover - 1]!.amount) / data[hover - 1]!.amount) * 100).toFixed(0)}% vs {data[hover - 1]!.month}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/** Admissions funnel as ranked horizontal bars (one hue), each with count + step conversion. */
export function FunnelChart({ data }: { data: { stage: string; count: number }[] }) {
  const max = data[0]?.count ?? 1;
  const [hover, setHover] = useState<number | null>(null);
  return (
    <Card title="Admissions funnel" action={<span className="text-xs text-fg-muted">Last 90 days</span>}>
      <ul className="space-y-3">
        {data.map((d, i) => {
          const conv = i === 0 ? null : Math.round((d.count / data[i - 1]!.count) * 100);
          return (
            <li key={d.stage} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} className="group">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-fg">{d.stage}</span>
                <span className="tabular-nums text-fg">
                  {d.count}
                  {conv !== null && <span className="ml-1.5 text-xs text-fg-muted">{conv}%</span>}
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.count / max) * 100}%` }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.9, ease: EASE }}
                  className={cn("h-full rounded-full transition-colors", hover === i ? "bg-bean-500" : "bg-bean-600")}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-fg-muted">
        Overall conversion <span className="font-semibold text-fg">{Math.round(((data.at(-1)?.count ?? 0) / max) * 100)}%</span> from application to enrolment.
      </p>
    </Card>
  );
}

/** Pill tabs with a sliding indicator. */
export function Tabs<T extends string>({ id, value, onChange, options }: { id: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[] }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} className={cn("relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors", on ? "text-white" : "text-fg-muted hover:bg-surface-2 hover:text-fg")}>
            {on && <motion.span layoutId={`tabs-${id}`} transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-full bg-ink-900" />}
            <span className="relative">{o.label}</span>
            {o.count !== undefined && <span className={cn("relative rounded-full px-1.5 text-[11px] tabular-nums", on ? "bg-white/15" : "bg-surface-2")}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-xl border border-line bg-surface px-4 text-sm outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5 sm:max-w-xs"
    />
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong py-14 text-sm text-fg-muted">{children}</div>;
}
