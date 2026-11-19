"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, Table2 } from "lucide-react";
import type { Bar } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "./ui";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Chart rules (dataviz skill): one series per chart in brand red, no legend (the title names it),
 * thin marks with 4px rounded data-ends on the baseline, recessive grid, hover tooltip on every mark,
 * and a table view for every chart. Text uses text colours, never the series colour.
 */

function TableToggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button onClick={() => set(!on)} aria-pressed={on} className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs", on ? "border-ink-900 bg-ink-900 text-white" : "border-line text-fg-muted hover:text-fg")}>
      <Table2 className="size-3.5" /> Table
    </button>
  );
}

function DataTable({ data, fmt, valueLabel }: { data: Bar[]; fmt: (n: number) => string; valueLabel: string }) {
  return (
    <motion.table key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs text-fg-muted">
          <th className="py-2 font-medium">Item</th>
          <th className="py-2 text-right font-medium">{valueLabel}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {data.map((d) => (
          <tr key={d.label}>
            <td className="py-2 pr-3 text-fg">{d.label}</td>
            <td className="py-2 text-right tabular-nums text-fg">
              {fmt(d.value)}
              {d.note && !d.note.startsWith(String(d.value)) ? <span className="ml-2 text-xs text-fg-muted">{d.note}</span> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </motion.table>
  );
}

/** Vertical bars for a series over time (months, weeks). The last bar is emphasised. */
export function ColumnChart({
  title,
  data,
  fmt = (n) => String(n),
  axisFmt,
  max: maxIn,
  valueLabel = "Value",
  action,
  height = 220,
}: {
  title: ReactNode;
  data: Bar[];
  fmt?: (n: number) => string;
  axisFmt?: (n: number) => string;
  max?: number;
  valueLabel?: string;
  action?: ReactNode;
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 640;
  const H = height;
  const pad = { t: 22, r: 8, b: 26, l: 52 };
  const raw = maxIn ?? Math.max(...data.map((d) => d.value), 1);
  const step = Math.pow(10, Math.floor(Math.log10(raw)));
  const max = maxIn ?? Math.ceil(raw / step) * step;
  const ticks = [0, max / 2, max];
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const slot = iw / data.length;
  const bw = Math.max(6, Math.min(44, slot - 2 * Math.max(2, slot * 0.2)));
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const last = data.length - 1;
  const ax = axisFmt ?? fmt;

  return (
    <Card title={title} action={<span className="flex items-center gap-2">{action}<TableToggle on={table} set={setTable} /></span>}>
      <AnimatePresence mode="wait" initial={false}>
        {table ? (
          <DataTable data={data} fmt={fmt} valueLabel={valueLabel} />
        ) : (
          <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`${typeof title === "string" ? title : "Chart"}: ${data.map((d) => `${d.label} ${fmt(d.value)}`).join(", ")}`}>
              {ticks.map((t) => (
                <g key={t}>
                  <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-line" strokeWidth={1} strokeDasharray={t === 0 ? undefined : "2 4"} />
                  <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-fg-muted text-[10px]">
                    {t === 0 ? "0" : ax(t)}
                  </text>
                </g>
              ))}
              {data.map((d, i) => {
                const x = pad.l + slot * i + (slot - bw) / 2;
                const top = y(d.value);
                const h = pad.t + ih - top;
                const r = Math.min(4, h);
                return (
                  <g key={d.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
                    <rect x={pad.l + slot * i} y={pad.t} width={slot} height={ih} fill="transparent" />
                    <motion.path
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ delay: 0.1 + i * 0.04, duration: 0.7, ease: EASE }}
                      style={{ transformOrigin: `0px ${pad.t + ih}px` }}
                      d={`M${x},${pad.t + ih} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${pad.t + ih} Z`}
                      className={cn("transition-[fill] duration-200", i === last ? "fill-bean-600" : hover === i ? "fill-bean-400" : "fill-bean-200")}
                    />
                    {(data.length <= 12 || i % 2 === 0) && (
                      <text x={pad.l + slot * i + slot / 2} y={H - 8} textAnchor="middle" className={cn("text-[10px]", i === last ? "fill-fg font-semibold" : "fill-fg-muted")}>
                        {d.label}
                      </text>
                    )}
                    {i === last && (
                      <text x={x + bw / 2} y={top - 7} textAnchor="middle" className="fill-fg text-[11px] font-semibold">
                        {fmt(d.value)}
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
                  className="pointer-events-none absolute top-0 whitespace-nowrap rounded-xl bg-ink-900 px-3 py-2 text-xs text-white shadow-xl"
                  style={{ left: `${((pad.l + slot * hover + slot / 2) / W) * 100}%`, transform: "translateX(-50%)" }}
                >
                  <div className="text-white/60">{data[hover]!.label}</div>
                  <div className="font-semibold tabular-nums">{fmt(data[hover]!.value)}</div>
                  {data[hover]!.note && <div className="text-white/60">{data[hover]!.note}</div>}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/** Ranked horizontal bars (categories). Each row is labelled, so no legend is needed. */
export function BarList({
  title,
  data,
  fmt = (n) => String(n),
  max: maxIn,
  valueLabel = "Value",
  action,
  footer,
  danger,
}: {
  title: ReactNode;
  data: Bar[];
  fmt?: (n: number) => string;
  max?: number;
  valueLabel?: string;
  action?: ReactNode;
  footer?: ReactNode;
  /** Highlight rows below this value (e.g. completion under 60%). */
  danger?: number;
}) {
  const [table, setTable] = useState(false);
  const [hover, setHover] = useState<number | null>(null);
  const max = maxIn ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <Card title={title} action={<span className="flex items-center gap-2">{action}<TableToggle on={table} set={setTable} /></span>}>
      <AnimatePresence mode="wait" initial={false}>
        {table ? (
          <DataTable data={data} fmt={fmt} valueLabel={valueLabel} />
        ) : (
          <motion.ul key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3.5">
            {data.map((d, i) => {
              const low = danger !== undefined && d.value < danger;
              const row = (
                <>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-fg">{d.label}</span>
                    <span className="shrink-0 tabular-nums text-fg">
                      {fmt(d.value)}
                      {d.note && <span className="ml-1.5 text-xs text-fg-muted">{d.note}</span>}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.value / max) * 100}%` }}
                      transition={{ delay: 0.15 + i * 0.06, duration: 0.8, ease: EASE }}
                      className={cn("h-full rounded-full transition-colors", hover === i ? "bg-bean-500" : low ? "bg-bean-700" : "bg-bean-600")}
                    />
                  </div>
                </>
              );
              return (
                <li key={d.label} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} title={`${d.label}: ${fmt(d.value)}${d.note ? ` (${d.note})` : ""}`}>
                  {d.href ? (
                    <Link href={d.href} className="group block">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
      {footer && <div className="mt-4 text-xs text-fg-muted">{footer}</div>}
    </Card>
  );
}

export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-0.5 text-sm font-medium text-bean-600">
      {children}
      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
