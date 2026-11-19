import type { Metadata } from "next";
import { Suspense } from "react";
import { AssignmentsView } from "@/components/portal/assignments-view";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getAssignments, getRequestTime } from "@/lib/api/data";

export const metadata: Metadata = { title: "Assignments" };

export default function AssignmentsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="list" />}>
        <Assignments />
      </Suspense>
    </PageTransition>
  );
}

async function Assignments() {
  const [items, serverNow] = await Promise.all([getAssignments(), getRequestTime()]);
  return <AssignmentsView initial={items} serverNow={serverNow} />;
}
