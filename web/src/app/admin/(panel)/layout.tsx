import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSidebar, AdminTopbar } from "@/components/admin/shell";
import { UserChip, UserChipSkeleton } from "@/components/portal/user-chip";
import { getAllDoubts, getLeads } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: { default: "Admin console", template: "%s · Redbean Console" }, robots: { index: false } };

const Count = ({ n }: { n: number }) => (n ? <span className="relative ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[11px] tabular-nums">{n}</span> : null);
async function NewLeadsBadge() {
  return <Count n={(await getLeads()).filter((l) => l.status === "new").length} />;
}
async function OpenDoubtsBadge() {
  return <Count n={(await getAllDoubts()).filter((d) => d.status === "open").length} />;
}

export default function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const chip = (opts: { compact?: boolean; dark?: boolean }) => (
    <Suspense fallback={<UserChipSkeleton {...opts} />}>
      <UserChip {...opts} />
    </Suspense>
  );
  return (
    <div className="rb-themed min-h-dvh bg-bg lg:grid lg:grid-cols-[272px_minmax(0,1fr)]">
      <AdminSidebar user={chip({ dark: true })} badges={{ "/admin/leads": <Suspense><NewLeadsBadge /></Suspense>, "/admin/doubts": <Suspense><OpenDoubtsBadge /></Suspense> }} />
      <div className="min-w-0">
        <AdminTopbar user={chip({})} mobileUser={chip({ dark: true })} />
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
