import type { Metadata } from "next";
import { Suspense } from "react";
import { DoubtsView } from "@/components/portal/doubts-view";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getDoubts, getRequestTime, getSchedule } from "@/lib/api/data";

export const metadata: Metadata = { title: "Doubts" };

export default function DoubtsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="list" />}>
        <Doubts />
      </Suspense>
    </PageTransition>
  );
}

async function Doubts() {
  const [doubts, sessions, now] = await Promise.all([getDoubts(), getSchedule(), getRequestTime()]);
  const recentClasses = sessions
    .filter((s) => s.status !== "cancelled" && +new Date(s.startsAt) <= now)
    .slice(-8)
    .reverse()
    .map((s) => s.title);
  return <DoubtsView initial={doubts} recentClasses={recentClasses} />;
}
