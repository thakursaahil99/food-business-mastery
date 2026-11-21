import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPaymentsView } from "@/components/admin/payments-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getAdminPayments, getStudents } from "@/lib/api/data-admin";
import { getCurrentUser } from "@/lib/api/data";

export const metadata: Metadata = { title: "Payments" };

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Payments />
    </Suspense>
  );
}

async function Payments() {
  const [payments, students, user] = await Promise.all([getAdminPayments(), getStudents(), getCurrentUser()]);
  return <AdminPaymentsView payments={payments} students={students.map((s) => ({ name: s.name, batchName: s.batchName }))} canDelete={user?.role === "super_admin"} />;
}
