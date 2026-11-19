import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionsView } from "@/components/admin/sessions-view";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getRequestTime } from "@/lib/api/data";
import { getAdminSessions, getBatches } from "@/lib/api/data-admin";

export const metadata: Metadata = { title: "Schedule" };

export default function SessionsPage({ searchParams }: PageProps<"/admin/sessions">) {
  return (
    <Suspense fallback={<PortalSkeleton variant="list" />}>
      <Sessions searchParams={searchParams} />
    </Suspense>
  );
}

async function Sessions({ searchParams }: { searchParams: PageProps<"/admin/sessions">["searchParams"] }) {
  const [sp, sessions, batches, serverNow] = await Promise.all([searchParams, getAdminSessions(), getBatches(), getRequestTime()]);
  return <SessionsView initial={sessions} batches={batches} serverNow={serverNow} openNew={sp.new === "1"} />;
}
