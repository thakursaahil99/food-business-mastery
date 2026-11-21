"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { answerDoubt } from "@/lib/actions/admin";
import { deleteDoubt } from "@/lib/actions/admin-crud";
import { ConfirmDelete, RowActions, useAdminAction } from "./crud";
import type { Doubt } from "@/lib/types";
import { cn, fmtDate, fmtTime } from "@/lib/utils";
import { Avatar, Empty, Page, PageHeader, Tabs, fadeUp } from "./ui";

type F = "open" | "answered" | "all";

export function DoubtsAdminView({ initial }: { initial: Doubt[] }) {
  const [doubts, setDoubts] = useState(initial);
  const [f, setF] = useState<F>("open");
  const shown = doubts.filter((d) => f === "all" || d.status === f);
  const count = (x: F) => (x === "all" ? doubts.length : doubts.filter((d) => d.status === x).length);
  const [removing, setRemoving] = useState<Doubt | null>(null);
  const del = useAdminAction();

  return (
    <Page>
      <PageHeader title="Doubts" sub="Questions from students. Answer within 24 hours; they get a WhatsApp ping when you reply." />
      <motion.div variants={fadeUp}>
        <Tabs id="doubts" value={f} onChange={setF} options={(["open", "answered", "all"] as F[]).map((v) => ({ value: v, label: v[0]!.toUpperCase() + v.slice(1), count: count(v) }))} />
      </motion.div>
      <motion.ul variants={fadeUp} className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {shown.map((d) => (
            <DoubtCard key={d.id} d={d} onDelete={() => setRemoving(d)} onAnswered={(answer) => setDoubts((xs) => xs.map((x) => (x.id === d.id ? { ...x, status: "answered", answer } : x)))} />
          ))}
        </AnimatePresence>
        {shown.length === 0 && <Empty>Inbox zero. Nice.</Empty>}
      </motion.ul>
      <ConfirmDelete
        open={!!removing}
        onClose={() => setRemoving(null)}
        pending={del.pending}
        error={del.error}
        title="Delete this question?"
        body={
          <>
            “{removing?.subject}” from <b>{removing?.studentName}</b> is removed for the student too. Use this for spam or duplicates.
          </>
        }
        onConfirm={() => {
          const d = removing!;
          del.run(() => deleteDoubt(d.id), "Question deleted", () => {
            setDoubts((xs) => xs.filter((x) => x.id !== d.id));
            setRemoving(null);
          });
        }}
      />
    </Page>
  );
}

function DoubtCard({ d, onAnswered, onDelete }: { d: Doubt; onAnswered: (a: NonNullable<Doubt["answer"]>) => void; onDelete: () => void }) {
  const [reply, setReply] = useState("");
  const [editingAnswer, setEditingAnswer] = useState(false);
  const [pending, start] = useTransition();
  const send = () =>
    start(async () => {
      const res = await answerDoubt(d.id, reply);
      if (!res.ok || !res.data) return void toast.error(res.ok ? "Couldn't send." : res.error);
      onAnswered(res.data);
      setEditingAnswer(false);
      toast.success(d.answer ? "Answer updated" : `Answered ${d.studentName.split(" ")[0]}`);
    });

  return (
    <motion.li layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 30 }} className="rounded-[22px] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={d.studentName} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-fg">{d.studentName}</div>
          <div className="text-xs text-fg-muted">
            {d.category}
            {d.sessionTitle ? ` · ${d.sessionTitle}` : ""} · {fmtDate(d.createdAt)}, {fmtTime(d.createdAt)}
          </div>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", d.status === "answered" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800")}>
          {d.status === "answered" ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
          {d.status === "answered" ? "Answered" : "Open"}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-semibold text-fg">{d.subject}</h3>
        <RowActions
          onEdit={
            d.answer && !editingAnswer
              ? () => {
                  setReply(d.answer!.body);
                  setEditingAnswer(true);
                }
              : undefined
          }
          editLabel="Edit answer"
          onDelete={onDelete}
        />
      </div>
      <p className="mt-1 text-sm text-fg-muted">{d.body}</p>
      {d.answer && !editingAnswer ? (
        <div className="mt-4 rounded-2xl bg-ink-950 p-4 text-white">
          <div className="text-xs text-bean-300">
            {d.answer.by} · {fmtDate(d.answer.at)}
          </div>
          <p className="mt-1.5 text-sm text-white/85">{d.answer.body}</p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="mt-4 flex flex-col gap-2 sm:flex-row"
        >
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Write your answer…" aria-label={`Answer to ${d.subject}`} className="min-w-0 flex-1 resize-none rounded-2xl border border-line bg-surface p-3 text-sm outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5" />
          <Button type="submit" variant="dark" disabled={pending || reply.trim().length < 5} className="sm:self-end">
            {pending ? <Loader2 className="animate-spin" /> : <Send />} {editingAnswer ? "Update" : "Reply"}
          </Button>
          {editingAnswer && (
            <Button type="button" variant="outline" onClick={() => setEditingAnswer(false)} className="sm:self-end">
              Cancel
            </Button>
          )}
        </form>
      )}
    </motion.li>
  );
}
