"use client";

import { PageHeader } from "./ui";
import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { BookOpen, Briefcase, CheckCircle2, Clock, IndianRupee, Loader2, Send, Smartphone, Video, MessageCircleQuestion } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT, useFmt } from "@/components/i18n";
import { askDoubt } from "@/lib/actions/student";
import type { Doubt, DoubtCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;
const CATEGORIES: { key: DoubtCategory; icon: typeof Video }[] = [
  { key: "Business", icon: Briefcase },
  { key: "Live class", icon: Video },
  { key: "Course content", icon: BookOpen },
  { key: "Payments", icon: IndianRupee },
  { key: "Technical", icon: Smartphone },
];

/** Ask a question — one simple form, and every answer shown in full (no hidden accordions). */
export function DoubtsView({ initial, recentClasses }: { initial: Doubt[]; recentClasses: string[] }) {
  const { fmtDate } = useFmt();
  const { t } = useT();
  const T = t.doubts;
  const [doubts, setDoubts] = useState(initial);
  const [category, setCategory] = useState<DoubtCategory>("Business");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const res = await askDoubt({ category, subject, body, sessionTitle: category === "Live class" && sessionTitle ? sessionTitle : null });
      if (!res.ok) return void toast.error(res.error);
      setDoubts((d) => [res.data, ...d]);
      setSubject("");
      setBody("");
      toast.success(T.sent);
    });

  const input = "w-full rounded-2xl border-2 border-line bg-surface px-4 text-base text-fg outline-none transition focus:border-bean-500 focus:ring-4 focus:ring-bean-500/10";
  const canSend = subject.trim().length >= 5 && body.trim().length >= 10;

  return (
    <div className="space-y-7">
      <PageHeader icon={MessageCircleQuestion} title={T.title} sub={<>{T.sub}</>} />

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <motion.form
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) submit();
          }}
          className="h-fit space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24"
        >
          <h2 className="text-xl font-semibold text-fg">{T.ask}</h2>

          <fieldset>
            <legend className="text-base font-semibold text-fg">1. {T.topic}</legend>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {CATEGORIES.map(({ key, icon: Icon }) => {
                const on = category === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    aria-pressed={on}
                    className={cn("flex min-h-14 items-center gap-2 rounded-2xl border-2 px-3 text-left text-sm font-semibold leading-tight transition-colors", on ? "border-bean-600 bg-bean-50 text-bean-800" : "border-line text-fg hover:border-line-strong")}
                  >
                    <Icon className={cn("size-5 shrink-0", on ? "text-bean-600" : "text-fg-muted")} />
                    {T.cats[key]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <AnimatePresence initial={false}>
            {category === "Live class" && recentClasses.length > 0 && (
              <motion.label initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="block overflow-hidden">
                <span className="text-base font-semibold text-fg">{T.whichClass}</span>
                <select value={sessionTitle} onChange={(e) => setSessionTitle(e.target.value)} className={cn(input, "mt-2 min-h-13 h-13")}>
                  <option value="">—</option>
                  {recentClasses.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </motion.label>
            )}
          </AnimatePresence>

          <label className="block">
            <span className="text-base font-semibold text-fg">2. {T.subject}</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className={cn(input, "mt-2 h-13")} />
          </label>
          <label className="block">
            <span className="text-base font-semibold text-fg">3. {T.details}</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} placeholder={T.detailsPh} className={cn(input, "mt-2 resize-none py-3 leading-relaxed")} />
          </label>
          <Button type="submit" size="lg" className="min-h-14 w-full text-lg" disabled={pending || !canSend}>
            {pending ? <Loader2 className="animate-spin" /> : <Send />} {T.send}
          </Button>
          <p className="text-center text-sm text-fg-muted">{T.usually}</p>
        </motion.form>

        <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08, ease: EASE }}>
          <h2 className="mb-3 text-xl font-semibold text-fg">{T.mine}</h2>
          <ul className="space-y-4">
            <AnimatePresence initial={false} mode="popLayout">
              {doubts.map((d) => (
                <motion.li key={d.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-line bg-surface p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", d.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
                      {d.status === "answered" ? <CheckCircle2 className="size-4" /> : <Clock className="size-4" />}
                      {d.status === "answered" ? T.answered : T.waiting}
                    </span>
                    <span className="text-sm text-fg-muted">
                      {T.cats[d.category] ?? d.category} · {fmtDate(d.createdAt)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold leading-snug text-fg">{d.subject}</h3>
                  <p className="mt-1 text-base text-fg-muted">{d.body}</p>
                  {d.answer ? (
                    <div className="mt-4 rounded-xl border-l-4 border-emerald-500 bg-emerald-50/60 p-4 text-fg">
                      <div className="text-sm font-medium text-bean-700">
                        {d.answer.by} · {fmtDate(d.answer.at)}
                      </div>
                      <p className="mt-1.5 text-base leading-relaxed text-fg-muted">{d.answer.body}</p>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-fg-muted">{T.usually}</p>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
            {doubts.length === 0 && <li className="rounded-2xl border border-dashed border-line-strong py-10 text-center text-base text-fg-muted">{T.none}</li>}
          </ul>
        </motion.section>
      </div>
    </div>
  );
}
