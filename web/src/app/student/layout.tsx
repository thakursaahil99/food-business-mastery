import type { Metadata } from "next";
import { Suspense } from "react";
import { LangProvider } from "@/components/i18n";
import { HelpButton, MobileTabBar, Sidebar, Topbar } from "@/components/portal/shell";
import { AdminSwitch, UserChip, UserChipSkeleton } from "@/components/portal/user-chip";
import { getLang, getTextSize } from "@/lib/i18n/server";
import { textSizeClass } from "@/lib/i18n/dict";
import { cn } from "@/lib/utils";
import { AccentPicker } from "@/components/theme/accent-picker";

export const metadata: Metadata = { title: { default: "Student portal", template: "%s · Redbean Academy" }, robots: { index: false } };

/**
 * Easy-to-use portal for all students (many are older / non-technical):
 * larger base text (.portal-easy), big tap targets, simple words, English / हिंदी.
 * The language cookie is read on the server so the first paint is already in the right language.
 */
export default function StudentLayout({ children }: LayoutProps<"/student">) {
  return (
    <Suspense fallback={<div className="portal-easy min-h-dvh bg-bg" aria-busy />}>
      <StudentShell>{children}</StudentShell>
    </Suspense>
  );
}

async function StudentShell({ children }: { children: React.ReactNode }) {
  const [lang, size] = await Promise.all([getLang(), getTextSize()]);
  const chip = (compact = false, dark = false) => (
    <Suspense fallback={<UserChipSkeleton compact={compact} dark={dark} />}>
      <UserChip compact={compact} dark={dark} href="/student/profile" />
    </Suspense>
  );
  return (
    <LangProvider lang={lang}>
      <div lang={lang === "hi" ? "hi" : "en-IN"} className={cn("portal-easy rb-themed min-h-dvh bg-bg lg:grid lg:grid-cols-[280px_minmax(0,1fr)]", textSizeClass[size])}>
        <Sidebar user={chip(false, true)} extra={<Suspense><AdminSwitch /></Suspense>} />
        <div className="min-w-0">
          <Topbar
            user={chip(true)}
            userWide={chip()}
            extra={
              <>
                <AccentPicker lang={lang} size="lg" />
                <Suspense>
                  <AdminSwitch compact />
                </Suspense>
              </>
            }
          />
          <main className="mx-auto max-w-6xl px-4 pb-40 pt-6 sm:px-8 lg:pb-16 lg:pt-10">{children}</main>
        </div>
        <MobileTabBar />
        <HelpButton />
      </div>
    </LangProvider>
  );
}
