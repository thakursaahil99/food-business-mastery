"use client";

import { motion } from "motion/react";
import { useState, useTransition } from "react";
import { Award, Bell, Check, Circle, Eye, Languages, LogOut, Phone, UserRound } from "lucide-react";
import { toast } from "sonner";
import { LangToggle, TextSizePicker, useT, useFmt } from "@/components/i18n";
import { logout } from "@/lib/actions/auth";
import { saveReminderPrefs } from "@/lib/actions/student";
import type { TextSize } from "@/lib/i18n/dict";
import type { ReminderPrefs, User } from "@/lib/types";
import { cn, initials } from "@/lib/utils";
import { PageHeader, Section, ToggleRow } from "./ui";
import { StudentAccentPicker } from "@/components/theme/student-accent-picker";

type Cert = { attendancePct: number; lessonsDone: number; lessonsTotal: number; homeworkSent: number; homeworkTotal: number };

export function ProfileView({ user, batchName, since, textSize, prefs: initialPrefs, cert }: { user: User; batchName: string; since: string; textSize: TextSize; prefs: ReminderPrefs; cert: Cert }) {
  const { fmtDate } = useFmt();
  const { t } = useT();
  const T = t.profile;
  const [prefs, setPrefs] = useState(initialPrefs);
  const [, start] = useTransition();

  const toggle = (k: keyof ReminderPrefs) => (v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    start(async () => {
      const res = await saveReminderPrefs(next);
      if (res.ok) toast.success(T.saved);
      else {
        setPrefs(prefs);
        toast.error(res.error);
      }
    });
  };

  const steps = [
    { done: cert.attendancePct >= 75, label: T.certAttendance(cert.attendancePct) },
    { done: cert.lessonsTotal > 0 && cert.lessonsDone >= cert.lessonsTotal, label: T.certLessons(cert.lessonsDone, cert.lessonsTotal) },
    { done: cert.homeworkTotal > 0 && cert.homeworkSent >= cert.homeworkTotal, label: T.certHomework(cert.homeworkSent, cert.homeworkTotal) },
    { done: false, label: T.certFinal, hint: T.certFinalWhen },
  ];
  const doneSteps = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-7">
      <PageHeader icon={UserRound} title={T.title} sub={T.sub} />

      {/* Who you are */}
      <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="relative overflow-hidden rounded-2xl bg-surface border border-line p-6 text-fg sm:p-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid size-20 shrink-0 place-items-center rounded-2xl bg-bean-600 text-3xl font-bold">{initials(user.name)}</span>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold sm:text-3xl">{user.name}</h2>
            <p className="mt-1 text-base text-fg-muted">
              {batchName} · {T.since(fmtDate(since))}
            </p>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title={T.details} icon={Phone} delay={0.05}>
          <dl className="divide-y divide-line">
            {[
              [T.name, user.name],
              [T.phone, user.phone ?? "—"],
              [T.email, user.email ?? "—"],
              [T.batch, batchName],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-4">
                <dt className="text-sm text-fg-muted">{k}</dt>
                <dd className="break-all text-base font-medium text-fg sm:text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 rounded-xl bg-surface-2 px-4 py-3 text-sm text-fg-muted">{T.changeHint}</p>
        </Section>

        <Section title={T.certificate} icon={Award} delay={0.1} action={<span className="text-sm font-semibold text-fg-muted">{T.certCount(doneSteps, steps.length)}</span>}>
          <p className="-mt-2 mb-3 text-base text-fg-muted">{T.certSub}</p>
          <div className="mb-4 h-3 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={doneSteps} aria-valuemin={0} aria-valuemax={steps.length}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(doneSteps / steps.length) * 100}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full bg-emerald-600" />
          </div>
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={i} className={cn("flex items-start gap-3 rounded-2xl p-3", s.done ? "bg-emerald-50" : "bg-surface-2/60")}>
                <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", s.done ? "bg-emerald-600 text-white" : "border-2 border-line-strong text-fg-muted")}>
                  {s.done ? <Check className="size-4" strokeWidth={3} /> : <Circle className="size-2 fill-current" />}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-base", s.done ? "font-medium text-emerald-900" : "text-fg")}>{s.label}</span>
                  {s.hint && <span className="text-sm text-fg-muted">{s.hint}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={T.comfort} icon={Eye} delay={0.15}>
          <div className="space-y-5">
            <div>
              <div className="mb-2 text-base font-medium text-fg">{T.textSize}</div>
              <TextSizePicker initial={textSize} />
              <p className="mt-3 rounded-xl border border-dashed border-line-strong px-4 py-3 text-base text-fg">{T.preview}</p>
            </div>
            <div>
              <div className="mb-2 flex items-center gap-2 text-base font-medium text-fg">
                <Languages className="size-5 text-bean-600" /> {T.language}
              </div>
              <LangToggle />
            </div>
            <div>
              <div className="mb-2 text-base font-medium text-fg">{t.shell.colourTitle}</div>
              <StudentAccentPicker className="w-fit" />
              <p className="mt-2 text-sm text-fg-muted">{t.shell.colourHint}</p>
            </div>
          </div>
        </Section>

        <Section title={T.reminders} icon={Bell} delay={0.2}>
          <p className="-mt-2 mb-2 text-base text-fg-muted">{T.remindersSub}</p>
          <div className="divide-y divide-line">
            <ToggleRow label={T.whatsapp} on={prefs.whatsapp} onChange={toggle("whatsapp")} />
            <ToggleRow label={T.emailMsgs} on={prefs.email} onChange={toggle("email")} />
            <ToggleRow label={T.dayBefore} on={prefs.dayBefore} onChange={toggle("dayBefore")} disabled={!prefs.whatsapp && !prefs.email} />
            <ToggleRow label={T.min15} on={prefs.min15} onChange={toggle("min15")} disabled={!prefs.whatsapp && !prefs.email} />
          </div>
        </Section>
      </div>

      <form action={logout}>
        <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-line text-base font-semibold text-fg-muted transition-colors hover:border-bean-200 hover:bg-bean-50 hover:text-bean-700 sm:w-auto sm:px-8">
          <LogOut className="size-5" /> {t.shell.logout}
        </button>
      </form>
    </div>
  );
}
