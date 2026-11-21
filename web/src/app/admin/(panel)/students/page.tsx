import type { Metadata } from "next";
import { Suspense } from "react";
import { StudentsView } from "@/components/admin/students-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime } from "@/lib/api/data";
import { getBatches, getStudents } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Students" };

export default function StudentsPage() {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Students />
    </Suspense>
  );
}

async function Students() {
  const [students, batches, serverNow] = await Promise.all([getStudents(), getBatches(), getRequestTime()]);
  return <StudentsView students={students} batchOptions={batches.map((b) => ({ name: b.name, price: b.price }))} serverNow={serverNow} />;
}
