import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudentProfileView } from "@/components/admin/student-profile-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime } from "@/lib/api/data";
import { getStudentProfile } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Student profile" };

export default function StudentProfilePage({ params }: PageProps<"/admin/students/[id]">) {
  return (
    <Suspense fallback={<PortalSkeleton variant="dashboard" />}>
      <Profile params={params} />
    </Suspense>
  );
}

async function Profile({ params }: { params: PageProps<"/admin/students/[id]">["params"] }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isInteger(num)) notFound();
  const [profile, serverNow] = await Promise.all([getStudentProfile(num), getRequestTime()]);
  if (!profile) notFound();
  return <StudentProfileView p={profile} serverNow={serverNow} />;
}
