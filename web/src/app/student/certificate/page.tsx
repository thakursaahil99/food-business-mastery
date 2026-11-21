import type { Metadata } from "next";
import { Suspense } from "react";
import { CertificatesView } from "@/components/portal/certificates-view";
import { PageTransition } from "@/components/portal/shell";
import { PortalSkeleton } from "@/components/portal/skeletons";
import { getCertificates, requireUser } from "@/lib/api/data";

export const metadata: Metadata = { title: "My certificates" };

export default function CertificatePage() {
  return (
    <PageTransition>
      <Suspense fallback={<PortalSkeleton variant="list" />}>
        <Certificates />
      </Suspense>
    </PageTransition>
  );
}

async function Certificates() {
  const [user, entries] = await Promise.all([requireUser(), getCertificates()]);
  return <CertificatesView entries={entries} studentName={user.name} />;
}
