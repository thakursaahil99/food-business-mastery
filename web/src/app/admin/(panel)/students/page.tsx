import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentsView } from "@/components/admin/students-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime } from "@/lib/api/data";
import { getStudents } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Students" };

export default function StudentsPage() {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Students />
    </Suspense>
  );
}

async function Students() {
  const [students, serverNow] = await Promise.all([getStudents(), getRequestTime()]);
  return <StudentsView students={students} serverNow={serverNow} />;
}
