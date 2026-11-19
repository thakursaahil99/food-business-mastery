"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, BookOpenCheck, Briefcase, CheckCircle2, Clock, Mail, MapPin, MessageCircle, PlayCircle, Target, Wallet, XCircle } from "lucide-react";
import type { StudentProfile } from "@/lib/types";
import { cn, fmtDate, formatINR, secondsLabel } from "@/lib/utils";
import { BarList, ColumnChart } from "./charts";
import { Avatar, Card, Kpi, Page, fadeUp } from "./ui";

const hwUi = {
  reviewed: { label: "Checked", cls: "bg-emerald-50 text-emerald-700" },
  submitted: { label: "To check", cls: "bg-amber-50 text-amber-800" },
  missing: { label: "Not sent", cls: "bg-bean-50 text-bean-700" },
  open: { label: "Not due yet", cls: "bg-surface-2 text-fg-muted" },
} as const;

const payUi = {
  paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-700" },
  due: { label: "Due", cls: "bg-amber-50 text-amber-800" },
  overdue: { label: "Late", cls: "bg-bean-50 text-bean-700" },
  upcoming: { label: "Later", cls: "bg-surface-2 text-fg-muted" },
} as const;

export function StudentProfileView({ p, serverNow }: { p: StudentProfile; serverNow: number }) {
  const s = p.student;
  const marked = p.attendance.filter((a) => a.attended !== null);
  const present = marked.filter((a) => a.attended).length;
  const lessonsDone = p.modules.reduce((a, m) => a + m.done, 0);
  const lessonsTotal = p.modules.reduce((a, m) => a + m.total, 0);
  const hoursAgo = Math.round((serverNow - +new Date(p.lastActiveAt)) / 3_600_000);
  const phone = s.phone.replace(/\D/g, "");

  return (
    <Page>
      <motion.div variants={fadeUp}>
        <Link href="/admin/students" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
          <ArrowLeft className="size-4" /> All students
        </Link>
      </motion.div>

      {/* Header */}
      <motion.section variants={fadeUp} className="relative overflow-hidden rounded-[28px] bg-ink-950 p-6 text-white grain sm:p-8">
        <div aria-hidden className="absolute -right-20 -top-20 size-72 rounded-full bg-bean-600/40 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={s.name} className="size-16 rounded-2xl from-bean-400 to-bean-700 text-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{s.name}</h1>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/65">
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="size-4" /> {p.businessType}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" /> {p.city}
              </span>
              <span>
                {s.batchName} · joined {fmtDate(s.joinedAt)}
              </span>
            </div>
            <div className="mt-2 text-xs text-white/50">
              Last active {hoursAgo < 1 ? "just now" : hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.round(hoursAgo / 24)}d ago`} · {p.loginsLast7d} logins this week
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-400">
              <MessageCircle className="size-4" /> WhatsApp
            </a>
            <a href={`mailto:${s.email}`} className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-medium hover:bg-white/10">
              <Mail className="size-4" /> Email
            </a>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon={BookOpenCheck} label="Course progress" hint={`${lessonsDone}/${lessonsTotal} lessons`} value={s.progressPct} suffix="%" />
        <Kpi icon={Target} label="Attendance" hint={`${present}/${marked.length} classes`} value={s.attendancePct} suffix="%" />
        <Kpi icon={PlayCircle} label="Watch time" hint={secondsLabel(p.watchTimeSec)} value={Math.round(p.watchTimeSec / 3600)} suffix="h" />
        <Kpi icon={Wallet} label="Fees paid" hint={`of ${formatINR(s.total)}`} value={Math.round((s.paid / s.total) * 100)} suffix="%" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <ColumnChart title="Watch time per week (minutes)" data={p.weeklyWatchMin} fmt={(n) => `${n} min`} axisFmt={(n) => `${n}`} valueLabel="Minutes" />
        <BarList title="Progress by part" data={p.modules.map((m) => ({ label: m.title, value: m.total ? Math.round((m.done / m.total) * 100) : 0, note: `${m.done}/${m.total}` }))} fmt={(n) => `${n}%`} max={100} valueLabel="Done" />
      </div>

      {/* Attendance strip: every class as a coloured square, labelled list underneath */}
      <Card title="Class attendance" action={<span className="text-xs text-fg-muted">{present} present · {marked.length - present} absent</span>}>
        <div className="flex flex-wrap gap-1.5" role="list" aria-label="Attendance per class">
          {p.attendance.map((a) => (
            <span
              key={a.id}
              role="listitem"
              title={`${fmtDate(a.startsAt)} · ${a.title} · ${a.attended === null ? "Not marked" : a.attended ? "Present" : "Absent"}`}
              className={cn("size-7 rounded-md", a.attended === null ? "bg-amber-300" : a.attended ? "bg-emerald-500" : "bg-bean-600")}
            />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-emerald-500" /> Present</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-bean-600" /> Absent</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-amber-300" /> Being marked</span>
        </div>
        <ul className="mt-4 max-h-64 divide-y divide-line overflow-y-auto" data-lenis-prevent>
          {[...p.attendance].reverse().map((a) => (
            <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
              {a.attended === null ? <Clock className="size-4 text-amber-600" /> : a.attended ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-bean-600" />}
              <span className="min-w-0 flex-1 truncate text-fg">{a.title}</span>
              <span className="shrink-0 text-xs text-fg-muted">
                {fmtDate(a.startsAt)}
                {a.attendedSec ? ` · ${secondsLabel(a.attendedSec)} of ${secondsLabel(a.durationSec)}` : ""}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Homework" action={<span className="text-xs text-fg-muted">{p.homeworkAvgPct !== null ? `Avg ${p.homeworkAvgPct}%` : "No marks yet"}</span>}>
          <ul className="divide-y divide-line">
            {p.homework.map((h) => (
              <li key={h.title} className="flex items-center gap-3 py-3 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-fg">{h.title}</span>
                  <span className="text-xs text-fg-muted">Due {fmtDate(h.dueAt)}</span>
                </span>
                {h.score !== null && (
                  <span className="font-semibold tabular-nums text-fg">
                    {h.score}/{h.maxScore}
                  </span>
                )}
                <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", hwUi[h.status].cls)}>{hwUi[h.status].label}</span>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card title="Fees">
            <ul className="divide-y divide-line">
              {p.payments.map((x) => (
                <li key={x.label} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 text-fg">{x.label}</span>
                  <span className="text-xs text-fg-muted">{fmtDate(x.date)}</span>
                  <span className="w-20 text-right font-medium tabular-nums text-fg">{formatINR(x.amount)}</span>
                  <span className={cn("w-16 rounded-full px-2 py-1 text-center text-[11px] font-semibold", payUi[x.status].cls)}>{payUi[x.status].label}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Questions asked">
            {p.doubts.length === 0 ? (
              <p className="text-sm text-fg-muted">No questions yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {p.doubts.map((d) => (
                  <li key={d.subject} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate text-fg">{d.subject}</span>
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", d.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>{d.status === "answered" ? "Answered" : "Open"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
