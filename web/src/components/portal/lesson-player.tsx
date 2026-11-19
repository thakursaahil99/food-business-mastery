"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, FileText, Loader2, Lock, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { useFmt, useT } from "@/components/i18n";
import type { Course, Lesson } from "@/lib/types";
import { readMaxWatched, readProgress, saveProgress, useProgressVersion, withLocalProgress } from "@/lib/lesson-progress";
import { cn } from "@/lib/utils";
import { LessonTabs } from "./lesson-tabs";
import type { LessonQuestion } from "@/lib/api/data-learning";

/*
 * Easy-to-use lesson player for older / non-tech students:
 * one big "Play lesson" button, plain words, large labelled controls, progress that saves itself.
 *
 * No skipping ahead: until a lesson is finished, the student can only move within what they have
 * already watched (going back is fine). The bar shows a "You stopped here" line and shades the
 * watched part. The same rule is checked on `seeking`, so native fullscreen controls (iOS) can't
 * jump ahead either. The backend must enforce it too (progress heartbeats can't jump forward).
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const NEXT_COUNTDOWN = 8;
const SEEK_SLACK = 1.5; // seconds of tolerance for timer jitter
const DONE_AT = 0.9; // fraction watched that counts as finished

type Props = { course: Course; lesson: Lesson; prev: Lesson | null; next: Lesson | null; questions?: LessonQuestion[] };

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

const bigBtn = "inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl px-6 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bean-500/30";
const ctrlBtn = "inline-flex min-h-12 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60";

export function LessonPlayer({ course, lesson, prev, next, questions = [] }: Props) {
  const { t } = useT();
  const { fmtDate } = useFmt();
  const P = t.player;
  const router = useRouter();
  const reduce = useReducedMotion();
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const lastSave = useRef(0);
  const maxRef = useRef(0); // furthest point reached by normal playback
  const lastWarn = useRef(0);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [stoppedAt, setStoppedAt] = useState<number | null>(null); // the "You stopped here" line
  const [time, setTime] = useState(0);
  const [maxWatched, setMaxWatched] = useState(0);
  const [duration, setDuration] = useState(lesson.durationSec);
  const [muted, setMuted] = useState(false);
  const [full, setFull] = useState(false);
  const hydrated = useProgressVersion() > 0;

  const all = course.modules.flatMap((m) => m.lessons).map((l) => withLocalProgress(l, hydrated));
  const position = all.findIndex((l) => l.id === lesson.id) + 1;
  const doneCount = all.filter((l) => l.completed).length;
  const current = all.find((l) => l.id === lesson.id) ?? lesson;
  const nextOpen = next && !next.locked ? next : null;
  // A finished lesson can be watched freely; otherwise skipping ahead is blocked.
  const free = current.completed;

  const units = P.units;
  const lengthLabel = (sec: number) => {
    if (sec < 60) return `${sec} ${units.sec}`;
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h) return `${h} ${units.hr} ${m} ${units.min}`;
    return s ? `${m} ${units.min} ${s} ${units.sec}` : `${m} ${units.min}`;
  };

  // Where to resume + how far they're allowed to go. Also covers metadata that loaded before React attached.
  const onMeta = () => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration)) return;
    setDuration(v.duration);
    const saved = readProgress(lesson.id);
    const from = saved && !saved.done ? saved.t : !lesson.completed ? lesson.watchedSec : 0;
    const max = Math.min(v.duration, Math.max(readMaxWatched(lesson.id), lesson.watchedSec, from));
    maxRef.current = max;
    setMaxWatched(max);
    setResumeAt(from > 3 && from < v.duration - 5 ? from : null);
    setStoppedAt(from > 3 && from < v.duration - 1 ? from : null);
  };
  useEffect(() => {
    if ((video.current?.readyState ?? 0) >= 1) onMeta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  // Auto-play the next lesson after a visible countdown, which the student can stop.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (nextOpen) router.push(`/student/learn/${nextOpen.id}`);
      return;
    }
    const tm = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(tm);
  }, [countdown, nextOpen, router]);

  useEffect(() => {
    const onFs = () => setFull(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const warnNoSkip = () => {
    if (Date.now() - lastWarn.current < 2500) return;
    lastWarn.current = Date.now();
    toast(P.noSkip);
  };

  /** Single gate for every position change. */
  const seekTo = (target: number) => {
    const v = video.current;
    if (!v) return;
    const limit = free ? v.duration : maxRef.current;
    if (target > limit + SEEK_SLACK) {
      warnNoSkip();
      target = limit;
    }
    v.currentTime = Math.max(0, target);
    setTime(v.currentTime);
  };

  /** Jump from a note: goes through the same no-skip gate, then plays. */
  const jumpTo = (target: number) => {
    const v = video.current;
    if (!v) return;
    setStarted(true);
    setEnded(false);
    seekTo(target);
    void v.play();
    frame.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const start = (fromStart = false) => {
    const v = video.current;
    if (!v) return;
    v.currentTime = !fromStart && resumeAt ? resumeAt : 0;
    setStarted(true);
    setEnded(false);
    void v.play();
  };

  const togglePlay = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const onTime = () => {
    const v = video.current;
    if (!v) return;
    setTime(v.currentTime);
    // Only normal playback moves the "watched up to" point forward (small steps, never a jump).
    if (v.currentTime > maxRef.current && v.currentTime - maxRef.current < 3) {
      maxRef.current = v.currentTime;
      setMaxWatched(v.currentTime);
    }
    if (Math.abs(v.currentTime - lastSave.current) < 5) return;
    lastSave.current = v.currentTime;
    saveProgress(lesson.id, v.currentTime, maxRef.current / v.duration >= DONE_AT, maxRef.current);
  };

  /** Safety net: catches seeks from native fullscreen controls, keyboard, media keys. */
  const onSeeking = () => {
    const v = video.current;
    if (!v || free) return;
    if (v.currentTime > maxRef.current + SEEK_SLACK) {
      v.currentTime = maxRef.current;
      warnNoSkip();
    }
  };

  const onEnded = () => {
    const v = video.current;
    // Reaching the end is only "finished" if they actually watched to here.
    if (v && !free && maxRef.current < v.duration * DONE_AT) return;
    saveProgress(lesson.id, v?.duration ?? lesson.durationSec, true, v?.duration);
    setEnded(true);
    setPlaying(false);
    if (nextOpen && !reduce) setCountdown(NEXT_COUNTDOWN);
  };

  const fullscreen = () => {
    const f = frame.current;
    const v = video.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) return void document.exitFullscreen();
    if (f?.requestFullscreen) return void f.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
    v?.webkitEnterFullscreen?.(); // iPhone: native fullscreen; onSeeking still blocks skipping
  };

  const pct = (s: number) => (duration ? Math.min(100, (s / duration) * 100) : 0);
  const fromPointer = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * duration;
  };
  const canMark = free || maxWatched / (duration || 1) >= DONE_AT;

  const markDone = () => {
    if (!canMark) return void toast(P.markDoneHint);
    saveProgress(lesson.id, lesson.durationSec, true, lesson.durationSec);
    toast.success(P.marked);
  };

  return (
    <div className="space-y-6 text-base">
      <Link href={`/student/learn?course=${course.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl pr-3 font-medium text-fg-muted transition-colors hover:text-fg">
        <ArrowLeft className="size-5" /> {P.back}
      </Link>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          <div>
            <div className="text-sm font-semibold text-bean-600">
              {course.title} · {t.learn.lessonOf(position, all.length)}
            </div>
            <h1 className="mt-1 text-2xl font-bold leading-tight tracking-tight text-fg sm:text-3xl">{lesson.title}</h1>
          </div>

          {/* Player */}
          <div ref={frame} className={cn("relative overflow-hidden bg-ink-950 shadow-sm", full ? "flex h-full flex-col" : "rounded-2xl sm:rounded-2xl")}>
            {lesson.locked ? (
              <Placeholder icon={<Lock className="size-7" />} title={P.notOpenTitle} body={P.notOpenBody} />
            ) : lesson.type === "pdf" ? (
              <Placeholder icon={<FileText className="size-7" />} title={P.pdfTitle} body={P.pdfBody}>
                <button onClick={() => toast(P.downloadSoon)} className={cn(bigBtn, "mt-5 bg-white text-ink-900 hover:bg-cream-100")}>
                  {P.download}
                </button>
              </Placeholder>
            ) : !lesson.videoSrc ? (
              <Placeholder icon={<Loader2 className="size-7 animate-spin" />} title={P.preparingTitle} body={P.preparingBody} />
            ) : (
              <>
                <div className={cn("relative", full && "min-h-0 flex-1")}>
                  <video
                    key={lesson.id}
                    ref={video}
                    src={lesson.videoSrc}
                    poster={lesson.posterSrc ?? undefined}
                    playsInline
                    preload="metadata"
                    controlsList="nodownload noplaybackrate"
                    disablePictureInPicture
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={() => started && !ended && togglePlay()}
                    onLoadedMetadata={onMeta}
                    onTimeUpdate={onTime}
                    onSeeking={onSeeking}
                    onPlay={() => {
                      setStarted(true);
                      setPlaying(true);
                      setEnded(false);
                      setCountdown(null);
                    }}
                    onPause={() => {
                      setPlaying(false);
                      saveProgress(lesson.id, video.current?.currentTime ?? 0, false, maxRef.current);
                    }}
                    onVolumeChange={() => setMuted(!!video.current?.muted)}
                    onEnded={onEnded}
                    className={cn("w-full bg-black", full ? "h-full object-contain" : "aspect-video")}
                  />

                  {/* Big start screen: no small controls until the student has pressed Play */}
                  {!started && (
                    <div className="absolute inset-0 grid place-items-center bg-gradient-to-t from-ink-950/80 via-ink-950/30 to-ink-950/10 p-4">
                      <div className="flex flex-col items-center gap-3">
                        <button onClick={() => start()} className={cn(bigBtn, "min-h-16 bg-bean-600 px-8 text-lg text-white shadow-sm hover:bg-bean-500")}>
                          <Play className="size-6 fill-current" /> {resumeAt ? P.continueFrom(mmss(resumeAt)) : P.play}
                        </button>
                        {resumeAt !== null && (
                          <button onClick={() => start(true)} className="min-h-11 rounded-xl px-4 text-base font-medium text-white/85 underline underline-offset-4 hover:text-white">
                            {P.fromStart}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {ended && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center overflow-y-auto bg-ink-950/90 p-4 text-center text-white">
                        <div className="w-full max-w-md">
                          <div className="flex items-center justify-center gap-2 text-lg font-semibold sm:text-2xl">
                            <CheckCircle2 className="size-6 text-emerald-400 sm:size-8" /> {P.wellDone}
                          </div>
                          {nextOpen && (
                            <p className="mt-1 hidden text-base text-white/70 sm:block">
                              {P.nextTitle(nextOpen.title)}
                              {countdown !== null && countdown > 0 && P.startsIn(countdown)}
                            </p>
                          )}
                          <div className="mt-3 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:justify-center">
                            {nextOpen && (
                              <Link href={`/student/learn/${nextOpen.id}`} className={cn(bigBtn, "min-h-12 bg-bean-600 text-white hover:bg-bean-500 sm:min-h-14")}>
                                {P.nextLesson} <ArrowRight className="size-5" />
                              </Link>
                            )}
                            {countdown !== null ? (
                              <button onClick={() => setCountdown(null)} className={cn(bigBtn, "min-h-12 border border-white/25 text-white hover:bg-white/10 sm:min-h-14")}>
                                {P.stay}
                              </button>
                            ) : (
                              <button onClick={() => start(true)} className={cn(bigBtn, "min-h-12 border border-white/25 text-white hover:bg-white/10 sm:min-h-14")}>
                                <RotateCcw className="size-5" /> {P.again}
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Our own controls: big, labelled, and they respect the no-skip rule */}
                {started && (
                  <div className="space-y-3 bg-ink-950 px-3 pb-3 pt-4 sm:px-5">
                    <div
                      ref={bar}
                      role="slider"
                      tabIndex={0}
                      aria-label={P.watchedUpTo(mmss(maxWatched))}
                      aria-valuemin={0}
                      aria-valuemax={Math.floor(duration)}
                      aria-valuenow={Math.floor(time)}
                      aria-valuetext={`${mmss(time)} / ${mmss(duration)}`}
                      onPointerDown={(e) => {
                        e.currentTarget.setPointerCapture(e.pointerId);
                        seekTo(fromPointer(e.clientX));
                      }}
                      onPointerMove={(e) => e.buttons === 1 && seekTo(fromPointer(e.clientX))}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowLeft") seekTo(time - 10);
                        if (e.key === "ArrowRight") seekTo(time + 10);
                        if (e.key === " ") {
                          e.preventDefault();
                          togglePlay();
                        }
                      }}
                      className="relative cursor-pointer touch-none py-3 focus-visible:outline-none"
                    >
                      <div className="relative h-2.5 rounded-full bg-white/15">
                        {/* watched (allowed) zone */}
                        <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: `${free ? 100 : pct(maxWatched)}%` }} />
                        {/* current position */}
                        <div className="absolute inset-y-0 left-0 rounded-full bg-bean-500" style={{ width: `${pct(time)}%` }} />
                        {/* "You stopped here" line — stays for the whole visit */}
                        {stoppedAt !== null && (
                          <div className="absolute -top-2 bottom-[-0.5rem] w-1 -translate-x-1/2 rounded-full bg-gold-400 shadow-[0_0_0_2px_rgb(7_7_10)]" style={{ left: `${pct(stoppedAt)}%` }}>
                            <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-gold-400 px-2 py-0.5 text-[11px] font-semibold text-ink-950">{P.stoppedHere}</span>
                          </div>
                        )}
                        <div className="absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-bean-500 shadow" style={{ left: `${pct(time)}%` }} />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button onClick={togglePlay} className={cn(ctrlBtn, "bg-bean-600 px-4 hover:bg-bean-500")}>
                        {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
                        {playing ? P.pause : P.resume}
                      </button>
                      <button onClick={() => seekTo(time - 10)} className={ctrlBtn}>
                        <RotateCcw className="size-5" /> {P.back10}
                      </button>
                      <span className="px-2 font-mono text-sm tabular-nums text-white/80">
                        {mmss(time)} / {mmss(duration)}
                      </span>
                      <span className="ml-auto flex flex-wrap gap-1.5">
                        <button
                          onClick={() => {
                            const v = video.current;
                            if (v) v.muted = !v.muted;
                          }}
                          aria-pressed={!muted}
                          className={ctrlBtn}
                        >
                          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                          <span className="hidden sm:inline">{muted ? P.soundOff : P.soundOn}</span>
                        </button>
                        <button onClick={fullscreen} className={ctrlBtn}>
                          {full ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
                          <span className="hidden sm:inline">{full ? P.exitFullscreen : P.fullscreen}</span>
                        </button>
                      </span>
                    </div>
                    {!free && (
                      <p className="px-1 text-sm text-white/55">
                        {P.watchedUpTo(mmss(maxWatched))}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <p className="flex items-center gap-2 text-sm text-fg-muted">
            <Check className="size-4 text-emerald-600" />
            {lesson.type === "pdf" ? P.notes : P.length(lengthLabel(lesson.durationSec))} · {P.autosave}
          </p>

          {/* Main actions: big, labelled, stacked on phones */}
          {!lesson.locked && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={markDone}
                disabled={current.completed}
                aria-disabled={!canMark}
                className={cn(bigBtn, current.completed ? "bg-emerald-50 text-emerald-700" : canMark ? "border-2 border-line-strong bg-surface text-fg hover:bg-surface-2" : "border-2 border-dashed border-line bg-surface text-fg-muted")}
              >
                <CheckCircle2 className="size-5" /> {current.completed ? P.done : P.markDone}
              </button>
              {nextOpen ? (
                <Link href={`/student/learn/${nextOpen.id}`} className={cn(bigBtn, "bg-ink-900 text-white hover:bg-ink-700")}>
                  {P.nextLesson} <ArrowRight className="size-5" />
                </Link>
              ) : (
                <Link href={`/student/learn?course=${course.slug}`} className={cn(bigBtn, "bg-ink-900 text-white hover:bg-ink-700")}>
                  {P.back}
                </Link>
              )}
              {!current.completed && !canMark && lesson.type !== "pdf" && <p className="text-sm text-fg-muted sm:col-span-2">{P.markDoneHint}</p>}
            </div>
          )}
          {prev && !prev.locked && (
            <Link href={`/student/learn/${prev.id}`} className="flex min-h-14 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2 transition-colors hover:bg-surface-2">
              <ArrowLeft className="size-5 shrink-0 text-fg-muted" />
              <span className="min-w-0">
                <span className="block text-sm text-fg-muted">{P.prevLesson}</span>
                <span className="block truncate font-medium text-fg">{prev.title}</span>
              </span>
            </Link>
          )}

          {!lesson.locked && (
            <LessonTabs
              lesson={lesson}
              partLabel={course.modules.find((m) => m.id === lesson.moduleId)?.title ?? course.title}
              lengthLabel={lesson.type === "pdf" ? P.notes : lengthLabel(lesson.durationSec)}
              questions={questions}
              time={time}
              onSeek={jumpTo}
            />
          )}
        </div>

        {/* Lesson list */}
        <aside className="min-w-0 xl:sticky xl:top-24 xl:h-fit">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="border-b border-line p-5">
              <h2 className="text-lg font-semibold text-fg">{P.listTitle}</h2>
              <div className="mt-1 flex items-center justify-between text-sm text-fg-muted">
                <span>{P.doneOf(doneCount, all.length)}</span>
                <span className="font-semibold tabular-nums text-fg">{all.length ? Math.round((doneCount / all.length) * 100) : 0}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-bean-500 transition-[width] duration-700" style={{ width: `${all.length ? (doneCount / all.length) * 100 : 0}%` }} />
              </div>
            </div>
            <ol className="max-h-[70vh] overflow-y-auto overscroll-contain">
              {course.modules.map((m) => (
                <li key={m.id}>
                  {course.modules.length > 1 && (
                    <div className="flex items-baseline justify-between gap-3 bg-surface-2 px-5 py-2.5 text-sm">
                      <span className="font-semibold text-fg">{m.title}</span>
                      <span className="shrink-0 text-fg-muted">{t.learn.partMeta(m.lessons.length, lengthLabel(m.lessons.reduce((a, l) => a + l.durationSec, 0)))}</span>
                    </div>
                  )}
                  <ol>
                    {m.lessons.map((raw) => {
                      const l = withLocalProgress(raw, hydrated);
                      const n = all.findIndex((x) => x.id === l.id) + 1;
                      const active = l.id === lesson.id;
                      const status = active ? P.stPlaying : l.completed ? P.stDone : l.locked ? (l.releaseAt ? t.tabs.opensOn(fmtDate(l.releaseAt)) : P.stLocked) : l.watchedSec > 0 ? P.stStarted : l.type === "pdf" ? P.stNotes : mmss(l.durationSec);
                      const body = (
                        <>
                          <span
                            className={cn(
                              "grid size-10 shrink-0 place-items-center rounded-full text-base font-semibold",
                              active ? "bg-bean-600 text-white" : l.completed ? "bg-emerald-100 text-emerald-700" : l.locked ? "bg-surface-2 text-fg-muted" : "bg-bean-50 text-bean-700",
                            )}
                          >
                            {l.completed && !active ? <Check className="size-5" /> : l.locked ? <Lock className="size-4" /> : n}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={cn("block text-base leading-snug text-fg", active && "font-semibold")}>{l.title}</span>
                            <span className={cn("mt-0.5 block text-sm", active ? "font-medium text-bean-600" : l.completed ? "text-emerald-700" : "text-fg-muted")}>{status}</span>
                          </span>
                        </>
                      );
                      const cls = cn("flex w-full items-center gap-3 px-5 py-3.5 text-left", active ? "bg-bean-50" : "hover:bg-surface-2", l.locked && "opacity-60");
                      return (
                        <li key={l.id} className="border-b border-line last:border-b-0">
                          {l.locked ? (
                            <button onClick={() => toast(t.learn.lockedToast)} className={cls}>
                              {body}
                            </button>
                          ) : (
                            <Link href={`/student/learn/${l.id}`} aria-current={active ? "page" : undefined} className={cls}>
                              {body}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Placeholder({ icon, title, body, children }: { icon: React.ReactNode; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="grid aspect-video place-items-center bg-gradient-to-br from-ink-900 via-bean-950 to-ink-950 p-6 text-center text-white">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="max-w-sm">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/10">{icon}</span>
        <div className="mt-3 text-lg font-semibold sm:text-xl">{title}</div>
        <p className="mt-1 text-sm text-white/70 sm:text-base">{body}</p>
        {children}
      </motion.div>
    </div>
  );
}
