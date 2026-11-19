"use client";

import { motion } from "motion/react";
import { CalendarDays, IndianRupee, Target, User } from "lucide-react";
import type { BatchSummary } from "@/lib/types";
import { cn, fmtDate, formatINR } from "@/lib/utils";
import { ProgressRing } from "@/components/portal/session-ui";
import { curriculum } from "@/content/site";
import { Card, Page, PageHeader, fadeUp } from "./ui";

const statusCls = { upcoming: "bg-sky-50 text-sky-700", running: "bg-emerald-50 text-emerald-700", completed: "bg-ink-100 text-ink-500" } as const;

export function BatchesView({ batches }: { batches: BatchSummary[] }) {
  return (
    <Page>
      <PageHeader title="Programs & batches" sub="CGR Food Contract Mastery Program · 16 weeks" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {batches.map((b) => {
          const pct = Math.round((b.seatsTaken / b.seats) * 100);
          return (
            <motion.article key={b.id} variants={fadeUp} className={cn("relative overflow-hidden rounded-[24px] border p-6", b.status === "running" ? "border-ink-800 bg-ink-950 text-white grain" : "border-line bg-surface")}>
              {b.status === "running" && <div aria-hidden className="absolute -right-12 -top-12 size-40 rounded-full bg-bean-600/40 blur-3xl" />}
              <div className="relative flex items-start justify-between">
                <div>
                  <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize", b.status === "running" ? "bg-emerald-400/15 text-emerald-300" : statusCls[b.status])}>{b.status}</span>
                  <h2 className="font-display mt-3 text-xl font-semibold">{b.name}</h2>
                  <p className={cn("text-sm", b.status === "running" ? "text-white/50" : "text-fg-muted")}>{b.programTitle}</p>
                </div>
                <ProgressRing value={pct} size={72} stroke={7} trackClass={b.status === "running" ? "stroke-white/10" : "stroke-ink-100"}>
                  <span className={cn("text-xs font-semibold", b.status === "running" ? "text-white" : "text-fg")}>
                    {b.seatsTaken}/{b.seats}
                  </span>
                </ProgressRing>
              </div>
              <dl className={cn("relative mt-6 grid grid-cols-2 gap-3 text-sm", b.status === "running" ? "text-white/80" : "text-fg")}>
                <Item icon={CalendarDays} label="Dates" value={`${fmtDate(b.startDate)} – ${fmtDate(b.endDate)}`} dark={b.status === "running"} wide />
                <Item icon={User} label="Coach" value={b.coachName} dark={b.status === "running"} />
                <Item icon={IndianRupee} label="Fee" value={formatINR(b.price)} dark={b.status === "running"} />
                {b.status !== "upcoming" && <Item icon={Target} label="Attendance" value={`${b.attendancePct}%`} dark={b.status === "running"} />}
                {b.status === "running" && <Item icon={CalendarDays} label="Progress" value={`Week ${b.currentWeek} of 16`} dark />}
              </dl>
            </motion.article>
          );
        })}
      </div>

      <Card title="Curriculum">
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {curriculum.map((c, i) => (
            <li key={c.title} className="rounded-2xl border border-line p-4">
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded-full bg-bean-600 px-2 py-0.5 font-semibold text-white">{c.tag}</span>
                <span className="text-fg-muted">{c.weeks}</span>
                <span className="ml-auto font-mono text-fg-muted">0{i + 1}</span>
              </div>
              <div className="mt-2 font-semibold text-fg">{c.title}</div>
              <div className="mt-1 text-xs text-fg-muted">{c.topics.join(" · ")}</div>
            </li>
          ))}
        </ol>
      </Card>
    </Page>
  );
}

function Item({ icon: Icon, label, value, dark, wide }: { icon: typeof User; label: string; value: string; dark?: boolean; wide?: boolean }) {
  return (
    <div className={cn(wide && "col-span-2")}>
      <dt className={cn("flex items-center gap-1.5 text-xs", dark ? "text-white/40" : "text-fg-muted")}>
        <Icon className="size-3.5" /> {label}
      </dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
