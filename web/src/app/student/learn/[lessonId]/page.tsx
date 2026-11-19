import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { LessonPlayer } from "@/components/portal/lesson-player";
import { getLesson } from "@/lib/api/data";
import { getLessonQuestions } from "@/lib/api/data-learning";

export const metadata: Metadata = { title: "Lesson" };

export default function LessonPage({ params }: PageProps<"/student/learn/[lessonId]">) {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="list" />}>
        <Player params={params} />
      </Suspense>
    </PageTransition>
  );
}

async function Player({ params }: { params: PageProps<"/student/learn/[lessonId]">["params"] }) {
  const { lessonId } = await params;
  const id = Number(lessonId);
  if (!Number.isInteger(id)) notFound();
  // getLesson resolves through getModules(), so lessons uploaded from the admin panel play here too.
  const found = await getLesson(id);
  if (!found) notFound();
  const { course, lesson } = found;
  const flat = course.modules.flatMap((m) => m.lessons);
  const i = flat.findIndex((l) => l.id === id);
  const questions = lesson.locked ? [] : await getLessonQuestions({ id: lesson.id, title: lesson.title });
  return <LessonPlayer course={course} lesson={lesson} prev={flat[i - 1] ?? null} next={flat[i + 1] ?? null} questions={questions} />;
}
