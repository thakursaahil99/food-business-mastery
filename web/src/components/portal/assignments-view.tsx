"use client";

import { PageHeader } from "./ui";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useRef, useState, useTransition } from "react";
import { Award, CalendarClock, CheckCircle2, ClipboardList, FileText, Loader2, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitAssignment } from "@/lib/actions/student";
import type { Assignment } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useNow } from "./shell";
import { useT, useFmt } from "@/components/i18n";

const EASE = [0.16, 1, 0.3, 1] as const;
type Tab = "pending" | "submitted" | "reviewed";

const stateOf = (a: Assignment, now: number) =>
  a.submission ? (a.submission.score !== null ? "reviewed" : "submitted") : +new Date(a.dueAt) < now ? "overdue" : "pending";



export function AssignmentsView({ initial, serverNow }: { initial: Assignment[]; serverNow: number }) {
  const { fmtDate } = useFmt();
  const { t: tr } = useT();
  const T = tr.assignments;
  const now = useNow(60_000) ?? serverNow;
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<Tab>("pending");
  const [open, setOpen] = useState<Assignment | null>(null);

  const bucket = (t: Tab) =>
    items.filter((a) => {
      const st = stateOf(a, now);
      return t === "pending" ? st === "pending" || st === "overdue" : st === t;
    });
  const shown = bucket(tab);
  const scored = items.filter((a) => a.submission?.score != null);
  const avg = scored.length ? Math.round((scored.reduce((s, a) => s + a.submission!.score! / a.maxScore, 0) / scored.length) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <PageHeader icon={ClipboardList} title={T.title} sub={<>{T.sub}</>} />
        {avg !== null && (
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-line bg-surface px-4 py-2 text-base">
            <Award className="size-5 text-bean-600" /> {T.average} <span className="font-semibold">{avg}%</span>
          </div>
        )}
      </div>

      <LayoutGroup>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
          {(["pending", "submitted", "reviewed"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn("relative min-h-12 rounded-lg px-2 text-base font-semibold transition-colors", tab === t ? "text-fg" : "text-fg-muted hover:text-fg")}>
              {tab === t && <motion.span layoutId="asg-tab" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-lg bg-surface shadow-sm ring-1 ring-line" />}
              <span className="relative">
                {T[t]} <span className={cn("ml-1 rounded-full px-2 text-sm tabular-nums", tab === t ? "bg-bean-50 text-bean-700" : "bg-surface")}>{bucket(t).length}</span>
              </span>
            </button>
          ))}
        </div>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>
          {shown.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-surface-2">
                <Award className="size-7 text-fg-muted" />
              </span>
              <p className="mt-4 text-lg font-semibold text-fg">{tab === "pending" ? T.allDone : T.empty}</p>
              {tab !== "pending" && <p className="mt-1 text-base text-fg-muted">{T.tryOther}</p>}
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {shown.map((a, i) => {
                const st = stateOf(a, now);
                return (
                  <motion.li key={a.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.5, ease: EASE }}>
                    <button onClick={() => setOpen(a)} className="group flex h-full w-full flex-col rounded-2xl border-2 border-line bg-surface p-5 text-left transition-colors">
                      <div className="flex items-center gap-2 text-sm text-fg-muted">
                        <ClipboardList className="size-4 text-bean-600" /> {a.moduleTitle ?? ""}
                        <span className="ml-auto tabular-nums">{T.points(a.maxScore)}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold leading-snug text-fg">{a.title}</h3>
                      <p className="mt-1 line-clamp-2 text-base text-fg-muted">{a.description}</p>
                      <div className="mt-auto flex items-center justify-between pt-4">
                        <span className={cn("inline-flex items-center gap-1.5 text-sm", st === "overdue" ? "font-semibold text-bean-600" : "text-fg-muted")}>
                          <CalendarClock className="size-4" /> {st === "pending" || st === "overdue" ? T.dueIn(fmtDate(a.dueAt)) : T.submittedOn(fmtDate(a.submission!.submittedAt))}
                        </span>
                        <StatePill st={st} a={a} />
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </motion.div>
      </AnimatePresence>

      <AssignmentSheet
        a={open}
        now={now}
        onClose={() => setOpen(null)}
        onSubmitted={(updated) => {
          setItems((xs) => xs.map((x) => (x.id === updated.id ? updated : x)));
          setOpen(updated);
          setTab("submitted");
        }}
      />
    </div>
  );
}

function StatePill({ st, a }: { st: ReturnType<typeof stateOf>; a: Assignment }) {
  const T = useT().t.assignments;
  if (st === "reviewed")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
        <Award className="size-4" /> {a.submission!.score}/{a.maxScore}
      </span>
    );
  if (st === "submitted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700">
        <CheckCircle2 className="size-4" /> {T.inReview}
      </span>
    );
  if (st === "overdue") return <span className="rounded-full bg-bean-50 px-3 py-1.5 text-sm font-semibold text-bean-700">{T.overdue}</span>;
  return <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">{T.toDo}</span>;
}

function AssignmentSheet({ a, now, onClose, onSubmitted }: { a: Assignment | null; now: number; onClose: () => void; onSubmitted: (a: Assignment) => void }) {
  const { fmtDate, fmtDayLong, fmtTime } = useFmt();
  const { t: tr } = useT();
  const T = tr.assignments;
  const [text, setText] = useState("");
  const [file, setFile] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = () =>
    a &&
    start(async () => {
      const res = await submitAssignment({ assignmentId: a.id, text, fileName: file });
      if (!res.ok) return void toast.error(res.error);
      toast.success(T.sent);
      setText("");
      setFile(null);
      onSubmitted({ ...a, submission: res.data });
    });

  return (
    <AnimatePresence>
      {a && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-sm" />
          <motion.aside role="dialog" aria-modal aria-label={a.title} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col bg-surface shadow-2xl">
            <div className="relative overflow-hidden border-b border-line bg-surface p-6 text-fg">
              <button onClick={onClose} className="relative ml-auto flex min-h-11 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium hover:bg-surface-2">
                <X className="size-4" /> {tr.common.close}
              </button>
              {a.moduleTitle && <div className="relative mt-2 text-sm text-bean-700">{a.moduleTitle}</div>}
              <h2 className="relative mt-1 text-2xl font-semibold leading-snug">{a.title}</h2>
              <p className="relative mt-2 text-base text-fg-muted">
                {T.dueIn(`${fmtDayLong(a.dueAt)}, ${fmtTime(a.dueAt)}`)} · {T.points(a.maxScore)}
              </p>
            </div>
            <div className="flex-1 space-y-6 overflow-y-auto p-6" data-lenis-prevent>
              <p className="whitespace-pre-line text-base leading-relaxed text-fg">{a.description}</p>

              {a.submission ? (
                <div className="space-y-4">
                  {a.submission.score !== null ? (
                    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-emerald-50 p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-base font-semibold text-emerald-800">{T.feedback}</span>
                        <span className="text-4xl font-bold text-emerald-700">
                          {a.submission.score}
                          <span className="text-lg text-emerald-700/60">/{a.maxScore}</span>
                        </span>
                      </div>
                      {a.submission.feedback && <p className="mt-2 text-base leading-relaxed text-emerald-900">{a.submission.feedback}</p>}
                      {a.submission.reviewedBy && <p className="mt-3 text-sm text-emerald-800/80">— {a.submission.reviewedBy}</p>}
                    </motion.div>
                  ) : (
                    <p className="flex items-start gap-2 rounded-2xl bg-sky-50 p-4 text-base text-sky-900">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0" /> {T.willReview}
                    </p>
                  )}
                  <div className="rounded-2xl border border-line p-4">
                    <div className="text-sm text-fg-muted">{T.submittedOn(`${fmtDate(a.submission.submittedAt)}, ${fmtTime(a.submission.submittedAt)}`)}</div>
                    <p className="mt-2 text-base text-fg">{a.submission.text}</p>
                    {a.submission.fileName && (
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg">
                        <FileText className="size-4" /> {a.submission.fileName}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submit();
                  }}
                  className="space-y-4"
                >
                  {+new Date(a.dueAt) < now && <p className="rounded-xl bg-bean-50 px-4 py-3 text-base text-bean-800">{T.late}</p>}
                  <label className="block text-base font-semibold text-fg" htmlFor="sub-text">
                    {T.yourWork}
                  </label>
                  <textarea id="sub-text" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder={T.placeholder} className="w-full resize-none rounded-2xl border-2 border-line bg-surface p-4 text-base leading-relaxed outline-none transition focus:border-bean-500 focus:ring-4 focus:ring-bean-500/10" />
                  <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,image/*" onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)} />
                  <button type="button" onClick={() => fileRef.current?.click()} className="flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 border-dashed border-line-strong px-4 text-left text-base text-fg-muted transition-colors hover:border-bean-300 hover:bg-bean-50/40">
                    <Paperclip className="size-6 shrink-0 text-bean-600" />
                    {file ? <span className="font-medium text-fg">{file}</span> : T.attach}
                  </button>
                  <Button type="submit" size="lg" className="min-h-14 w-full text-lg" disabled={pending || text.trim().length < 10}>
                    {pending ? <Loader2 className="animate-spin" /> : <Send />} {T.send}
                  </Button>
                </form>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
