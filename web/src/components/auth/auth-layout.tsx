import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { BrandPanel } from "./brand-panel";
import { FadedBeans } from "./faded-beans";
import Image from "next/image";
import { BRAND } from "@/components/ui/logo";
import { AUTH_PHOTO, FLAGSHIP_COURSE, SECTOR_PHOTOS } from "./course";

/** Overbooked-style split layout: brand panel left (45%), form right. */
export function AuthLayout({ children, variant = "student" }: { children: ReactNode; variant?: "student" | "admin" }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[45%_55%]">
      <BrandPanel variant={variant} />
      <div className="relative isolate flex min-h-dvh flex-col overflow-hidden px-6 py-8 sm:px-12">
        <FadedBeans className="-z-10" />
        {/* Phones/tablets don't get the brand panel, so show the workshop photo + flagship course as a banner instead. */}
        <div className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-3xl bg-ink-950 text-white lg:hidden">
          <Image src={AUTH_PHOTO.src} alt={AUTH_PHOTO.alt} fill sizes="100vw" className="object-cover object-[50%_40%]" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-ink-950/85 via-bean-950/70 to-bean-700/60" />
          <div className="relative flex items-end justify-between gap-4 p-5 pt-6">
            <div className="min-w-0">
              <Link href="/" aria-label="Redbean Academy home" className="inline-block">
                <Image src={BRAND.logoWhite.src} width={BRAND.logoWhite.width} height={BRAND.logoWhite.height} alt="Red Bean Hospitality" className="h-12 w-auto" />
              </Link>
              {variant === "student" && (
                <Link href={FLAGSHIP_COURSE.href} className="mt-4 block">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-bean-300">{FLAGSHIP_COURSE.eyebrow}</span>
                  <span className="font-display mt-0.5 block text-lg font-semibold leading-tight">{FLAGSHIP_COURSE.title}</span>
                  <span className="mt-0.5 block text-xs text-white/70">{FLAGSHIP_COURSE.meta.join(" · ")}</span>
                </Link>
              )}
            </div>
            {variant === "student" && (
              <span className="hidden shrink-0 -space-x-3 min-[400px]:flex" aria-hidden>
                {SECTOR_PHOTOS.slice(0, 3).map((p) => (
                  <span key={p.src} className="relative size-12 overflow-hidden rounded-full ring-2 ring-white">
                    <Image src={p.src} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center py-12">
          <Suspense fallback={<div className="h-[460px] w-full max-w-[420px] animate-pulse rounded-3xl bg-cream-100" />}>{children}</Suspense>
        </div>
        <p className="text-center text-xs text-ink-300">By continuing you agree to the Redbean Academy terms and privacy policy.</p>
      </div>
    </div>
  );
}
