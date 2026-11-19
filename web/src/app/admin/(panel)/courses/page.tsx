import type { Metadata } from "next";
import { Suspense } from "react";
import { CourseList } from "@/components/admin/course-list";
import { CoursesView } from "@/components/admin/courses-view";
import { Page } from "@/components/admin/ui";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime } from "@/lib/api/data";
import { getAdminCourses, getCourseModules } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesPage({ searchParams }: PageProps<"/admin/courses">) {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Courses searchParams={searchParams} />
    </Suspense>
  );
}

async function Courses({ searchParams }: { searchParams: PageProps<"/admin/courses">["searchParams"] }) {
  const [courses, modules, serverNow, sp] = await Promise.all([getAdminCourses(), getCourseModules(), getRequestTime(), searchParams]);
  const created = typeof sp.created === "string" ? sp.created : null;
  return (
    <div className="space-y-10">
      <Page>
        <CourseList courses={courses} serverNow={serverNow} highlight={created} />
      </Page>
      <CoursesView initial={modules} embedded />
    </div>
  );
}
