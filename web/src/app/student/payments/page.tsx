import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { PaymentsView } from "@/components/portal/payments-view";
import { getBillingProfile, getEnrollment, getPayments } from "@/lib/api/data";

export const metadata: Metadata = { title: "Payments" };

export default function PaymentsPage() {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="list" />}>
        <Payments />
      </Suspense>
    </PageTransition>
  );
}

async function Payments() {
  const [summary, enrollment, billing] = await Promise.all([getPayments(), getEnrollment(), getBillingProfile()]);
  return <PaymentsView summary={summary} programTitle={enrollment.program.title} billing={billing} />;
}
