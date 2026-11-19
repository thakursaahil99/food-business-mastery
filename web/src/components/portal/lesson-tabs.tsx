"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { Check, CheckCircle2, Clock, Download, FileSpreadsheet, FileText, Loader2, MessageCircleQuestion, NotebookPen, Paperclip, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useFmt, useT } from "@/components/i18n";
import { askDoubt } from "@/lib/actions/student";
import type { LessonQuestion } from "@/lib/api/data-learning";
import { lessonExtras, sizeLabel } from "@/lib/lesson-extras";
import { useLessonNotes } from "@/lib/lesson-notes";
import type { Lesson } from "@/lib/types";
import { cn } from "@/lib/utils";
import { card } from "./ui";

type Tab = "overview" | "notes" | "qa" | "resources";
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * Udemy-style tabs under the lesson video: Overview · My notes · Questions · Files.
 * Notes are timestamped; tapping one jumps the video there (through the player's seek gate,
 * so the no-skip rule still applies).
 */
export function LessonTabs({
  lesson,
  partLabel,
  lengthLabel,
  questions: initialQuestions,
  time,
  onSeek,
}: {
  lesson: Lesson;
  partLabel: string;
  lengthLabel: string;
  questions: LessonQuestion[];
  time: number;
  onSeek: (t: number) => void;
}) {
  const { t } = useT();
  const T = t.tabs;
  const extras = lessonExtras(lesson);
  const [tab, setTab] = useState<Tab>("overview");
  const [questions, setQuestions] = useState(initialQuestions);

  const tabs: { k: Tab; label: string; icon: typeof FileText; count?: number }[] = [
    { k: "overview", label: T.overview, icon: FileText },
    { k: "notes", label: T.notes, icon: NotebookPen },
    { k: "qa", label: T.qa, icon: MessageCircleQuestion, count: questions.length },
    { k: "resources", label: T.resources, icon: Paperclip, count: extras.resources.length },
  ];

  return (
    <section className={card}>
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-line px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map(({ k, label, icon: Icon, count }) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("relative flex min-h-13 shrink-0 items-center gap-2 px-3.5 text-base font-medium transition-colors", tab === k ? "text-fg" : "text-fg-muted hover:text-fg")}
          >
            <Icon className="size-[18px]" strokeWidth={1.75} />
            {label}
            {count ? <span className="rounded-md bg-surface-2 px-1.5 text-sm tabular-nums text-fg-muted">{count}</span> : null}
            {tab === k && <motion.span layoutId="lesson-tab" transition={{ type: "spring", stiffness: 500, damping: 40 }} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-bean-600" />}
          </button>
        ))}
      </div>
      <div className="p-5 sm:p-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {tab === "overview" && <Overview lesson={lesson} bullets={extras.overview} partLabel={partLabel} lengthLabel={lengthLabel} />}
            {tab === "notes" && <Notes lessonId={lesson.id} time={time} onSeek={onSeek} />}
            {tab === "qa" && <QA lesson={lesson} questions={questions} onAsked={(q) => setQuestions((xs) => [q, ...xs])} />}
            {tab === "resources" && <Files files={extras.resources} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Overview({ bullets, partLabel, lengthLabel }: { lesson?: Lesson; bullets: string[]; partLabel: string; lengthLabel: string }) {
  const { t } = useT();
  const T = t.tabs;
  return (
    <div>
      <p className="text-sm text-fg-muted">{T.about(partLabel, lengthLabel)}</p>
      <h3 className="mt-1 text-lg font-semibold text-fg">{T.learn}</h3>
      <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-base text-fg">
            <Check className="mt-1 size-4 shrink-0 text-emerald-600" strokeWidth={2.5} />
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Notes({ lessonId, time, onSeek }: { lessonId: number; time: number; onSeek: (t: number) => void }) {
  const T = useT().t.tabs;
  const { notes, add, remove } = useLessonNotes(lessonId);
  const [text, setText] = useState("");
  const save = () => {
    if (!text.trim()) return;
    add(time, text);
    setText("");
    toast.success(T.noteSaved);
  };
  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="space-y-2"
      >
        <label htmlFor="note-text" className="flex items-center gap-2 text-base font-medium text-fg">
          <span className="rounded-md bg-ink-900 px-2 py-0.5 font-mono text-sm text-white">{mmss(time)}</span>
          {T.noteAt(mmss(time))}
        </label>
        <textarea id="note-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={T.notePh} className="w-full resize-none rounded-xl border border-line-strong bg-surface p-3.5 text-base outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5" />
        <button type="submit" disabled={!text.trim()} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ink-900 px-4 text-base font-semibold text-white transition-colors hover:bg-ink-700 disabled:opacity-40">
          <NotebookPen className="size-4" /> {T.saveNote}
        </button>
      </form>
      {notes.length === 0 ? (
        <p className="rounded-xl bg-surface-2 px-4 py-3 text-base text-fg-muted">{T.notesEmpty}</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {notes.map((n) => (
            <li key={n.id} className="flex items-start gap-3 p-3.5">
              <button onClick={() => onSeek(n.t)} aria-label={T.goTo(mmss(n.t))} className="shrink-0 rounded-md bg-bean-50 px-2 py-1 font-mono text-sm font-semibold text-bean-700 transition-colors hover:bg-bean-100">
                {mmss(n.t)}
              </button>
              <p className="min-w-0 flex-1 whitespace-pre-line text-base text-fg">{n.text}</p>
              <button onClick={() => remove(n.id)} aria-label={T.del} className="grid size-9 shrink-0 place-items-center rounded-lg text-fg-muted transition-colors hover:bg-bean-50 hover:text-bean-700">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function QA({ lesson, questions, onAsked }: { lesson: Lesson; questions: LessonQuestion[]; onAsked: (q: LessonQuestion) => void }) {
  const { t } = useT();
  const T = t.tabs;
  const { fmtDate } = useFmt();
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [pending, start] = useTransition();
  const body = details.trim() || subject.trim();
  const canSend = subject.trim().length >= 5 && body.length >= 10;

  const send = () =>
    start(async () => {
      const res = await askDoubt({ category: "Course content", subject, body, sessionTitle: lesson.title });
      if (!res.ok) return void toast.error(res.error);
      onAsked({ id: res.data.id, subject: res.data.subject, body: res.data.body, createdAt: res.data.createdAt, status: "open", answer: null, asker: res.data.studentName, mine: true });
      setSubject("");
      setDetails("");
      toast.success(t.doubts.sent);
    });

  const input = "w-full rounded-xl border border-line-strong bg-surface px-3.5 text-base outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5";
  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) send();
        }}
        className="space-y-2.5"
      >
        <h3 className="text-lg font-semibold text-fg">{T.askHere}</h3>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={T.qSubject} aria-label={T.qSubject} className={cn(input, "h-12")} />
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} placeholder={T.qDetails} aria-label={T.qDetails} className={cn(input, "resize-none py-3")} />
        <button type="submit" disabled={!canSend || pending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-bean-600 px-4 text-base font-semibold text-white transition-colors hover:bg-bean-700 disabled:opacity-40">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} {T.send}
        </button>
      </form>

      <div>
        <p className="mb-2 text-sm font-medium text-fg-muted">{T.qaCount(questions.length)}</p>
        {questions.length === 0 ? (
          <p className="rounded-xl bg-surface-2 px-4 py-3 text-base text-fg-muted">{T.qaEmpty}</p>
        ) : (
          <ul className="space-y-3">
            {questions.map((q) => (
              <li key={q.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-muted">
                  <span className="font-medium text-fg">{q.mine ? t.lobby.you : q.asker}</span>· {fmtDate(q.createdAt)}
                  <span className={cn("ml-auto inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold", q.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
                    {q.status === "answered" ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                    {q.status === "answered" ? t.doubts.answered : t.doubts.waiting}
                  </span>
                </div>
                <p className="mt-1.5 text-base font-semibold text-fg">{q.subject}</p>
                {q.body !== q.subject && <p className="mt-0.5 text-base text-fg-muted">{q.body}</p>}
                {q.answer && (
                  <div className="mt-3 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/60 p-3">
                    <p className="text-sm font-medium text-emerald-800">{q.answer.by}</p>
                    <p className="mt-0.5 text-base text-fg">{q.answer.body}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Files({ files }: { files: ReturnType<typeof lessonExtras>["resources"] }) {
  const { t } = useT();
  if (!files.length) return <p className="rounded-xl bg-surface-2 px-4 py-3 text-base text-fg-muted">{t.tabs.filesEmpty}</p>;
  return (
    <ul className="divide-y divide-line rounded-xl border border-line">
      {files.map((f) => {
        const Icon = f.kind === "Excel" ? FileSpreadsheet : FileText;
        return (
          <li key={f.name} className="flex items-center gap-3 p-3.5">
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg", f.kind === "Excel" ? "bg-emerald-50 text-emerald-700" : f.kind === "Word" ? "bg-sky-50 text-sky-700" : "bg-bean-50 text-bean-700")}>
              <Icon className="size-5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-base font-medium text-fg">{f.name}</span>
              <span className="text-sm text-fg-muted">
                {f.kind} · {sizeLabel(f.sizeKb)}
              </span>
            </span>
            <button onClick={() => toast(t.player.downloadSoon)} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-line px-3.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-2">
              <Download className="size-4" /> <span className="hidden sm:inline">{t.tabs.download}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
