import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CourseBuilder } from "@/components/admin/course-builder";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime } from "@/lib/api/data";
import { getAdminCourse, getCoaches } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Edit course" };

export default function EditCoursePage({ params }: PageProps<"/admin/courses/[slug]/edit">) {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Editor params={params} />
    </Suspense>
  );
}

async function Editor({ params }: { params: PageProps<"/admin/courses/[slug]/edit">["params"] }) {
  const { slug } = await params;
  const [found, coaches, serverNow] = await Promise.all([getAdminCourse(slug), getCoaches(), getRequestTime()]);
  if (!found) notFound();
  return <CourseBuilder key={slug} coaches={coaches} serverNow={serverNow} initial={found.course} detailsOnly={!found.fullEdit} />;
}
