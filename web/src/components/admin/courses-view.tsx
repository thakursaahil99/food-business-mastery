"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { ChevronDown, Eye, FileText, PlayCircle, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { addLesson } from "@/lib/actions/admin";
import type { Lesson, ProgramModule } from "@/lib/types";
import { cn, secondsLabel } from "@/lib/utils";
import { Page, PageHeader, fadeUp } from "./ui";

type Upload = { moduleId: number; name: string; pct: number };

export function CoursesView({ initial, embedded = false }: { initial: ProgramModule[]; embedded?: boolean }) {
  const [modules, setModules] = useState(initial);
  const [open, setOpen] = useState<number | null>(initial[0]?.id ?? null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const target = useRef<number | null>(null);
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const totalSec = modules.reduce((n, m) => n + m.lessons.reduce((a, l) => a + l.durationSec, 0), 0);

  const pick = (moduleId: number) => {
    target.current = moduleId;
    fileRef.current?.click();
  };

  /** Simulated chunked upload; the real one is a signed multipart upload to Laravel → ffmpeg HLS job. */
  const upload = (file: File) => {
    const moduleId = target.current;
    if (!moduleId) return;
    const name = file.name;
    setUploads((u) => [...u, { moduleId, name, pct: 0 }]);
    let pct = 0;
    const t = setInterval(async () => {
      pct = Math.min(100, pct + 8 + Math.random() * 14);
      setUploads((u) => u.map((x) => (x.name === name && x.moduleId === moduleId ? { ...x, pct } : x)));
      if (pct < 100) return;
      clearInterval(t);
      const title = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      const res = await addLesson({ moduleId, title, fileName: name, durationSec: 1800 });
      setUploads((u) => u.filter((x) => !(x.name === name && x.moduleId === moduleId)));
      if (!res.ok) return void toast.error(res.error);
      setModules((ms) => ms.map((m) => (m.id === moduleId ? { ...m, lessons: [...m.lessons, res.data] } : m)));
      toast.success("Video uploaded", { description: "Transcoding to 360p/720p HLS. Students see it in Learn when ready." });
    }, 220);
  };

  const sub = `CGR Mastery Program · ${modules.length} modules · ${totalLessons} lessons · ${secondsLabel(totalSec)} of video`;
  return (
    <Page>
      {embedded ? (
        <motion.div variants={fadeUp} className="border-t border-line pt-8">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-fg">CGR program videos</h2>
          <p className="mt-1 text-sm text-fg-muted">{sub}</p>
        </motion.div>
      ) : (
        <PageHeader title="Course content" sub={sub} />
      )}
      <input
        ref={fileRef}
        type="file"
        accept="video/*,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) upload(f);
          e.target.value = "";
        }}
      />
      <motion.p variants={fadeUp} className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-fg-muted">
        Zoom class recordings are added automatically under <span className="font-medium text-fg">Learn → Class recordings</span>. Upload edited or pre-recorded lessons here.
      </motion.p>
      <div className="space-y-3">
        {modules.map((m, mi) => {
          const isOpen = open === m.id;
          const ups = uploads.filter((u) => u.moduleId === m.id);
          return (
            <motion.section key={m.id} variants={fadeUp} className="overflow-hidden rounded-[22px] border border-line bg-surface">
              <div className="flex items-center gap-4 p-5">
                <button onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-4 text-left">
                  <span className="font-display grid size-11 shrink-0 place-items-center rounded-2xl bg-ink-900 text-sm font-bold text-white">0{mi + 1}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-lg font-semibold text-fg">{m.title}</span>
                    <span className="block truncate text-xs text-fg-muted">
                      {mi === 4 ? "Ongoing" : m.weekFrom === m.weekTo ? `Week ${m.weekFrom}` : `Weeks ${m.weekFrom}–${m.weekTo}`} · {m.lessons.length} lessons
                    </span>
                  </span>
                  <ChevronDown className={cn("ml-auto size-5 shrink-0 text-fg-muted transition-transform", isOpen && "rotate-180")} />
                </button>
                <button onClick={() => pick(m.id)} className="hidden items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-medium text-fg hover:bg-surface-2 sm:inline-flex">
                  <UploadCloud className="size-4 text-bean-600" /> Upload
                </button>
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden border-t border-line">
                    <ul className="divide-y divide-line">
                      {m.lessons.map((l) => (
                        <LessonRow key={l.id} l={l} />
                      ))}
                      {ups.map((u) => (
                        <li key={u.name} className="flex items-center gap-4 px-5 py-3.5">
                          <UploadCloud className="size-5 animate-pulse text-bean-600" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm text-fg">{u.name}</div>
                            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                              <motion.div animate={{ width: `${u.pct}%` }} className="h-full rounded-full bg-bean-600" />
                            </div>
                          </div>
                          <span className="w-10 text-right text-xs tabular-nums text-fg-muted">{Math.round(u.pct)}%</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => pick(m.id)} className="flex w-full items-center justify-center gap-2 border-t border-dashed border-line-strong py-4 text-sm font-medium text-bean-600 transition-colors hover:bg-bean-50/50">
                      <UploadCloud className="size-4" /> Upload a video or PDF to this module
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
      </div>
    </Page>
  );
}

function LessonRow({ l }: { l: Lesson }) {
  return (
    <li className="flex items-center gap-4 px-5 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-bean-50 text-bean-600">{l.type === "pdf" ? <FileText className="size-4" /> : <PlayCircle className="size-4" />}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-fg">
          {l.order > 99 ? "New" : `${l.order}.`} {l.title}
        </div>
        <div className="text-xs text-fg-muted">{l.type === "pdf" ? "PDF" : secondsLabel(l.durationSec)}</div>
      </div>
      {l.isPreview && (
        <span className="inline-flex items-center gap-1 rounded-full bg-gold-400/25 px-2 py-0.5 text-[10px] font-medium text-amber-800">
          <Eye className="size-3" /> Free preview
        </span>
      )}
      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", l.locked ? "bg-surface-2 text-fg-muted" : "bg-emerald-50 text-emerald-700")}>{l.locked ? "Unlocks later" : "Live"}</span>
    </li>
  );
}
