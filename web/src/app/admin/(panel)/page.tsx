import type { Metadata } from "next";
import { Suspense } from "react";
import { OverviewView } from "@/components/admin/overview-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime, requireRole } from "@/lib/api/data";
import { getAdminPayments, getAdminSessions, getBatches, getLeads, getOverview } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Overview" };

export default function AdminHome() {
  return (
    <Suspense fallback={<PortalSkeleton variant="dashboard" />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await requireRole();
  const [overview, sessions, leads, payments, batches, serverNow] = await Promise.all([
    getOverview(),
    getAdminSessions(),
    getLeads(),
    getAdminPayments(),
    getBatches(),
    getRequestTime(),
  ]);
  return <OverviewView adminName={user.name} overview={overview} sessions={sessions} leads={leads} payments={payments} batches={batches} serverNow={serverNow} />;
}
