"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { AlertTriangle, BookOpenCheck, Clock, IndianRupee, MessageCircleQuestion, Percent, RotateCcw, Target, TrendingUp, Users, Wallet } from "lucide-react";
import type { BusinessAnalytics, LearningAnalytics } from "@/lib/types";
import { cn, fmtDate, formatINR } from "@/lib/utils";
import { BarList, ColumnChart } from "./charts";
import { Avatar, Card, Kpi, Page, PageHeader, Tabs, fadeUp } from "./ui";

type Tab = "business" | "learning";
const lakh = (n: number) => (n >= 100000 ? `₹${(n / 100000).toFixed(n >= 1000000 ? 1 : 2).replace(/\.?0+$/, "")}L` : formatINR(n));
const pctFmt = (n: number) => `${n}%`;

export function AnalyticsView({ tab, business, learning }: { tab: Tab; business: BusinessAnalytics | null; learning: LearningAnalytics }) {
  const router = useRouter();
  const options = [...(business ? [{ value: "business" as Tab, label: "Business" }] : []), { value: "learning" as Tab, label: "Learning" }];
  const active = business ? tab : "learning";

  return (
    <Page>
      <PageHeader title="Analytics" sub="How the academy is doing: money in, leads, and how well students are learning." />
      <motion.div variants={fadeUp}>
        <Tabs id="analytics" value={active} onChange={(v) => router.replace(`/admin/analytics?tab=${v}`, { scroll: false })} options={options} />
      </motion.div>
      {active === "business" && business ? <Business b={business} /> : <Learning l={learning} />}
    </Page>
  );
}

function Business({ b }: { b: BusinessAnalytics }) {
  const delta = b.revenueByMonth.length > 1 ? Math.round(((b.revenueByMonth.at(-1)!.value - b.revenueByMonth.at(-2)!.value) / b.revenueByMonth.at(-2)!.value) * 100) : undefined;
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi dark icon={IndianRupee} label="Revenue" hint="this year" value={b.revenueFY} format={lakh} />
        <Kpi icon={TrendingUp} label="Collected" hint="this month" value={b.collectedThisMonth} format={lakh} delta={delta} />
        <Kpi icon={Wallet} label="Fees still due" hint={`${b.overdueCount} late`} value={b.outstanding} format={lakh} />
        <Kpi icon={Users} label="Avg fee paid" hint="per student" value={b.avgFeePerStudent} format={lakh} />
        <Kpi icon={Percent} label="Lead → student" hint="conversion" value={b.leadConversionPct} suffix="%" />
        <Kpi icon={RotateCcw} label="Refunds" hint="of payments" value={b.refundPct} suffix="%" />
      </div>

      <ColumnChart title="Revenue, last 12 months" data={b.revenueByMonth} fmt={formatINR} axisFmt={lakh} valueLabel="Revenue" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarList title="Leads by source" data={b.leadsBySource} valueLabel="Leads" footer="Referral leads convert best. Ask happy students for introductions." />
        <BarList title="Revenue by batch" data={b.revenueByBatch} fmt={lakh} valueLabel="Revenue" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        <BarList title="How students pay" data={b.paymentMethods} fmt={pctFmt} max={100} valueLabel="Share" />
        <Card title="Fees due" action={<span className="text-xs text-fg-muted">{b.dues.length} students</span>}>
          <div className="-mx-1 max-h-[22rem] overflow-y-auto px-1" data-lenis-prevent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted">
                  <th className="pb-2 font-medium">Student</th>
                  <th className="pb-2 font-medium">Due</th>
                  <th className="pb-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {b.dues.map((d) => (
                  <tr key={d.studentId} className="hover:bg-surface-2/60">
                    <td className="py-2.5 pr-2">
                      <Link href={`/admin/students/${d.studentId}`} className="flex items-center gap-2.5 hover:underline">
                        <Avatar name={d.name} className="size-8 text-[10px]" />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-fg">{d.name}</span>
                          <span className="block text-xs text-fg-muted">{d.batch}</span>
                        </span>
                      </Link>
                    </td>
                    <td className="py-2.5 pr-2">
                      {d.daysOverdue > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-bean-50 px-2 py-0.5 text-xs font-semibold text-bean-700">
                          <AlertTriangle className="size-3" /> {d.daysOverdue}d late
                        </span>
                      ) : (
                        <span className="text-xs text-fg-muted">{fmtDate(d.dueDate)}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-semibold tabular-nums text-fg">{formatINR(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

function Learning({ l }: { l: LearningAnalytics }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <Kpi dark icon={BookOpenCheck} label="Avg course progress" value={l.avgProgress} suffix="%" />
        <Kpi icon={Target} label="Avg attendance" value={l.avgAttendance} suffix="%" />
        <Kpi icon={Percent} label="Homework sent" hint="on time" value={l.submissionRate} suffix="%" />
        <Kpi icon={TrendingUp} label="Avg homework marks" value={l.avgScore} suffix="%" />
        <Kpi icon={MessageCircleQuestion} label="Open questions" value={l.openDoubts} />
        <Kpi icon={Clock} label="Avg answer time" hint="hours" value={l.avgAnswerHours} suffix="h" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        <ColumnChart title="Attendance by week" data={l.attendanceByWeek} fmt={pctFmt} max={100} valueLabel="Attendance" />
        <BarList title="Course completion by part" data={l.moduleCompletion} fmt={pctFmt} max={100} valueLabel="Completed" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BarList title="Where students stop watching" data={l.lessonDropoff} fmt={pctFmt} max={100} danger={60} valueLabel="Finished" footer="Lessons with the lowest finish rate. Consider shortening them or adding a live recap." />
        <BarList title="Homework submitted" data={l.homeworkSubmission} fmt={pctFmt} max={100} danger={60} valueLabel="Submitted" />
      </div>

      <Card title="Students who need help" action={<span className="text-xs text-fg-muted">Attendance under 75% or behind on lessons</span>}>
        {l.atRisk.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">Everyone is on track.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {l.atRisk.map((s) => (
              <li key={s.studentId}>
                <Link href={`/admin/students/${s.studentId}`} className="flex items-center gap-3 rounded-2xl border border-line p-3.5 transition-colors hover:bg-surface-2">
                  <Avatar name={s.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-fg">{s.name}</div>
                    <div className="truncate text-xs text-bean-700">{s.reason}</div>
                  </div>
                  <div className="text-right text-xs tabular-nums">
                    <div className={cn(s.attendancePct < 75 ? "font-semibold text-bean-700" : "text-fg-muted")}>{s.attendancePct}% att.</div>
                    <div className={cn(s.progressPct < 35 ? "font-semibold text-bean-700" : "text-fg-muted")}>{s.progressPct}% done</div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
