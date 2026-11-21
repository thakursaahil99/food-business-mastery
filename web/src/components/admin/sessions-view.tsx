"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";
import { AlertTriangle, CalendarPlus, CheckCircle2, CircleDot, Loader2, PlayCircle, Radio, Video, VideoOff, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createSession, getHostLink, setSessionRecording } from "@/lib/actions/admin";
import { deleteSession, updateSession } from "@/lib/actions/admin-crud";
import { ConfirmDelete, DateTimeInput, FormError, FormFooter, Modal, NumberInput, RowActions, Select, TextInput, istLocalToIso, isoToIstLocal, useAdminAction } from "./crud";
import { getJoinState } from "@/lib/join-window";
import type { BatchSummary, ClassSession, RecordingStatus, SessionType } from "@/lib/types";
import { cn, durationLabel, fmtDayLong, fmtTime, istDayKey, secondsLabel } from "@/lib/utils";
import { useNow } from "@/components/portal/shell";
import { StatusBadge, TypeChip, dayHeading, typeMeta } from "@/components/portal/session-ui";
import { Empty, Page, PageHeader, Tabs, fadeUp } from "./ui";

type When = "upcoming" | "past";

const recUi: Record<RecordingStatus, { label: string; icon: typeof Video; cls: string }> = {
  off: { label: "Not recorded", icon: VideoOff, cls: "bg-ink-100 text-ink-500" },
  scheduled: { label: "Will record", icon: CircleDot, cls: "bg-sky-50 text-sky-700" },
  recording: { label: "Recording", icon: Radio, cls: "bg-bean-600 text-white" },
  processing: { label: "Processing", icon: Loader2, cls: "bg-amber-50 text-amber-800" },
  ready: { label: "Recording ready", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
  failed: { label: "Recording failed", icon: AlertTriangle, cls: "bg-bean-50 text-bean-700" },
};

export function RecordingPill({ status }: { status: RecordingStatus }) {
  const ui = recUi[status];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold", ui.cls)}>
      <ui.icon className={cn("size-3", status === "processing" && "animate-spin", status === "recording" && "animate-pulse")} />
      {ui.label}
    </span>
  );
}

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40", on ? "bg-bean-600" : "bg-ink-200")}>
      <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 32 }} className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow", on ? "right-0.5" : "left-0.5")} />
    </button>
  );
}

export function SessionsView({ initial, batches, serverNow, openNew }: { initial: ClassSession[]; batches: BatchSummary[]; serverNow: number; openNew: boolean }) {
  const now = useNow();
  const ref = now ?? serverNow;
  const [sessions, setSessions] = useState(initial);
  const [when, setWhen] = useState<When>("upcoming");
  const [dialog, setDialog] = useState(openNew);
  const [editing, setEditing] = useState<ClassSession | null>(null);
  const [removing, setRemoving] = useState<ClassSession | null>(null);
  const del = useAdminAction();
  const [, start] = useTransition();

  const list = sessions.filter((s) => (when === "upcoming" ? +new Date(s.endsAt) > ref : +new Date(s.endsAt) <= ref));
  if (when === "past") list.reverse();
  const groups = new Map<string, ClassSession[]>();
  list.forEach((s) => groups.set(istDayKey(s.startsAt), [...(groups.get(istDayKey(s.startsAt)) ?? []), s]));
  const counts = { ready: sessions.filter((s) => s.recordingStatus === "ready").length, processing: sessions.filter((s) => s.recordingStatus === "processing").length };

  const toggleRecording = (s: ClassSession, record: boolean) => {
    const patch = { recordingEnabled: record, recordingStatus: (record ? "scheduled" : "off") as RecordingStatus };
    setSessions((xs) => xs.map((x) => (x.id === s.id ? { ...x, ...patch } : x)));
    start(async () => {
      const res = await setSessionRecording(s.id, record);
      if (!res.ok) {
        setSessions((xs) => xs.map((x) => (x.id === s.id ? s : x)));
        toast.error(res.error);
      } else toast.success(record ? "Cloud recording on" : "Recording turned off", { description: s.title });
    });
  };

  const host = (s: ClassSession) =>
    start(async () => {
      const res = await getHostLink(s.id);
      if (!res.ok) return void toast.error(res.error);
      if (res.data.url) window.open(res.data.url, "_blank", "noopener");
      else toast("Zoom host link", { description: "Connect the Zoom app on the backend to start meetings from here." });
    });

  return (
    <Page>
      <PageHeader
        title="Classes"
        sub="Every class is a Zoom meeting. Turn on recording and it lands in students' Learn tab automatically."
        actions={
          <Button size="sm" onClick={() => setDialog(true)}>
            <CalendarPlus /> New class
          </Button>
        }
      />

      <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-[#0b5cff] text-white">
            <Video className="size-5" />
          </span>
          <div className="text-sm">
            <div className="font-medium text-fg">Zoom</div>
            <div className="text-xs text-fg-muted">Server-to-Server app · not connected (demo)</div>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="font-display text-2xl font-bold text-fg">{counts.ready}</div>
          <div className="text-xs text-fg-muted">recordings published to Learn</div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <div className="font-display text-2xl font-bold text-fg">{counts.processing}</div>
          <div className="text-xs text-fg-muted">processing (download → HLS)</div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Tabs id="when" value={when} onChange={setWhen} options={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }]} />
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-6">
        {groups.size === 0 && <Empty>No classes.</Empty>}
        {[...groups.entries()].map(([day, items]) => (
          <section key={day}>
            <h2 className="mb-2 flex items-center gap-3">
              <span className="font-display font-semibold text-fg">{dayHeading(items[0]!.startsAt, now)}</span>
              <span className="text-xs text-fg-muted">{fmtDayLong(items[0]!.startsAt)}</span>
              <span className="h-px flex-1 bg-line" />
            </h2>
            <ul className="overflow-hidden rounded-2xl border border-line bg-surface">
              <AnimatePresence initial={false}>
                {items.map((s) => {
                  const js = now ? getJoinState(s, now) : null;
                  const upcoming = +new Date(s.endsAt) > ref;
                  return (
                    <motion.li key={s.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line px-4 py-3.5 last:border-0">
                      <div className="w-24 shrink-0">
                        <div className="text-sm font-semibold tabular-nums text-fg">{fmtTime(s.startsAt)}</div>
                        <div className="text-xs text-fg-muted">{durationLabel(s.startsAt, s.endsAt)}</div>
                      </div>
                      <div className="min-w-0 flex-1 basis-56">
                        <div className="truncate text-sm font-medium text-fg">{s.title}</div>
                        <div className="truncate text-xs text-fg-muted">
                          {s.coach.name} · {s.batchName}
                          {s.recordingDurationSec ? ` · ${secondsLabel(s.recordingDurationSec)} recorded` : ""}
                        </div>
                      </div>
                      <TypeChip type={s.type} />
                      <StatusBadge session={s} now={now} />
                      {upcoming && s.status !== "cancelled" ? (
                        <label className="flex items-center gap-2 text-xs text-fg-muted">
                          <Switch on={s.recordingEnabled} onChange={(v) => toggleRecording(s, v)} label={`Record ${s.title}`} disabled={s.recordingStatus === "recording"} />
                          {s.recordingStatus === "recording" ? <RecordingPill status="recording" /> : "Record"}
                        </label>
                      ) : (
                        <RecordingPill status={s.recordingStatus} />
                      )}
                      {js?.state === "open" && (
                        <Button size="sm" onClick={() => host(s)} className="bg-[#0b5cff] shadow-none hover:bg-[#2d74ff]">
                          <PlayCircle /> {js.live ? "Rejoin as host" : "Start"}
                        </Button>
                      )}
                      {upcoming && <RowActions onEdit={() => setEditing(s)} onDelete={() => setRemoving(s)} deleteLabel="Cancel class" />}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </section>
        ))}
      </motion.div>

      <NewSessionDialog
        open={dialog}
        onClose={() => setDialog(false)}
        batches={batches.filter((b) => b.status !== "completed")}
        onCreated={(s) => {
          setSessions((cur) => [...cur, s].sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)));
          setWhen("upcoming");
        }}
      />
      <EditSessionDialog
        key={editing?.id ?? "none"}
        session={editing}
        onClose={() => setEditing(null)}
        onSaved={(id, patch) => {
          setSessions((cur) => cur.map((x) => (x.id === id ? { ...x, ...patch } : x)).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)));
          setEditing(null);
        }}
      />
      <ConfirmDelete
        open={!!removing}
        onClose={() => setRemoving(null)}
        pending={del.pending}
        error={del.error}
        title="Cancel this class?"
        confirmLabel="Cancel class"
        body={
          <>
            <b>{removing?.title}</b> is removed from every student’s schedule and the Zoom meeting is deleted. Students who registered get a cancellation message.
          </>
        }
        onConfirm={() => {
          const s = removing!;
          del.run(() => deleteSession(s.id), "Class cancelled", () => {
            setSessions((cur) => cur.filter((x) => x.id !== s.id));
            setRemoving(null);
          });
        }}
      />
    </Page>
  );
}

function NewSessionDialog({ open, onClose, batches, onCreated }: { open: boolean; onClose: () => void; batches: BatchSummary[]; onCreated: (s: ClassSession) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<SessionType>("live");
  const [batchId, setBatchId] = useState(batches[0]?.id ?? 0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [duration, setDuration] = useState(120);
  const [record, setRecord] = useState(true);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      // Inputs are IST wall-clock time; convert to a UTC instant.
      const startsAt = new Date(`${date}T${time}:00+05:30`).toISOString();
      const res = await createSession({ title, type, batchId, startsAt, durationMin: duration, record });
      if (!res.ok) return void toast.error(res.error);
      onCreated(res.data);
      toast.success("Class scheduled on Zoom", { description: record ? "Cloud recording is on. Students get reminders 1 day and 15 min before." : "Students get reminders 1 day and 15 min before." });
      setTitle("");
      onClose();
    });

  const input = "h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm" />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4">
            <motion.form
              role="dialog"
              aria-modal
              aria-label="New class"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              data-lenis-prevent
              className="pointer-events-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[28px] bg-surface p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-fg">New class</h2>
                <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-surface-2" aria-label="Close">
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                <label className="block text-sm">
                  <span className="text-fg-muted">Title</span>
                  <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Rostering for 24×7 sites" className={`${input} mt-1.5`} />
                </label>
                <div>
                  <span className="text-sm text-fg-muted">Type</span>
                  <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {(Object.keys(typeMeta) as SessionType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setType(t);
                          setRecord(t !== "mentorship");
                        }}
                        aria-pressed={type === t}
                        className={cn("flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors", type === t ? "border-ink-900 bg-ink-900 text-white" : "border-line text-fg-muted hover:text-fg")}
                      >
                        <span className={cn("size-2 rounded-full", typeMeta[t].dot)} />
                        {typeMeta[t].label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm">
                  <span className="text-fg-muted">Batch</span>
                  <select value={batchId} onChange={(e) => setBatchId(Number(e.target.value))} className={`${input} mt-1.5`}>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <label className="col-span-2 block text-sm sm:col-span-1">
                    <span className="text-fg-muted">Date</span>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${input} mt-1.5`} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-fg-muted">Time (IST)</span>
                    <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${input} mt-1.5`} />
                  </label>
                  <label className="block text-sm">
                    <span className="text-fg-muted">Minutes</span>
                    <input type="number" min={15} max={480} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={`${input} mt-1.5`} />
                  </label>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2/50 p-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#0b5cff] text-white">
                    <Video className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="font-medium text-fg">Record this class</div>
                    <div className="text-xs text-fg-muted">Zoom cloud recording. Published to Learn after processing.</div>
                  </div>
                  <Switch on={record} onChange={setRecord} label="Record this class" />
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !title.trim() || !date}>
                  {pending && <Loader2 className="animate-spin" />} Create Zoom class
                </Button>
              </div>
            </motion.form>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function EditSessionDialog({ session, onClose, onSaved }: { session: ClassSession | null; onClose: () => void; onSaved: (id: number, patch: Partial<ClassSession>) => void }) {
  const [f, setF] = useState(() => ({
    title: session?.title ?? "",
    type: session?.type ?? ("live" as SessionType),
    start: session ? isoToIstLocal(session.startsAt) : "",
    duration: session ? Math.round((+new Date(session.endsAt) - +new Date(session.startsAt)) / 60_000) : 90,
  }));
  const act = useAdminAction();
  const save = () => {
    if (!session) return;
    act.run(() => updateSession(session.id, { title: f.title, type: f.type, startsAt: istLocalToIso(f.start), durationMin: f.duration }), "Class updated", (r) => onSaved(session.id, r.data));
  };
  return (
    <Modal open={!!session} onClose={onClose} title="Edit class" sub={session ? session.batchName : undefined} footer={<FormFooter onCancel={onClose} onSave={save} pending={act.pending} saveLabel="Save changes" />}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextInput label="Title" value={f.title} onChange={(v) => setF((x) => ({ ...x, title: v }))} className="sm:col-span-2" />
        <Select
          label="Type"
          value={f.type}
          onChange={(v) => setF((x) => ({ ...x, type: v }))}
          options={[
            { value: "live" as SessionType, label: "Live class" },
            { value: "webinar" as SessionType, label: "Webinar" },
            { value: "mentorship" as SessionType, label: "Mentorship" },
          ]}
        />
        <NumberInput label="Duration" hint="minutes" value={f.duration} onChange={(v) => setF((x) => ({ ...x, duration: v }))} min={15} max={480} step={15} />
        <DateTimeInput label="Starts at" value={f.start} onChange={(v) => setF((x) => ({ ...x, start: v }))} className="sm:col-span-2" />
      </div>
      <p className="mt-3 text-xs text-fg-muted">The Zoom meeting time is updated too. Students see the new time in their schedule and reminders.</p>
      <FormError error={act.error} />
    </Modal>
  );
}
