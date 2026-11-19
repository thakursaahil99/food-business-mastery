"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, CalendarPlus, GraduationCap, IndianRupee, Inbox, Target } from "lucide-react";
import type { AdminOverview, BatchSummary, ClassSession, Lead, PaymentRow } from "@/lib/types";
import { cn, fmtTime, formatINR } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Greeting, useNow } from "@/components/portal/shell";
import { StatusBadge, TypeChip, dayHeading } from "@/components/portal/session-ui";
import { Avatar, Card, FunnelChart, Kpi, LeadPill, Page, PageHeader, PaymentPill, RevenueChart, fadeUp } from "./ui";

const lakh = (n: number) => `₹${(n / 100000).toFixed(2)}L`;

export function OverviewView({
  adminName,
  overview: o,
  sessions,
  leads,
  payments,
  batches,
  serverNow,
}: {
  adminName: string;
  overview: AdminOverview;
  sessions: ClassSession[];
  leads: Lead[];
  payments: PaymentRow[];
  batches: BatchSummary[];
  serverNow: number;
}) {
  const now = useNow();
  const ref = now ?? serverNow;
  const upcoming = sessions.filter((s) => s.status !== "cancelled" && +new Date(s.endsAt) > ref).slice(0, 5);
  const delta = Math.round(((o.revenueThisMonth - o.revenueLastMonth) / o.revenueLastMonth) * 100);

  return (
    <Page>
      <PageHeader
        title={<Greeting name={adminName} />}
        sub="Here's how Redbean Academy is doing today."
        actions={
          <>
            <ButtonLink href="/admin/leads" variant="outline" size="sm">
              <Inbox /> Review leads
            </ButtonLink>
            <ButtonLink href="/admin/sessions?new=1" size="sm">
              <CalendarPlus /> New session
            </ButtonLink>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi dark icon={IndianRupee} label="Revenue" hint="this month" value={o.revenueThisMonth} format={lakh} delta={delta} />
        <Kpi icon={GraduationCap} label="Active students" hint="all batches" value={o.activeStudents} />
        <Kpi icon={Inbox} label="New leads" hint="awaiting call" value={o.newLeads} />
        <Kpi icon={Target} label="Avg attendance" hint="last 4 weeks" value={o.avgAttendance} suffix="%" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr]">
        <RevenueChart data={o.revenueByMonth} />
        <FunnelChart data={o.leadFunnel} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Upcoming sessions" action={<MoreLink href="/admin/sessions">Schedule</MoreLink>}>
          <ul className="divide-y divide-line">
            {upcoming.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <div className="w-20 shrink-0">
                  <div className="text-xs font-medium text-fg">{dayHeading(s.startsAt, now)}</div>
                  <div className="text-xs text-fg-muted">{fmtTime(s.startsAt)}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{s.title}</div>
                  <div className="truncate text-xs text-fg-muted">
                    {s.coach.name} · {s.batchName}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <TypeChip type={s.type} />
                </div>
                <StatusBadge session={s} now={now} />
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Latest leads" action={<MoreLink href="/admin/leads">All leads</MoreLink>}>
          <ul className="divide-y divide-line">
            {leads.slice(0, 5).map((l) => (
              <li key={l.id} className="flex items-center gap-3 py-3">
                <Avatar name={l.name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{l.name}</div>
                  <div className="truncate text-xs text-fg-muted">
                    {l.city} · {l.source}
                  </div>
                </div>
                <LeadPill status={l.status} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Card title="Batches" action={<MoreLink href="/admin/batches">Manage</MoreLink>}>
          <ul className="space-y-4">
            {batches.map((b) => {
              const pct = Math.round((b.seatsTaken / b.seats) * 100);
              return (
                <li key={b.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-fg">{b.name}</span>
                    <span className="text-xs tabular-nums text-fg-muted">
                      {b.seatsTaken}/{b.seats} seats
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }} className={cn("h-full rounded-full", b.status === "completed" ? "bg-ink-300" : "bg-bean-600")} />
                  </div>
                  <div className="mt-1 text-[11px] capitalize text-fg-muted">
                    {b.status}
                    {b.status === "running" ? ` · week ${b.currentWeek} of 16` : ""}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Recent payments" action={<MoreLink href="/admin/payments">All payments</MoreLink>}>
          <ul className="divide-y divide-line">
            {payments.slice(0, 5).map((p) => (
              <motion.li variants={fadeUp} key={p.id} className="flex items-center gap-3 py-3">
                <Avatar name={p.studentName} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-fg">{p.studentName}</div>
                  <div className="truncate text-xs text-fg-muted">
                    {p.method} · {p.invoiceNo ?? "No invoice"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-fg">{formatINR(p.amount)}</div>
                </div>
                <PaymentPill status={p.status} />
              </motion.li>
            ))}
          </ul>
        </Card>
      </div>
    </Page>
  );
}

function MoreLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-0.5 text-sm font-medium text-bean-600">
      {children}
      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
