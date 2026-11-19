"use client";

import { PageHeader } from "./ui";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { AlertCircle, Building2, CheckCircle2, Clock, Download, IndianRupee, Loader2, Pencil, ShieldCheck, X, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { BillingProfile, PaymentSummary } from "@/lib/types";
import { saveBillingProfile } from "@/lib/actions/student";
import { useT, useFmt } from "@/components/i18n";
import { cn, formatINR } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const statusUi = {
  paid: { label: "Paid", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  due: { label: "Due", icon: AlertCircle, cls: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  overdue: { label: "Overdue", icon: AlertCircle, cls: "bg-bean-50 text-bean-700", dot: "bg-bean-500" },
  upcoming: { label: "Upcoming", icon: Clock, cls: "bg-surface-2 text-fg-muted", dot: "bg-ink-200" },
} as const;

export function PaymentsView({ summary, programTitle, billing: initialBilling }: { summary: PaymentSummary; programTitle: string; billing: BillingProfile | null }) {
  const { fmtDate } = useFmt();
  const T = useT().t.payments;
  const [billing, setBilling] = useState(initialBilling);
  const [editing, setEditing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pct = Math.round((summary.paid / summary.total) * 100);
  const due = summary.installments.find((i) => i.status === "due" || i.status === "overdue");

  const pay = () =>
    // Wired to POST /payments/order → Razorpay Checkout in the payments phase.
    toast("Razorpay checkout connects in the payments phase", { description: "Order creation + webhook verification happen on the Laravel API." });

  return (
    <div className="space-y-6">
      <PageHeader icon={Wallet} title={T.title} sub={<>{programTitle} · {T.sub(summary.gstPct)}</>} />

      <AnimatePresence>
        {!billing && !dismissed && !editing && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <Building2 className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-amber-900">{T.billingMissing}</div>
              <div className="text-sm text-amber-900">{T.billingMissingBody}</div>
            </div>
            <Button size="sm" className="bg-amber-500 shadow-none hover:bg-amber-600" onClick={() => setEditing(true)}>
              {T.addNow}
            </Button>
            <button onClick={() => setDismissed(true)} className="grid size-8 place-items-center rounded-full text-amber-700 hover:bg-amber-100" aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className="relative overflow-hidden rounded-2xl bg-surface border border-line p-6 text-fg sm:p-8">
          <div className="relative">
            <div className="text-base text-fg-muted">{T.paidSoFar}</div>
            <div className="mt-2 text-5xl font-bold tracking-tight">{formatINR(summary.paid)}</div>
            <div className="mt-1 text-base text-fg-muted">{T.ofTotal(formatINR(summary.total))}</div>
            <div className="mt-8 h-3 overflow-hidden rounded-full bg-surface-2">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: EASE }} className="relative h-full rounded-full bg-bean-600">
                <span className="absolute inset-0 animate-shimmer shimmer-bg opacity-60" />
              </motion.div>
            </div>
            <div className="mt-2 flex justify-between text-sm text-fg-muted">
              <span>{T.complete(pct)}</span>
              <span>{T.remaining(formatINR(summary.total - summary.paid))}</span>
            </div>
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.08, ease: EASE }} className={cn("flex flex-col rounded-2xl border p-6 sm:p-8", due ? "border-amber-300 bg-amber-50/60" : "border-line bg-surface")}>
          {due ? (
            <>
              <div className="flex items-center gap-2 text-base font-semibold text-amber-900">
                <AlertCircle className="size-5" /> {T.due(due.label, fmtDate(due.dueDate))}
              </div>
              <div className="mt-3 text-4xl font-bold tracking-tight text-fg">{formatINR(due.amount)}</div>
              <div className="mt-1 text-sm text-fg-muted">+ {formatINR((due.amount * summary.gstPct) / 100)} GST</div>
              <Button size="lg" onClick={pay} className="mt-auto w-full">
                <IndianRupee /> {T.payNow}
              </Button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-fg-muted">
                <ShieldCheck className="size-4" /> {T.secure}
              </p>
            </>
          ) : (
            <div className="m-auto text-center">
              <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
              <p className="mt-3 text-lg font-medium text-fg">{T.caughtUp}</p>
            </div>
          )}
        </motion.section>
      </div>

      <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.16, ease: EASE }} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-fg">{T.plan}</h2>
        <ol className="relative mt-6 space-y-1">
          <span aria-hidden className="absolute bottom-6 left-[15px] top-6 w-px bg-line" />
          {summary.installments.map((i, idx) => {
            const ui = statusUi[i.status];
            return (
              <motion.li
                key={i.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.06, duration: 0.5, ease: EASE }}
                className="relative flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl py-3 pl-11 pr-2 transition-colors hover:bg-surface-2"
              >
                <span className={cn("absolute left-[9px] top-1/2 grid size-[13px] -translate-y-1/2 place-items-center rounded-full ring-4 ring-surface", ui.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="text-base font-medium text-fg">{i.label}</div>
                  <div className="text-sm text-fg-muted">
                    {i.paidAt ? T.paidOn(fmtDate(i.paidAt)) : T.dueOn(fmtDate(i.dueDate))}
                    {i.invoiceNo ? ` · ${i.invoiceNo}` : ""}
                  </div>
                </div>
                <div className="text-base font-semibold tabular-nums text-fg">{formatINR(i.amount)}</div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", ui.cls)}>
                  <ui.icon className="size-4" /> {T.status[i.status] ?? ui.label}
                </span>
                {i.invoiceNo && (
                  <button onClick={() => toast("GST invoice PDFs are generated by the Laravel API")} className="grid size-8 place-items-center rounded-full text-fg-muted hover:bg-surface hover:text-fg" aria-label={`Download invoice ${i.invoiceNo}`}>
                    <Download className="size-4" />
                  </button>
                )}
              </motion.li>
            );
          })}
        </ol>
      </motion.section>

      <BillingCard billing={billing} editing={editing} setEditing={setEditing} onSaved={setBilling} />
    </div>
  );
}

function BillingCard({ billing, editing, setEditing, onSaved }: { billing: BillingProfile | null; editing: boolean; setEditing: (v: boolean) => void; onSaved: (b: BillingProfile) => void }) {
  const { t: { payments: T, common } } = useT();
  const [form, setForm] = useState<BillingProfile>(billing ?? { businessName: "", gstin: "", address: "", state: "" });
  const [pending, start] = useTransition();
  const set = (k: keyof BillingProfile) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: k === "gstin" ? e.target.value.toUpperCase() : e.target.value }));
  const save = () =>
    start(async () => {
      const res = await saveBillingProfile(form);
      if (!res.ok) return void toast.error(res.error);
      onSaved(res.data);
      setEditing(false);
      toast.success(T.saved);
    });
  const input = "mt-1.5 h-13 w-full rounded-xl border-2 border-line bg-surface px-3.5 text-sm text-fg outline-none transition focus:border-bean-500 focus:ring-4 focus:ring-bean-500/10";

  return (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.24, ease: EASE }} className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-fg">
          <Building2 className="size-5 text-bean-600" /> {T.billing}
        </h2>
        {billing && !editing && (
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-bean-600 hover:underline">
            <Pencil className="size-4" /> {T.edit}
          </button>
        )}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.form
            key="f"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            <label className="text-base font-medium text-fg">
              {T.businessName}
              <input value={form.businessName} onChange={set("businessName")} className={input} placeholder="As on GST certificate" />
            </label>
            <label className="text-base font-medium text-fg">
              {T.gstin}
              <input value={form.gstin} onChange={set("gstin")} maxLength={15} className={cn(input, "font-mono")} placeholder="22AAAAA0000A1Z5" />
            </label>
            <label className="text-base font-medium text-fg sm:col-span-2">
              {T.address}
              <input value={form.address} onChange={set("address")} className={input} />
            </label>
            <label className="text-base font-medium text-fg">
              {T.state}
              <input value={form.state} onChange={set("state")} className={input} />
            </label>
            <div className="flex items-end justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                {common.cancel}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="animate-spin" />} {T.saveDetails}
              </Button>
            </div>
          </motion.form>
        ) : billing ? (
          <motion.dl key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            {[
              [T.businessName, billing.businessName],
              [T.gstin, billing.gstin],
              [T.address, billing.address],
              [T.state, billing.state],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-fg-muted">{k}</dt>
                <dd className={cn("mt-1 text-fg", k === T.gstin && "font-mono")}>{v}</dd>
              </div>
            ))}
          </motion.dl>
        ) : (
          <motion.p key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 text-sm text-fg-muted">
            {T.noBilling}{" "}
            <button onClick={() => setEditing(true)} className="font-medium text-bean-600 hover:underline">
              {T.addBusiness}
            </button>
          </motion.p>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
