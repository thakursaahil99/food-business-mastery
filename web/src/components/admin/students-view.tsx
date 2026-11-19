"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Mail, MessageCircle, X } from "lucide-react";
import type { StudentRow } from "@/lib/types";
import { cn, fmtDate, formatINR } from "@/lib/utils";
import { Avatar, Bar, Empty, Page, PageHeader, SearchInput, Tabs, fadeUp } from "./ui";

export function StudentsView({ students, serverNow }: { students: StudentRow[]; serverNow: number }) {
  const batches = useMemo(() => [...new Set(students.map((s) => s.batchName))], [students]);
  const [batch, setBatch] = useState<string>("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<StudentRow | null>(null);

  const shown = students.filter((s) => (batch === "all" || s.batchName === batch) && (!q || `${s.name} ${s.email} ${s.phone}`.toLowerCase().includes(q.toLowerCase())));

  const payState = (s: StudentRow) => {
    if (s.paid >= s.total) return { label: "Paid in full", cls: "text-emerald-700" };
    if (s.nextDue && +new Date(s.nextDue) < serverNow) return { label: `Overdue ${fmtDate(s.nextDue)}`, cls: "text-bean-600 font-medium" };
    return { label: s.nextDue ? `Next due ${fmtDate(s.nextDue)}` : "—", cls: "text-fg-muted" };
  };

  return (
    <Page>
      <PageHeader title="Students" sub={`${students.length} enrolled across ${batches.length} batches`} />
      <motion.div variants={fadeUp} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs id="batch" value={batch} onChange={setBatch} options={[{ value: "all", label: "All batches", count: students.length }, ...batches.map((b) => ({ value: b, label: b.split(" · ")[0]!, count: students.filter((s) => s.batchName === b).length }))]} />
        <SearchInput value={q} onChange={setQ} placeholder="Search students…" />
      </motion.div>

      <motion.div variants={fadeUp} className="overflow-x-auto rounded-[24px] border border-line bg-surface">
        {shown.length === 0 ? (
          <div className="p-5">
            <Empty>No students match.</Empty>
          </div>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-fg-muted">
                <th className="px-5 py-3 font-medium">Student</th>
                <th className="px-3 py-3 font-medium">Batch</th>
                <th className="w-36 px-3 py-3 font-medium">Progress</th>
                <th className="px-3 py-3 font-medium">Attendance</th>
                <th className="px-5 py-3 font-medium">Fees</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((s, i) => {
                const pay = payState(s);
                return (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 12) * 0.03 }}
                    onClick={() => setSel(s)}
                    className={cn("cursor-pointer transition-colors hover:bg-surface-2/60", s.status === "cancelled" && "opacity-50")}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-fg">{s.name}</div>
                          <div className="truncate text-xs text-fg-muted">{s.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-fg-muted">
                      {s.batchName.split(" · ")[0]}
                      <span className="ml-1.5 text-[11px] capitalize">· {s.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <Bar value={s.progressPct} />
                        <span className="w-9 text-right text-xs tabular-nums text-fg-muted">{s.progressPct}%</span>
                      </div>
                    </td>
                    <td className={cn("px-3 py-3 tabular-nums", s.attendancePct < 75 ? "font-medium text-bean-600" : "text-fg")}>{s.attendancePct}%</td>
                    <td className="px-5 py-3">
                      <div className="tabular-nums text-fg">
                        {formatINR(s.paid)} <span className="text-xs text-fg-muted">/ {formatINR(s.total)}</span>
                      </div>
                      <div className={cn("text-xs", pay.cls)}>{pay.label}</div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

      <AnimatePresence>
        {sel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSel(null)} className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-sm" />
            <motion.aside role="dialog" aria-modal aria-label={sel.name} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-surface shadow-2xl">
              <div className="relative overflow-hidden bg-ink-950 p-6 text-white">
                <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-bean-600/40 blur-3xl" />
                <button onClick={() => setSel(null)} className="relative ml-auto grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
                  <X className="size-4" />
                </button>
                <div className="relative flex items-center gap-4">
                  <Avatar name={sel.name} className="size-14 rounded-2xl from-bean-400 to-bean-700 text-lg" />
                  <div>
                    <h2 className="font-display text-2xl font-semibold">{sel.name}</h2>
                    <p className="text-sm text-white/55">{sel.batchName}</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-5 overflow-y-auto p-6 text-sm" data-lenis-prevent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Progress", `${sel.progressPct}%`],
                    ["Attendance", `${sel.attendancePct}%`],
                    ["Paid", formatINR(sel.paid)],
                    ["Balance", formatINR(sel.total - sel.paid)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl bg-surface-2 p-4">
                      <div className="text-xs text-fg-muted">{k}</div>
                      <div className="font-display mt-1 text-xl font-bold text-fg">{v}</div>
                    </div>
                  ))}
                </div>
                <dl className="space-y-3">
                  {[
                    ["Email", sel.email],
                    ["Phone", sel.phone],
                    ["Enrolled", fmtDate(sel.joinedAt)],
                    ["Status", sel.status],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line pb-3">
                      <dt className="text-fg-muted">{k}</dt>
                      <dd className="truncate capitalize text-fg">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="flex flex-wrap gap-2 border-t border-line p-5">
                <Link href={`/admin/students/${sel.id}`} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink-900 text-sm font-semibold text-white hover:bg-ink-700">
                  View full profile & analytics
                </Link>
                <a href={`https://wa.me/${sel.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500">
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
                <a href={`mailto:${sel.email}`} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-line text-sm font-medium text-fg hover:bg-surface-2">
                  <Mail className="size-4" /> Email
                </a>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </Page>
  );
}
