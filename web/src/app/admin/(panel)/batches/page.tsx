import type { Metadata } from "next";
import { Suspense } from "react";
import { BatchesView } from "@/components/admin/batches-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getBatches } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Programs & batches" };

export default function BatchesPage() {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Batches />
    </Suspense>
  );
}

async function Batches() {
  return <BatchesView batches={await getBatches()} />;
}
