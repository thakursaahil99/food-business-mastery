import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPaymentsView } from "@/components/admin/payments-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getAdminPayments } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Payments" };

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Payments />
    </Suspense>
  );
}

async function Payments() {
  return <AdminPaymentsView payments={await getAdminPayments()} />;
}
