"use client";

import { PageHeader } from "./ui";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Lock,
  Play,
  Radio,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { useT, useFmt } from "@/components/i18n";
import type { ClassSession, Course, Lesson } from "@/lib/types";
import { useProgressVersion, withLocalProgress } from "@/lib/lesson-progress";
import { cn, secondsLabel } from "@/lib/utils";
import Image from "next/image";
import { DEFAULT_COVER } from "@/lib/course-covers";

const EASE = [0.16, 1, 0.3, 1] as const;

type Tab = "recordings" | "course";

/**
 * "My course" — built for older / non-technical students:
 * one big "continue" button, plain-word status on every lesson, big rows, no hidden gestures.
 */
export function LearnView({
  courses,
  recordings,
}: {
  courses: Course[];
  recordings: ClassSession[];
}) {
  const { t } = useT();
  const params = useSearchParams();
  const router = useRouter();
  const hydrated = useProgressVersion() > 0;
  const [courseSlug, setCourseSlug] = useState(
    () =>
      courses.find((c) => c.slug === params.get("course"))?.slug ??
      courses[0]?.slug,
  );
  const course = courses.find((c) => c.slug === courseSlug) ?? courses[0];
  // server progress + whatever was watched on this device
  const modules = (course?.modules ?? []).map((m) => ({
    ...m,
    lessons: m.lessons.map((l) => withLocalProgress(l, hydrated)),
  }));
  const [tab, setTab] = useState<Tab>(
    params.get("session") ? "recordings" : "course",
  );
  const highlight = Number(params.get("session")) || null;
  const all = modules.flatMap((m) => m.lessons);
  const doneCount = all.filter((l) => l.completed).length;
  const resume =
    all.find((l) => !l.completed && !l.locked && l.watchedSec > 0) ??
    all.find((l) => !l.completed && !l.locked);
  const resumeIndex = resume ? all.indexOf(resume) + 1 : 0;
  const [openState, setOpen] = useState<{
    course?: string;
    id: number | null;
  } | null>(null);
  // the open part falls back to the one you're on whenever the course changes
  const open =
    openState && openState.course === course?.slug
      ? openState.id
      : (resume?.moduleId ?? modules[0]?.id ?? null);
  const toggle = (id: number) =>
    setOpen({ course: course?.slug, id: open === id ? null : id });
  const pickCourse = (slug: string) => {
    setCourseSlug(slug);
    router.replace(`/student/learn?course=${slug}`, { scroll: false });
  };

  const play = (l: Lesson) => {
    if (l.locked) return toast(t.learn.lockedToast);
    router.push(`/student/learn/${l.id}`);
  };

  return (
    <div className="space-y-7">
      <PageHeader
        icon={BookOpen}
        title={t.learn.title}
        sub={<>{t.learn.sub}</>}
      />

      {/* Two big, labelled tabs */}
      <div
        role="tablist"
        className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1 sm:w-fit"
      >
        {(
          [
            ["course", t.learn.tabLessons, BookOpen],
            ["recordings", t.learn.tabRecordings, Video],
          ] as const
        ).map(([k, label, Icon]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn(
              "relative flex min-h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-semibold",
              tab === k ? "text-fg" : "text-fg-muted hover:text-fg",
            )}
          >
            {tab === k && (
              <motion.span
                layoutId="learn-tab"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-lg bg-surface shadow-sm ring-1 ring-line"
              />
            )}
            <Icon className="relative size-5" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      {tab === "recordings" ? (
        <Recordings items={recordings} highlight={highlight} />
      ) : (
        <>
          <CoursePicker
            courses={courses}
            active={course?.slug}
            onPick={pickCourse}
            hydrated={hydrated}
          />

          {/* The one thing to do next */}
          <motion.section
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative flex flex-col overflow-hidden rounded-2xl bg-surface border border-line text-fg shadow-[0_1px_2px_rgb(17_17_20/0.04)] md:flex-row"
          >
            {/* Photo of the course you're on: a strip on phones, a side panel from tablet up */}
            <div className="relative aspect-[21/9] w-full shrink-0 bg-surface-2 md:aspect-auto md:w-[36%]">
              <Image
                src={course?.cover || DEFAULT_COVER}
                alt=""
                fill
                sizes="(min-width: 768px) 36vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="relative min-w-0 flex-1 p-6 sm:p-8">
              <p className="text-base text-fg-muted">
                {t.learn.finished(doneCount, all.length)}
              </p>
              <div
                className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2"
                role="progressbar"
                aria-valuenow={doneCount}
                aria-valuemin={0}
                aria-valuemax={all.length}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${all.length ? (doneCount / all.length) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="h-full rounded-full bg-bean-600"
                />
              </div>
              {resume ? (
                <>
                  <h2 className="mt-7 text-2xl font-semibold leading-snug sm:text-3xl">
                    {resume.title}
                  </h2>
                  <p className="mt-1.5 text-base text-fg-muted">
                    {t.learn.lessonOf(resumeIndex, all.length)}
                    {resume.watchedSec > 0 && resume.type !== "pdf"
                      ? ` · ${t.learn.left(clock(resume.durationSec - resume.watchedSec))}`
                      : ""}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => play(resume)}
                    className="mt-6 flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-bean-600 px-6 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-bean-500 sm:w-auto"
                  >
                    <span className="grid size-9 place-items-center rounded-full bg-white text-bean-600">
                      <Play className="ml-0.5 size-4 fill-current" />
                    </span>
                    {resume.watchedSec > 0 || doneCount > 0
                      ? t.learn.continue
                      : t.learn.start}
                  </motion.button>
                </>
              ) : (
                <p className="mt-6 text-2xl font-semibold">{t.learn.allDone}</p>
              )}
            </div>
          </motion.section>

          {/* Parts → lessons */}
          <div className="space-y-4">
            {modules.map((m, mi) => {
              const done = m.lessons.filter((l) => l.completed).length;
              const isOpen = open === m.id;
              const allLocked = m.lessons.every((l) => l.locked);
              const when =
                course?.kind === "short"
                  ? null
                  : mi === 4
                    ? t.learn.ongoing
                    : t.learn.weeks(m.weekFrom, m.weekTo);
              return (
                <section
                  key={m.id}
                  className={cn(
                    "overflow-hidden rounded-2xl border bg-surface",
                    isOpen ? "border-line-strong" : "border-line",
                  )}
                >
                  <button
                    onClick={() => toggle(m.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 p-5 text-left"
                  >
                    <span
                      className={cn(
                        "grid size-11 shrink-0 place-items-center rounded-xl text-base font-semibold",
                        done === m.lessons.length
                          ? "bg-emerald-50 text-emerald-700"
                          : allLocked
                            ? "bg-surface-2 text-fg-muted"
                            : "bg-bean-50 text-bean-700",
                      )}
                    >
                      {done === m.lessons.length ? (
                        <Check className="size-6" strokeWidth={3} />
                      ) : allLocked ? (
                        <Lock className="size-5" />
                      ) : (
                        mi + 1
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-fg-muted">
                        {t.learn.part(mi + 1)}
                        {when ? ` · ${when}` : ""}
                      </span>
                      <span className="block text-lg font-semibold leading-snug text-fg sm:text-xl">
                        {m.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-fg-muted">
                        {done} /{" "}
                        {t.learn.partMeta(
                          m.lessons.length,
                          clock(
                            m.lessons.reduce((a, l) => a + l.durationSec, 0),
                          ),
                        )}
                      </span>
                    </span>
                    <span className="hidden shrink-0 items-center gap-1 rounded-full border border-line px-3 py-2 text-sm font-medium text-fg sm:inline-flex">
                      {isOpen ? t.learn.hideLessons : t.learn.showLessons}
                      <ChevronDown
                        className={cn(
                          "size-4 transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-6 shrink-0 text-fg-muted transition-transform sm:hidden",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.ol
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.35, ease: EASE }}
                        className="overflow-hidden border-t border-line"
                      >
                        {m.lessons.map((l, li) => (
                          <LessonRow
                            key={l.id}
                            l={l}
                            n={li + 1}
                            current={resume?.id === l.id}
                            onPlay={() => play(l)}
                          />
                        ))}
                      </motion.ol>
                    )}
                  </AnimatePresence>
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function LessonRow({
  l,
  n,
  current,
  onPlay,
}: {
  l: Lesson;
  n: number;
  current: boolean;
  onPlay: () => void;
}) {
  const { t } = useT();
  const { fmtDate } = useFmt();
  const status = l.completed
    ? { text: t.learn.done, cls: "text-emerald-700" }
    : l.locked
      ? {
          text: l.releaseAt
            ? t.tabs.opensOn(fmtDate(l.releaseAt))
            : t.learn.locked,
          cls: "text-fg-muted",
        }
      : l.watchedSec > 0 && l.type !== "pdf"
        ? {
            text: t.learn.left(clock(l.durationSec - l.watchedSec)),
            cls: "text-bean-700",
          }
        : {
            text: l.type === "pdf" ? "PDF" : clock(l.durationSec),
            cls: "text-fg-muted",
          };
  const action = l.locked
    ? null
    : l.completed
      ? t.learn.watch
      : l.watchedSec > 0
        ? t.learn.resume
        : l.type === "pdf"
          ? t.learn.read
          : t.learn.watch;

  return (
    <li
      className={cn(
        "border-b border-line last:border-0",
        current && "bg-bean-50/60",
      )}
    >
      <button
        onClick={onPlay}
        aria-disabled={l.locked}
        className={cn(
          "flex min-h-[4.5rem] w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-surface-2",
          l.locked && "cursor-not-allowed",
        )}
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full text-base font-semibold",
            l.completed
              ? "bg-emerald-100 text-emerald-700"
              : l.locked
                ? "bg-surface-2 text-fg-muted"
                : "bg-bean-100 text-bean-700",
          )}
        >
          {l.completed ? (
            <Check className="size-5" strokeWidth={3} />
          ) : l.locked ? (
            <Lock className="size-4" />
          ) : (
            n
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-base font-medium leading-snug",
              l.locked ? "text-fg-muted" : "text-fg",
            )}
          >
            {l.title}
            {l.isPreview && (
              <span className="ml-2 rounded-full bg-gold-400/30 px-2 py-0.5 text-xs font-semibold text-amber-800">
                {t.learn.free}
              </span>
            )}
          </span>
          <span
            className={cn(
              "mt-0.5 flex items-center gap-1.5 text-sm",
              status.cls,
            )}
          >
            {l.type === "pdf" ? <FileText className="size-3.5" /> : null}
            {status.text}
          </span>
          {!l.completed && l.watchedSec > 0 && (
            <span className="mt-2 block h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full bg-bean-500"
                style={{ width: `${(l.watchedSec / l.durationSec) * 100}%` }}
              />
            </span>
          )}
        </span>
        {action && (
          <span
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold",
              current
                ? "bg-bean-600 text-white"
                : "border border-line-strong text-fg",
            )}
          >
            {l.type === "pdf" ? (
              <FileText className="size-4" />
            ) : (
              <Play className="size-4 fill-current" />
            )}
            {action}
          </span>
        )}
      </button>
    </li>
  );
}

/** "3:30", "0:12": exact, since demo clips are seconds long. Hour-long videos fall back to "1h 5m". */
function clock(sec: number) {
  if (sec >= 3600) return secondsLabel(sec);
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

function CoursePicker({
  courses,
  active,
  onPick,
  hydrated,
}: {
  courses: Course[];
  active?: string;
  onPick: (slug: string) => void;
  hydrated: boolean;
}) {
  const { t } = useT();
  if (courses.length < 2) return null;
  return (
    // phones: a swipeable row that bleeds to the screen edge; tablet+: a grid
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
      {courses.map((c) => {
        const lessons = c.modules
          .flatMap((m) => m.lessons)
          .map((l) => withLocalProgress(l, hydrated));
        const done = lessons.filter((l) => l.completed).length;
        const pct = lessons.length
          ? Math.round((done / lessons.length) * 100)
          : 0;
        const on = c.slug === active;
        return (
          <button
            key={c.slug}
            onClick={() => onPick(c.slug)}
            aria-pressed={on}
            className={cn(
              "flex w-[80%] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border-2 text-left transition-all sm:w-auto",
              on
                ? "border-bean-600 bg-surface text-fg shadow-sm"
                : "border-line bg-surface text-fg hover:border-line-strong",
            )}
          >
            {/* Course photo with the kind label on top of it */}
            <span className="relative block aspect-[16/9] w-full bg-surface-2">
              <Image
                src={c.cover || DEFAULT_COVER}
                alt=""
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 80vw"
                className="object-cover"
              />
              <span className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-surface/95 px-2.5 py-1 text-xs font-semibold text-fg shadow-sm">
                  <BookOpen className="size-3.5 text-bean-600" />{" "}
                  {c.kind === "program" ? t.learn.program : t.learn.shortCourse}
                </span>
                {on && (
                  <span className="grid size-8 place-items-center rounded-full bg-bean-600 text-white shadow-sm">
                    <Check className="size-5" strokeWidth={3} />
                  </span>
                )}
              </span>
            </span>
            <span className="flex flex-1 flex-col p-4">
              <span className="line-clamp-2 text-lg font-semibold leading-snug">
                {c.title}
              </span>
              <span
                className={cn("mt-1 line-clamp-2 text-sm", "text-fg-muted")}
              >
                {c.tagline}
              </span>
              <span className="mt-auto pt-4">
                <span
                  className={cn(
                    "flex justify-between gap-2 text-sm",
                    "text-fg-muted",
                  )}
                >
                  <span>
                    {done} / {t.learn.lessons(lessons.length)}
                  </span>
                </span>
                <span
                  className={cn(
                    "mt-1.5 block h-2 overflow-hidden rounded-full",
                    "bg-surface-2",
                  )}
                >
                  <span
                    className="block h-full rounded-full bg-bean-500"
                    style={{ width: `${pct}%` }}
                  />
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Recordings({
  items,
  highlight,
}: {
  items: ClassSession[];
  highlight: number | null;
}) {
  const { fmtDate } = useFmt();
  const { t } = useT();
  if (!items.length)
    return (
      <p className="rounded-2xl border border-dashed border-line-strong py-12 text-center text-base text-fg-muted">
        {t.learn.recNone}
      </p>
    );
  const open = (s: ClassSession) =>
    s.recordingStatus === "ready"
      ? toast(t.learn.recSoon)
      : toast(t.learn.recProcessingToast);
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((s, i) => {
        const ready = s.recordingStatus === "ready";
        return (
          <motion.li
            key={s.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.5, ease: EASE }}
          >
            <button
              onClick={() => open(s)}
              className={cn(
                "group w-full overflow-hidden rounded-2xl border bg-surface text-left transition-all duration-300",
                highlight === s.id
                  ? "border-bean-400 ring-4 ring-bean-500/10"
                  : "border-line",
              )}
            >
              <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-ink-800 to-ink-950">
                <div className="absolute inset-0 grid place-items-center">
                  {ready ? (
                    <span className="grid size-14 place-items-center rounded-full bg-white text-bean-600 shadow-sm">
                      <Play className="ml-0.5 size-6 fill-current" />
                    </span>
                  ) : s.recordingStatus === "recording" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-bean-600 px-3.5 py-2 text-sm font-semibold text-white">
                      <Radio className="size-4 animate-pulse" />{" "}
                      {t.learn.recLive}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-sm font-medium text-white backdrop-blur">
                      <Loader2 className="size-4 animate-spin" />{" "}
                      {t.learn.recProcessing}
                    </span>
                  )}
                </div>
                {s.recordingDurationSec && (
                  <span className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5 font-mono text-xs text-white">
                    {secondsLabel(s.recordingDurationSec)}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="line-clamp-2 text-base font-semibold leading-snug text-fg">
                  {s.title}
                </div>
                <div className="mt-1 text-sm text-fg-muted">
                  {fmtDate(s.startsAt)} · {s.coach.name}
                </div>
              </div>
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}
