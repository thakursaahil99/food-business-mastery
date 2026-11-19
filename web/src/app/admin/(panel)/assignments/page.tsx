import type { Metadata } from "next";
import { Suspense } from "react";
import { AssignmentsAdminView } from "@/components/admin/assignments-admin-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime } from "@/lib/api/data";
import { getAdminAssignments } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Assignments" };

export default function AdminAssignmentsPage() {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Assignments />
    </Suspense>
  );
}

async function Assignments() {
  const [items, serverNow] = await Promise.all([getAdminAssignments(), getRequestTime()]);
  return <AssignmentsAdminView initial={items} serverNow={serverNow} />;
}
