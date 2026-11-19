import type { Metadata } from "next";
import { Suspense } from "react";
import { AttendanceView } from "@/components/portal/attendance-view";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime, getSchedule } from "@/lib/api/data";

export const metadata: Metadata = { title: "Attendance" };

export default function AttendancePage() {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="dashboard" />}>
        <Attendance />
      </Suspense>
    </PageTransition>
  );
}

async function Attendance() {
  const [sessions, serverNow] = await Promise.all([getSchedule(), getRequestTime()]);
  return <AttendanceView sessions={sessions} serverNow={serverNow} />;
}
