import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { ProfileView } from "@/components/portal/profile-view";
import { getAssignments, getEnrollment, getModules, getReminderPrefs, requireUser } from "@/lib/api/data";
import { getTextSize } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "My profile" };

export default function ProfilePage() {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="list" />}>
        <Profile />
      </Suspense>
    </PageTransition>
  );
}

async function Profile() {
  const [user, enrollment, modules, assignments, prefs, textSize] = await Promise.all([requireUser(), getEnrollment(), getModules(), getAssignments(), getReminderPrefs(), getTextSize()]);
  const lessons = modules.flatMap((m) => m.lessons);
  return (
    <ProfileView
      user={user}
      batchName={enrollment.batch.name}
      since={enrollment.enrolledAt}
      textSize={textSize}
      prefs={prefs}
      cert={{
        attendancePct: enrollment.attendancePct,
        lessonsDone: lessons.filter((l) => l.completed).length,
        lessonsTotal: lessons.length,
        homeworkSent: assignments.filter((a) => a.submission).length,
        homeworkTotal: assignments.length,
      }}
    />
  );
}
