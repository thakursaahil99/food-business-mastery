import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { ClassLobby } from "@/components/portal/class-lobby";
import { getSessionById, requireUser } from "@/lib/api/data";

export const metadata: Metadata = { title: "Live class" };

export default function ClassPage({ params }: PageProps<"/student/class/[id]">) {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="list" />}>
        <Lobby params={params} />
      </Suspense>
    </PageTransition>
  );
}

async function Lobby({ params }: { params: PageProps<"/student/class/[id]">["params"] }) {
  const { id } = await params;
  const num = Number(id);
  if (!Number.isInteger(num)) notFound();
  const [user, session] = await Promise.all([requireUser(), getSessionById(num)]);
  if (!session) notFound();
  return <ClassLobby session={session} userName={user.name} />;
}
