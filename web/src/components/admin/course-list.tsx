"use client";

import { motion } from "motion/react";
import { CalendarRange, Layers, Plus, PlayCircle, UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import type { Course } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";
import { PageHeader, fadeUp } from "./ui";

type Phase = "draft" | "upcoming" | "running" | "ended" | "always";

function phaseOf(c: Course, now: number): Phase {
  if (c.status === "draft") return "draft";
  if (!c.startsAt || !c.endsAt) return "always";
  if (now < +new Date(c.startsAt)) return "upcoming";
  if (now > +new Date(c.endsAt)) return "ended";
  return "running";
}

const phaseUi: Record<Phase, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-surface-2 text-fg-muted" },
  upcoming: { label: "Upcoming", cls: "bg-sky-50 text-sky-700" },
  running: { label: "Running", cls: "bg-emerald-50 text-emerald-700" },
  ended: { label: "Ended", cls: "bg-surface-2 text-fg-muted" },
  always: { label: "Published", cls: "bg-emerald-50 text-emerald-700" },
};

/** Course catalogue header + cards. The CGR module uploader renders below it on the same page. */
export function CourseList({ courses, serverNow, highlight }: { courses: Course[]; serverNow: number; highlight?: string | null }) {
  return (
    <>
      <PageHeader
        title="Courses"
        sub={`${courses.length} courses · create a course, set its dates and add lessons`}
        actions={
          <ButtonLink href="/admin/courses/new" size="md">
            <Plus /> Create course
          </ButtonLink>
        }
      />
      <motion.ul variants={fadeUp} className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => {
          const lessons = c.modules.flatMap((m) => m.lessons);
          const open = lessons.filter((l) => !(l.releaseAt ? +new Date(l.releaseAt) > serverNow : l.locked)).length;
          const phase = phaseOf(c, serverNow);
          return (
            <li
              key={c.slug}
              className={cn("flex flex-col rounded-[20px] border bg-surface p-5", highlight === c.slug ? "border-bean-400 ring-4 ring-bean-500/10" : "border-line")}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-fg-muted">{c.kind === "program" ? "Cohort program" : "Course"}</span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", phaseUi[phase].cls)}>{phaseUi[phase].label}</span>
              </div>
              <h3 className="font-display mt-2 text-lg font-semibold leading-snug text-fg">{c.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-fg-muted">{c.tagline}</p>
              <dl className="mt-4 space-y-1.5 text-sm text-fg">
                <div className="flex items-center gap-2">
                  <CalendarRange className="size-4 shrink-0 text-fg-muted" />
                  <dt className="sr-only">Dates</dt>
                  <dd>{c.startsAt && c.endsAt ? `${fmtDate(c.startsAt)} – ${fmtDate(c.endsAt)}` : "Self-paced, no end date"}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="size-4 shrink-0 text-fg-muted" />
                  <dt className="sr-only">Content</dt>
                  <dd>
                    {c.modules.length} {c.modules.length === 1 ? "module" : "modules"} · {lessons.length} lessons
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <PlayCircle className="size-4 shrink-0 text-fg-muted" />
                  <dt className="sr-only">Open now</dt>
                  <dd>
                    {open} of {lessons.length} open to students
                  </dd>
                </div>
                <div className="flex items-center gap-2">
                  <UserRound className="size-4 shrink-0 text-fg-muted" />
                  <dt className="sr-only">Coach</dt>
                  <dd className="truncate">{c.coach.name}</dd>
                </div>
              </dl>
            </li>
          );
        })}
      </motion.ul>
    </>
  );
}
