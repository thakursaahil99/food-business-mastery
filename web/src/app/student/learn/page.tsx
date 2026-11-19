import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { LearnView } from "@/components/portal/learn-view";
import { getCourses, getRequestTime, getSchedule } from "@/lib/api/data";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="learn" />}>
        <Learn />
      </Suspense>
    </PageTransition>
  );
}

async function Learn() {
  const [courses, sessions, now] = await Promise.all([getCourses(), getSchedule(), getRequestTime()]);
  // Zoom cloud recordings of classes that have started (live = still recording).
  const recordings = sessions
    .filter((s) => s.recordingEnabled && s.status !== "cancelled" && +new Date(s.startsAt) <= now)
    .reverse();
  return <LearnView courses={courses} recordings={recordings} />;
}
