"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { CalendarClock, CheckCircle2, ClipboardList, FileText, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createAssignment, reviewSubmission } from "@/lib/actions/admin";
import { deleteAssignment, updateAssignment } from "@/lib/actions/admin-crud";
import { ConfirmDelete, DateInput, FormError, FormFooter, Modal, NumberInput, RowActions, Select, TextArea, TextInput, istDateToIso, isoToIstDate, useAdminAction } from "./crud";
import type { AssignmentAdmin } from "@/lib/types";
import { cn, fmtDate, fmtDayLong, fmtTime } from "@/lib/utils";
import { curriculum } from "@/content/site";
import { Avatar, Page, PageHeader, fadeUp } from "./ui";

type Sub = AssignmentAdmin["submissions"][number];

export function AssignmentsAdminView({ initial, serverNow }: { initial: AssignmentAdmin[]; serverNow: number }) {
  const [items, setItems] = useState(initial);
  const [sel, setSel] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AssignmentAdmin | null>(null);
  const [removing, setRemoving] = useState<AssignmentAdmin | null>(null);
  const del = useAdminAction();
  const current = items.find((a) => a.id === sel) ?? null;

  const applyReview = (aid: number, sid: number, patch: Partial<Sub>) =>
    setItems((xs) => xs.map((a) => (a.id === aid ? { ...a, submissions: a.submissions.map((s) => (s.id === sid ? { ...s, ...patch } : s)) } : a)));

  return (
    <Page>
      <PageHeader
        title="Assignments"
        sub="Create tasks per module and review submissions. Scores and feedback show up for students instantly."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus /> New assignment
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((a) => {
          const toReview = a.submissions.filter((s) => s.score === null).length;
          const pct = Math.round((a.submissions.length / a.enrolled) * 100);
          const past = +new Date(a.dueAt) < serverNow;
          return (
            <motion.button key={a.id} variants={fadeUp} onClick={() => setSel(a.id)} className="group flex flex-col rounded-[22px] border border-line bg-surface p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgb(0_0_0/0.3)]">
              <div className="flex items-center gap-2 text-xs text-fg-muted">
                <ClipboardList className="size-4 text-bean-600" /> {a.moduleTitle ?? "General"}
                {toReview > 0 && <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">{toReview} to review</span>}
              </div>
              <h3 className="mt-3 font-semibold text-fg">{a.title}</h3>
              <div className={cn("mt-1 inline-flex items-center gap-1.5 text-xs", past ? "text-fg-muted" : "text-bean-600")}>
                <CalendarClock className="size-3.5" /> {past ? "Closed" : "Due"} {fmtDate(a.dueAt)}
              </div>
              <div className="mt-auto pt-5">
                <div className="flex justify-between text-xs text-fg-muted">
                  <span>Submitted</span>
                  <span className="tabular-nums">
                    {a.submissions.length}/{a.enrolled}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.2 }} className="h-full rounded-full bg-bean-600" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {current && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSel(null)} className="fixed inset-0 z-50 bg-ink-950/40 backdrop-blur-sm" />
            <motion.aside role="dialog" aria-modal aria-label={current.title} initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 34 }} className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-surface shadow-2xl">
              <div className="relative overflow-hidden bg-ink-950 p-6 text-white">
                <div aria-hidden className="absolute -right-16 -top-16 size-56 rounded-full bg-bean-600/40 blur-3xl" />
                <button onClick={() => setSel(null)} className="relative ml-auto grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Close">
                  <X className="size-4" />
                </button>
                <h2 className="font-display relative text-2xl font-semibold">{current.title}</h2>
                <p className="relative mt-1 text-sm text-white/55">
                  Due {fmtDayLong(current.dueAt)} · {current.maxScore} pts · {current.submissions.length} submissions
                </p>
                <RowActions className="relative mt-4" dark onEdit={() => setEditing(current)} onDelete={() => setRemoving(current)} />
              </div>
              <ul className="flex-1 space-y-3 overflow-y-auto p-5" data-lenis-prevent>
                {current.submissions.length === 0 && <li className="py-10 text-center text-sm text-fg-muted">No submissions yet.</li>}
                {current.submissions.map((s) => (
                  <SubmissionCard key={s.id} s={s} a={current} onReviewed={(patch) => applyReview(current.id, s.id, patch)} />
                ))}
              </ul>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <CreateDialog open={creating} onClose={() => setCreating(false)} onCreated={(a) => setItems((xs) => [...xs, a])} />
      <EditAssignmentDialog
        key={editing?.id ?? "none"}
        assignment={editing}
        onClose={() => setEditing(null)}
        onSaved={(id, patch) => {
          setItems((xs) => xs.map((a) => (a.id === id ? { ...a, ...patch } : a)));
          setEditing(null);
        }}
      />
      <ConfirmDelete
        open={!!removing}
        onClose={() => setRemoving(null)}
        pending={del.pending}
        error={del.error}
        title="Delete this assignment?"
        body={
          <>
            <b>{removing?.title}</b> and its {removing?.submissions.length ?? 0} submissions are removed for every student. This can’t be undone.
          </>
        }
        onConfirm={() => {
          const a = removing!;
          del.run(() => deleteAssignment(a.id), "Assignment deleted", () => {
            setItems((xs) => xs.filter((x) => x.id !== a.id));
            setSel(null);
            setRemoving(null);
          });
        }}
      />
    </Page>
  );
}

function SubmissionCard({ s, a, onReviewed }: { s: Sub; a: AssignmentAdmin; onReviewed: (p: Partial<Sub>) => void }) {
  const [score, setScore] = useState(s.score ?? "");
  const [feedback, setFeedback] = useState(s.feedback ?? "");
  const [editing, setEditing] = useState(s.score === null);
  const [pending, start] = useTransition();
  const save = () =>
    start(async () => {
      const res = await reviewSubmission({ assignmentId: a.id, submissionId: s.id, score: Number(score), maxScore: a.maxScore, feedback });
      if (!res.ok) return void toast.error(res.error);
      onReviewed(res.data);
      setEditing(false);
      toast.success(`Reviewed ${s.studentName}`, { description: "The student can see the score and feedback now." });
    });
  return (
    <li className="rounded-2xl border border-line p-4">
      <div className="flex items-center gap-3">
        <Avatar name={s.studentName} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-fg">{s.studentName}</div>
          <div className="text-xs text-fg-muted">
            {fmtDate(s.submittedAt)} · {fmtTime(s.submittedAt)}
            {+new Date(s.submittedAt) > +new Date(a.dueAt) && <span className="ml-1 font-medium text-bean-600">· Late</span>}
          </div>
        </div>
        {s.score !== null && !editing ? (
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="size-3.5" /> {s.score}/{a.maxScore}
          </button>
        ) : (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">To review</span>
        )}
      </div>
      <p className="mt-3 text-sm text-fg">{s.text}</p>
      {s.fileName && (
        <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs text-fg">
          <FileText className="size-3.5" /> {s.fileName}
        </span>
      )}
      {!editing && s.feedback && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs text-fg-muted">“{s.feedback}” — {s.reviewedBy}</p>}
      <AnimatePresence initial={false}>
        {editing && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
            className="overflow-hidden"
          >
            <div className="mt-3 flex gap-2">
              <input type="number" min={0} max={a.maxScore} value={score} onChange={(e) => setScore(e.target.value)} placeholder={`/ ${a.maxScore}`} aria-label="Score" className="h-10 w-24 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-ink-900" />
              <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Feedback for the student" aria-label="Feedback" className="h-10 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-ink-900" />
              <Button type="submit" size="sm" variant="dark" className="h-10" disabled={pending || score === ""}>
                {pending ? <Loader2 className="animate-spin" /> : "Save"}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </li>
  );
}

function CreateDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (a: AssignmentAdmin) => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moduleTitle, setModuleTitle] = useState(curriculum[0]!.title);
  const [date, setDate] = useState("");
  const [maxScore, setMaxScore] = useState(20);
  const [pending, start] = useTransition();
  const input = "mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg outline-none transition focus:border-ink-900";

  const submit = () =>
    start(async () => {
      const res = await createAssignment({ title, description, moduleTitle, dueAt: new Date(`${date}T23:59:00+05:30`).toISOString(), maxScore });
      if (!res.ok) return void toast.error(res.error);
      onCreated({ ...res.data, enrolled: 34, submissions: [] });
      toast.success("Assignment published", { description: "Students are notified on WhatsApp and in the portal." });
      setTitle("");
      setDescription("");
      onClose();
    });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm" />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <motion.form
              role="dialog"
              aria-modal
              aria-label="New assignment"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="pointer-events-auto w-full max-w-lg rounded-[28px] bg-surface p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-fg">New assignment</h2>
                <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Close">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-6 space-y-4 text-sm text-fg-muted">
                <label className="block">
                  Title
                  <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className={input} />
                </label>
                <label className="block">
                  Instructions
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={cn(input, "h-auto resize-none py-3")} />
                </label>
                <label className="block">
                  Module
                  <select value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} className={input}>
                    {curriculum.map((c) => (
                      <option key={c.title}>{c.title}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    Due date
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
                  </label>
                  <label className="block">
                    Max score
                    <input type="number" min={1} max={100} value={maxScore} onChange={(e) => setMaxScore(Number(e.target.value))} className={input} />
                  </label>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !title.trim() || !date || description.trim().length < 10}>
                  {pending && <Loader2 className="animate-spin" />} Publish
                </Button>
              </div>
            </motion.form>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function EditAssignmentDialog({ assignment, onClose, onSaved }: { assignment: AssignmentAdmin | null; onClose: () => void; onSaved: (id: number, patch: Partial<AssignmentAdmin>) => void }) {
  const modules = [...new Set([...(assignment?.moduleTitle ? [assignment.moduleTitle] : []), ...curriculum.map((c) => c.title)])];
  const [f, setF] = useState(() => ({
    title: assignment?.title ?? "",
    description: assignment?.description ?? "",
    moduleTitle: assignment?.moduleTitle ?? modules[0] ?? "",
    date: assignment ? isoToIstDate(assignment.dueAt) : "",
    maxScore: assignment?.maxScore ?? 20,
  }));
  const act = useAdminAction();
  const save = () => {
    if (!assignment) return;
    const patch = { title: f.title, description: f.description, moduleTitle: f.moduleTitle || null, dueAt: istDateToIso(f.date, "23:59"), maxScore: f.maxScore };
    act.run(() => updateAssignment(assignment.id, patch), "Assignment updated", () => onSaved(assignment.id, patch));
  };
  return (
    <Modal open={!!assignment} onClose={onClose} title="Edit assignment" footer={<FormFooter onCancel={onClose} onSave={save} pending={act.pending} saveLabel="Save changes" />}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput label="Title" value={f.title} onChange={(v) => setF((x) => ({ ...x, title: v }))} className="sm:col-span-2" />
        <TextArea label="What should students submit?" value={f.description} onChange={(v) => setF((x) => ({ ...x, description: v }))} rows={4} maxLength={4000} className="sm:col-span-2" />
        <Select label="Module" value={f.moduleTitle} onChange={(v) => setF((x) => ({ ...x, moduleTitle: v }))} options={modules.map((m) => ({ value: m, label: m }))} className="sm:col-span-2" />
        <DateInput label="Due date" value={f.date} onChange={(v) => setF((x) => ({ ...x, date: v }))} />
        <NumberInput label="Max score" value={f.maxScore} onChange={(v) => setF((x) => ({ ...x, maxScore: v }))} min={1} max={100} />
      </div>
      <FormError error={act.error} />
    </Modal>
  );
}
