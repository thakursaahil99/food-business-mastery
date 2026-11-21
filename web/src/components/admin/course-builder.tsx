"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowLeft, CalendarDays, Check, Paperclip, Plus, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createCourse } from "@/lib/actions/admin";
import { updateCourse } from "@/lib/actions/admin-crud";
import { COVER_LIBRARY } from "@/lib/course-covers";
import type { Coach, Course, CourseDraft } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Page, PageHeader } from "./ui";

/* Dates are edited as IST calendar days (yyyy-mm-dd) and sent as UTC ISO strings. */
const IST_MS = 330 * 60_000;
const istToday = (now: number) => new Date(now + IST_MS).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const daysBetween = (a: string, b: string) => Math.round((+new Date(`${b}T00:00:00Z`) - +new Date(`${a}T00:00:00Z`)) / 86_400_000);
const startIso = (d: string) => new Date(`${d}T00:00:00+05:30`).toISOString();
const endIso = (d: string) => new Date(`${d}T23:59:00+05:30`).toISOString();
const pretty = (d: string) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—");

type LessonDraft = { key: string; id?: number; title: string; date: string; fileName: string | null; isPreview: boolean };
type ModuleDraft = { key: string; id?: number; title: string; lessons: LessonDraft[] };
const istDay = (iso: string) => new Date(+new Date(iso) + IST_MS).toISOString().slice(0, 10);

let seq = 0;
const key = () => `k${++seq}`;

const field = "mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-fg outline-none transition focus:border-ink-900";
const label = "block text-sm font-medium text-fg";
const LEVELS: Course["level"][] = ["Beginner", "Intermediate", "Advanced"];

/**
 * Create a course, or edit one (`initial`). Courses made here can change everything.
 * Built-in courses (`detailsOnly`) edit their name, summary, level, coach, photo and publish state only,
 * so students keep progress on the existing lessons.
 */
export function CourseBuilder({ coaches, serverNow, initial, detailsOnly = false }: { coaches: Coach[]; serverNow: number; initial?: Course; detailsOnly?: boolean }) {
  const router = useRouter();
  const today = istToday(serverNow);
  const firstStart = addDays(today, 1);
  const startInit = initial?.startsAt ? istDay(initial.startsAt) : firstStart;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [level, setLevel] = useState<Course["level"]>(initial?.level ?? "Beginner");
  const [coachId, setCoachId] = useState(initial?.coach.id ?? coaches[0]?.id ?? 0);
  const [cover, setCover] = useState<string | null>(initial?.cover ?? COVER_LIBRARY[1].src);
  const [start, setStart] = useState(startInit);
  const [end, setEnd] = useState(initial?.endsAt ? istDay(initial.endsAt) : addDays(firstStart, 4 * 7 - 1));
  const [gap, setGap] = useState(7);
  const [modules, setModules] = useState<ModuleDraft[]>(() =>
    initial && !detailsOnly
      ? initial.modules.map((m) => ({
          key: key(),
          id: m.id,
          title: m.title,
          lessons: m.lessons.map((l) => ({ key: key(), id: l.id, title: l.title, date: l.releaseAt ? istDay(l.releaseAt) : startInit, fileName: l.videoSrc ? "Uploaded video" : null, isPreview: l.isPreview })),
        }))
      : [{ key: key(), title: "Module 1", lessons: [{ key: key(), title: "", date: firstStart, fileName: null, isPreview: true }] }],
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const allLessons = modules.flatMap((m) => m.lessons);
  const lastDate = allLessons.reduce((d, l) => (l.date > d ? l.date : d), start);
  const weeks = start && end && end >= start ? Math.round((daysBetween(start, end) + 1) / 7) : 0;

  /* ── editing helpers ── */
  const patchModule = (mk: string, p: Partial<ModuleDraft>) => setModules((ms) => ms.map((m) => (m.key === mk ? { ...m, ...p } : m)));
  const patchLesson = (mk: string, lk: string, p: Partial<LessonDraft>) =>
    setModules((ms) => ms.map((m) => (m.key === mk ? { ...m, lessons: m.lessons.map((l) => (l.key === lk ? { ...l, ...p } : l)) } : m)));
  const addLesson = (mk: string) => {
    const nextDate = allLessons.length ? addDays(lastDate, gap) : start;
    const date = end && nextDate > end ? end : nextDate;
    setModules((ms) => ms.map((m) => (m.key === mk ? { ...m, lessons: [...m.lessons, { key: key(), title: "", date, fileName: null, isPreview: false }] } : m)));
  };
  const removeLesson = (mk: string, lk: string) => setModules((ms) => ms.map((m) => (m.key === mk ? { ...m, lessons: m.lessons.filter((l) => l.key !== lk) } : m)));
  const addModule = () => {
    const nextDate = addDays(lastDate, gap);
    const date = end && nextDate > end ? end : nextDate;
    setModules((ms) => [...ms, { key: key(), title: `Module ${ms.length + 1}`, lessons: [{ key: key(), title: "", date, fileName: null, isPreview: false }] }]);
  };
  const removeModule = (mk: string) => setModules((ms) => ms.filter((m) => m.key !== mk));

  /** Spread every lesson from the start date, one every `gap` days (kept inside the end date). */
  const autoDates = () => {
    setModules((ms) => {
      // counter lives inside the updater: React may run updaters twice (StrictMode), which would double-count
      let i = 0;
      return ms.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => {
          const d = addDays(start, gap * i++);
          return { ...l, date: end && d > end ? end : d };
        }),
      }));
    });
    toast.success("Dates filled in", { description: `One lesson every ${gap} ${gap === 1 ? "day" : "days"} from ${pretty(start)}.` });
  };

  const setLength = (w: number) => setEnd(addDays(start, w * 7 - 1));

  /* ── validation (the server checks the same rules again) ── */
  const validate = () => {
    const e: string[] = [];
    if (title.trim().length < 3) e.push("Give the course a name.");
    if (tagline.trim().length < 10) e.push("Write a one-line summary (at least 10 letters).");
    if (!coachId) e.push("Choose a coach.");
    if (detailsOnly) return e;
    if (!start || !end) e.push("Pick a start date and an end date.");
    else if (end <= start) e.push("The end date must be after the start date.");
    if (!modules.length) e.push("Add at least one module.");
    modules.forEach((m, mi) => {
      if (m.title.trim().length < 2) e.push(`Module ${mi + 1} needs a name.`);
      if (!m.lessons.length) e.push(`“${m.title || `Module ${mi + 1}`}” needs at least one lesson.`);
      m.lessons.forEach((l, li) => {
        const where = `Module ${mi + 1}, lesson ${li + 1}`;
        if (l.title.trim().length < 3) e.push(`${where}: add a title.`);
        if (!l.date) e.push(`${where}: pick the date it opens.`);
        else if (start && end && (l.date < start || l.date > end)) e.push(`${where}: the date must be between ${pretty(start)} and ${pretty(end)}.`);
      });
    });
    return e;
  };

  const save = (publish: boolean) => {
    const e = validate();
    setErrors(e);
    if (e.length) {
      toast.error("Please fix the highlighted items", { description: e[0] });
      document.getElementById("course-errors")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const draft: CourseDraft = {
      title: title.trim(),
      tagline: tagline.trim(),
      description: description.trim(),
      level,
      coachId,
      startsAt: startIso(start),
      endsAt: endIso(end),
      publish,
      cover,
      modules: modules.map((m) => ({
        id: m.id,
        title: m.title.trim(),
        lessons: m.lessons.map((l) => ({ id: l.id, title: l.title.trim(), releaseAt: startIso(l.date), fileName: l.fileName, isPreview: l.isPreview })),
      })),
    };
    startTransition(async () => {
      const res = initial ? await updateCourse(initial.slug, draft) : await createCourse(draft);
      if (!res.ok) {
        setErrors([res.error]);
        return void toast.error(res.error);
      }
      toast.success(initial ? (publish ? "Changes published" : "Saved as draft") : publish ? "Course published" : "Saved as draft", {
        description: publish ? "Students see it in My course. Each lesson opens on its date." : "Only admins can see it until you publish.",
      });
      router.push(`/admin/courses?created=${res.data.slug}`);
    });
  };

  return (
    <Page>
      <Link href="/admin/courses" className="inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> All courses
      </Link>
      <PageHeader
        title={initial ? `Edit “${initial.title}”` : "Create a course"}
        sub={detailsOnly ? "This is a built-in course: you can change its details and photo. Its lessons stay as they are so students keep their progress." : initial ? "Change anything below, then publish or save as draft." : "Fill in the details, set the dates, then add modules and lessons."}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {/* 1. Details */}
          <Section step={1} title="Course details">
            <div className="space-y-4">
              <label className={label}>
                Course name
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Hospital Kitchen Basics" maxLength={120} className={field} />
              </label>
              <label className={label}>
                One-line summary <span className="font-normal text-fg-muted">(shown on the course card)</span>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="What will students be able to do after this course?" maxLength={200} className={field} />
              </label>
              <label className={label}>
                Description <span className="font-normal text-fg-muted">(optional)</span>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={4000} className={cn(field, "h-auto resize-y py-3")} />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className={label}>Level</span>
                  <div role="radiogroup" aria-label="Level" className="mt-1.5 grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface-2 p-1">
                    {LEVELS.map((lv) => (
                      <button
                        key={lv}
                        type="button"
                        role="radio"
                        aria-checked={level === lv}
                        onClick={() => setLevel(lv)}
                        className={cn("min-h-9 rounded-lg px-1 text-[13px] font-medium transition-colors", level === lv ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg")}
                      >
                        {lv}
                      </button>
                    ))}
                  </div>
                </div>
                <label className={label}>
                  Coach
                  <select value={coachId} onChange={(e) => setCoachId(Number(e.target.value))} className={field}>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.title ? ` · ${c.title}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <CoverPicker value={cover} onChange={setCover} />
            </div>
          </Section>

          {!detailsOnly && (
          <>
          {/* 2. Dates */}
          <Section step={2} title="Course dates" sub="Students can watch lessons between these dates. Each lesson also has its own opening date.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={label}>
                Start date
                <input type="date" value={start} min={today} onChange={(e) => setStart(e.target.value)} className={field} />
              </label>
              <label className={label}>
                End date
                <input type="date" value={end} min={start || today} onChange={(e) => setEnd(e.target.value)} className={field} />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-fg-muted">Length:</span>
              {[4, 8, 12, 16].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setLength(w)}
                  className={cn("min-h-9 rounded-full border px-3.5 font-medium transition-colors", weeks === w ? "border-ink-900 bg-ink-900 text-white" : "border-line text-fg hover:bg-surface-2")}
                >
                  {w} weeks
                </button>
              ))}
            </div>
            {start && end && end > start && (
              <p className="mt-3 text-sm text-fg-muted">
                Runs {pretty(start)} → {pretty(end)} ({daysBetween(start, end) + 1} days)
              </p>
            )}
          </Section>

          {/* 3. Lessons */}
          <Section step={3} title="Modules and lessons" sub="Group lessons into modules. A lesson stays locked for students until its date.">
            <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-dashed border-line-strong bg-surface-2/50 p-4 sm:flex-row sm:items-center">
              <Wand2 className="hidden size-5 shrink-0 text-bean-600 sm:block" />
              <p className="flex-1 text-sm text-fg">
                Fill all dates automatically: one lesson every{" "}
                <select value={gap} onChange={(e) => setGap(Number(e.target.value))} aria-label="Days between lessons" className="mx-1 h-9 rounded-lg border border-line bg-surface px-2 text-sm">
                  {[1, 2, 3, 7, 14].map((g) => (
                    <option key={g} value={g}>
                      {g === 7 ? "week" : g === 14 ? "2 weeks" : `${g} ${g === 1 ? "day" : "days"}`}
                    </option>
                  ))}
                </select>{" "}
                from the start date.
              </p>
              <Button type="button" variant="outline" size="sm" onClick={autoDates}>
                Fill dates
              </Button>
            </div>

            <div className="space-y-4">
              {modules.map((m, mi) => (
                <div key={m.key} className="rounded-2xl border border-line">
                  <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 p-3 sm:p-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ink-900 text-sm font-semibold text-white">{mi + 1}</span>
                    <input value={m.title} onChange={(e) => patchModule(m.key, { title: e.target.value })} aria-label={`Module ${mi + 1} name`} placeholder="Module name" className="h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-[15px] font-semibold text-fg outline-none hover:border-line focus:border-ink-900 focus:bg-surface" />
                    {modules.length > 1 && (
                      <button type="button" onClick={() => removeModule(m.key)} className="inline-flex min-h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-sm text-fg-muted hover:bg-surface hover:text-bean-600">
                        <Trash2 className="size-4" /> <span className="hidden sm:inline">Remove module</span>
                      </button>
                    )}
                  </div>
                  <ol className="divide-y divide-line">
                    {m.lessons.map((l, li) => (
                      <LessonEditor
                        key={l.key}
                        n={li + 1}
                        lesson={l}
                        min={start}
                        max={end}
                        canRemove={m.lessons.length > 1}
                        onChange={(p) => patchLesson(m.key, l.key, p)}
                        onRemove={() => removeLesson(m.key, l.key)}
                      />
                    ))}
                  </ol>
                  <button type="button" onClick={() => addLesson(m.key)} className="flex min-h-12 w-full items-center justify-center gap-2 border-t border-dashed border-line-strong text-sm font-medium text-bean-600 hover:bg-bean-50/50">
                    <Plus className="size-4" /> Add a lesson to this module
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" className="mt-4 w-full sm:w-auto" onClick={addModule}>
              <Plus /> Add module
            </Button>
          </Section>
          </>
          )}
        </div>

        {/* Summary + save */}
        <aside className="min-w-0 xl:sticky xl:top-24 xl:h-fit">
          <div className="rounded-[20px] border border-line bg-surface p-5">
            {cover && (
              <div className="relative -mx-5 -mt-5 mb-4 aspect-[16/9] overflow-hidden rounded-t-[20px]">
                <Image src={cover} alt="" fill sizes="340px" className="object-cover" />
              </div>
            )}
            <h2 className="font-display text-lg font-semibold text-fg">Summary</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row k="Name" v={title.trim() || "—"} />
              {detailsOnly && initial ? (
                <>
                  <Row k="Modules" v={String(initial.modules.length)} />
                  <Row k="Lessons" v={String(initial.modules.flatMap((m) => m.lessons).length)} />
                  <Row k="Dates & videos" v="Unchanged" />
                </>
              ) : (
                <>
                  <Row k="Dates" v={start && end ? `${pretty(start)} – ${pretty(end)}` : "—"} />
                  <Row k="Modules" v={String(modules.length)} />
                  <Row k="Lessons" v={String(allLessons.length)} />
                  <Row k="Videos attached" v={`${allLessons.filter((l) => l.fileName).length} of ${allLessons.length}`} />
                  <Row k="First lesson opens" v={allLessons.length ? pretty(allLessons.reduce((d, l) => (l.date && l.date < d ? l.date : d), allLessons[0]!.date)) : "—"} />
                </>
              )}
            </dl>

            {errors.length > 0 && (
              <div id="course-errors" role="alert" className="mt-4 rounded-xl border border-bean-200 bg-bean-50 p-3 text-sm text-bean-800">
                <div className="font-semibold">Please fix:</div>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {errors.slice(0, 6).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                  {errors.length > 6 && <li>…and {errors.length - 6} more</li>}
                </ul>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-2">
              <Button type="button" size="lg" disabled={pending} onClick={() => save(true)}>
                {pending ? "Saving…" : initial ? "Save and publish" : "Publish course"}
              </Button>
              <Button type="button" variant="outline" size="lg" disabled={pending} onClick={() => save(false)}>
                Save as draft
              </Button>
            </div>
            <p className="mt-3 text-xs text-fg-muted">Published courses appear in every student’s “My course” page. Lessons open on their dates.</p>
          </div>
        </aside>
      </div>
    </Page>
  );
}

function Section({ step, title, sub, children }: { step: number; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-bean-600">Step {step}</div>
        <h2 className="font-display mt-0.5 text-xl font-semibold text-fg">{title}</h2>
        {sub && <p className="mt-1 text-sm text-fg-muted">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-fg-muted">{k}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-fg">{v}</dd>
    </div>
  );
}

function LessonEditor({
  n,
  lesson,
  min,
  max,
  canRemove,
  onChange,
  onRemove,
}: {
  n: number;
  lesson: LessonDraft;
  min: string;
  max: string;
  canRemove: boolean;
  onChange: (p: Partial<LessonDraft>) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const outOfRange = !!lesson.date && !!min && !!max && (lesson.date < min || lesson.date > max);
  return (
    <li className="p-3 sm:p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
        <label className="block text-sm text-fg-muted" htmlFor={`${id}-t`}>
          Lesson {n} title
          <input id={`${id}-t`} value={lesson.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="e.g. Setting up the cold room" maxLength={160} className={field} />
        </label>
        <label className="block text-sm text-fg-muted" htmlFor={`${id}-d`}>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" /> Opens on
          </span>
          <input id={`${id}-d`} type="date" value={lesson.date} min={min} max={max} onChange={(e) => onChange({ date: e.target.value })} className={cn(field, outOfRange && "border-bean-500")} />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={file}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onChange({ fileName: f.name, title: lesson.title || f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ") });
            e.target.value = "";
          }}
        />
        <button type="button" onClick={() => file.current?.click()} className={cn("inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border px-3 text-sm font-medium", lesson.fileName ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-line text-fg hover:bg-surface-2")}>
          <Paperclip className="size-4 shrink-0" />
          <span className="truncate">{lesson.fileName ?? "Attach video"}</span>
        </button>
        {lesson.fileName && (
          <button type="button" onClick={() => onChange({ fileName: null })} className="min-h-9 rounded-full px-2 text-sm text-fg-muted hover:text-fg">
            Remove video
          </button>
        )}
        <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-full px-2 text-sm text-fg">
          <input type="checkbox" checked={lesson.isPreview} onChange={(e) => onChange({ isPreview: e.target.checked })} className="size-4 accent-bean-600" />
          Free preview
        </label>
        {canRemove && (
          <button type="button" onClick={onRemove} className="ml-auto inline-flex min-h-9 items-center gap-1 rounded-full px-2 text-sm text-fg-muted hover:text-bean-600">
            <Trash2 className="size-4" /> Remove
          </button>
        )}
      </div>
      {outOfRange && <p className="mt-2 text-sm text-bean-600">This date is outside the course dates.</p>}
    </li>
  );
}

/** Pick the course photo from Red Bean Hospitality's own photo library. */
function CoverPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div>
      <span className={label}>
        Course photo <span className="font-normal text-fg-muted">(shown on the course card for students)</span>
      </span>
      <div role="radiogroup" aria-label="Course photo" className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {COVER_LIBRARY.map((c) => {
          const on = value === c.src;
          return (
            <button
              key={c.src}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(c.src)}
              className={cn("group relative overflow-hidden rounded-xl text-left ring-offset-2 ring-offset-surface transition", on ? "ring-2 ring-bean-600" : "ring-1 ring-line hover:ring-line-strong")}
            >
              <span className="relative block aspect-[4/3]">
                <Image src={c.src} alt="" fill sizes="(min-width: 640px) 160px, 45vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
              </span>
              <span className="block truncate bg-surface px-2 py-1.5 text-xs font-medium text-fg">{c.label}</span>
              {on && (
                <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-bean-600 text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
