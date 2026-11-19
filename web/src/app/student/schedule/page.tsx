import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { ScheduleView } from "@/components/portal/schedule-view";
import { getRequestTime, getSchedule } from "@/lib/api/data";

export const metadata: Metadata = { title: "Schedule" };

export default function SchedulePage() {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="list" />}>
        <Schedule />
      </Suspense>
    </PageTransition>
  );
}

async function Schedule() {
  const [sessions, serverNow] = await Promise.all([getSchedule(), getRequestTime()]);
  return <ScheduleView sessions={sessions} serverNow={serverNow} />;
}
