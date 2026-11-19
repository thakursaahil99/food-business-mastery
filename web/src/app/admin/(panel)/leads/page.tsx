import type { Metadata } from "next";
import { Suspense } from "react";
import { LeadsView } from "@/components/admin/leads-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getLeads } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Leads />
    </Suspense>
  );
}

async function Leads() {
  return <LeadsView initial={await getLeads()} />;
}
