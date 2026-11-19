import type { Metadata } from "next";
import { Suspense } from "react";
import { AnalyticsView } from "@/components/admin/analytics-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { requireRole } from "@/lib/api/data";
import { getBusinessAnalytics, getLearningAnalytics } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  return (
    <Suspense fallback={<PortalSkeleton variant="dashboard" />}>
      <Analytics searchParams={searchParams} />
    </Suspense>
  );
}

async function Analytics({ searchParams }: { searchParams: PageProps<"/admin/analytics">["searchParams"] }) {
  const [sp, user] = await Promise.all([searchParams, requireRole()]);
  // Money numbers are for admins only; coaches see learning analytics.
  const canSeeMoney = user.role === "super_admin" || user.role === "admin";
  const [business, learning] = await Promise.all([canSeeMoney ? getBusinessAnalytics() : Promise.resolve(null), getLearningAnalytics()]);
  return <AnalyticsView tab={sp.tab === "learning" ? "learning" : "business"} business={business} learning={learning} />;
}
