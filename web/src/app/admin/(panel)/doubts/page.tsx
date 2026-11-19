import type { Metadata } from "next";
import { Suspense } from "react";
import { DoubtsAdminView } from "@/components/admin/doubts-admin-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getAllDoubts } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Doubts" };

export default function AdminDoubtsPage() {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Doubts />
    </Suspense>
  );
}

async function Doubts() {
  return <DoubtsAdminView initial={await getAllDoubts()} />;
}
