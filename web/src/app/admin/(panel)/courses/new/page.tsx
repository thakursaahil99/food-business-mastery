import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseBuilder } from "@/components/admin/course-builder";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime } from "@/lib/api/data";
import { getCoaches } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Create course" };

export default function NewCoursePage() {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Builder />
    </Suspense>
  );
}

async function Builder() {
  const [coaches, serverNow] = await Promise.all([getCoaches(), getRequestTime()]);
  return <CourseBuilder coaches={coaches} serverNow={serverNow} />;
}
