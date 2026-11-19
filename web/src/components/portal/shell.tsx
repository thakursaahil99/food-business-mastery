"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useCallback, useEffect, useState, useSyncExternalStore, ViewTransition, type ReactNode } from "react";
import { CalendarCheck, CalendarDays, ClipboardList, GraduationCap, Headset, Home, LogOut, MessageCircle, MessageCircleQuestion, MoreHorizontal, Phone, PlayCircle, Wallet, UserRound } from "lucide-react";
import { LangToggle, useT } from "@/components/i18n";
import type { Dict } from "@/lib/i18n/dict";
import { brand } from "@/content/site";
import { Logo } from "@/components/ui/logo";
import { logout } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

/** Order = how often students need it. Labels come from the dictionary (simple words, EN/HI). */
export const portalNav = [
  { href: "/student", key: "home", icon: Home },
  { href: "/student/learn", key: "learn", icon: PlayCircle },
  { href: "/student/schedule", key: "schedule", icon: CalendarDays },
  { href: "/student/assignments", key: "assignments", icon: ClipboardList },
  { href: "/student/doubts", key: "doubts", icon: MessageCircleQuestion },
  { href: "/student/attendance", key: "attendance", icon: CalendarCheck },
  { href: "/student/payments", key: "payments", icon: Wallet },
  { href: "/student/profile", key: "profile", icon: UserRound },
] as const satisfies readonly { href: string; key: keyof Dict["nav"]; icon: unknown }[];

/** Mobile bottom bar shows the four most-used tabs; the rest live under "More". */
const TAB_HREFS = ["/student", "/student/learn", "/student/schedule", "/student/assignments"];
const tabNav = portalNav.filter((n) => TAB_HREFS.includes(n.href));
const moreNav = portalNav.filter((n) => !TAB_HREFS.includes(n.href));

const isActive = (path: string | null, href: string) =>
  path !== null && (href === "/student" ? path === href : path.startsWith(href));

/**
 * usePathname() is request-time data on dynamic routes, so it must sit inside <Suspense>.
 * The fallback renders the same UI with no active item, so the shell is still prerendered.
 */
export function WithPath({ children }: { children: (path: string | null) => ReactNode }) {
  return (
    <Suspense fallback={children(null)}>
      <LivePath>{children}</LivePath>
    </Suspense>
  );
}
function LivePath({ children }: { children: (path: string | null) => ReactNode }) {
  return children(usePathname());
}

const digits = (n: string) => n.replace(/\D/g, "");

export function Sidebar({ user, extra }: { user: ReactNode; extra?: ReactNode }) {
  const { t } = useT();
  return (
    <aside className="sticky top-0 hidden h-dvh flex-col overflow-hidden bg-ink-950 px-4 py-6 grain lg:flex">
      <div aria-hidden className="pointer-events-none absolute -left-20 bottom-20 size-64 rounded-full bg-bean-700/25 blur-3xl" />
      <div className="relative z-10 flex h-full flex-col">
        <Link href="/student" className="flex items-center gap-2 px-3">
          <Logo dark sub={false} />
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white/70">{t.nav.academy}</span>
        </Link>
        <nav className="mt-9 flex-1 overflow-y-auto" aria-label="Menu" data-lenis-prevent>
          <div className="px-3 text-xs font-medium uppercase tracking-[0.2em] text-white/35">{t.nav.menu}</div>
          <ul className="mt-3 space-y-1">
            <WithPath>
              {(path) =>
                portalNav.map(({ href, key, icon: Icon }) => {
                  const active = isActive(path, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn("relative flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-base font-medium transition-colors", active ? "text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}
                      >
                        {active && <motion.span layoutId="sidebar-pill" transition={{ type: "spring", stiffness: 400, damping: 32 }} className="absolute inset-0 rounded-xl bg-gradient-to-r from-bean-600 to-bean-700 shadow-[0_8px_24px_-8px_rgb(var(--accent-rgb)/0.7)]" />}
                        <Icon className="relative size-5" />
                        <span className="relative">{t.nav[key]}</span>
                      </Link>
                    </li>
                  );
                })
              }
            </WithPath>
            <li>
              <span className="flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-base font-medium text-white/30">
                <GraduationCap className="size-5" /> {t.nav.certificate}
                <span className="ml-auto whitespace-nowrap rounded-md bg-white/10 px-1.5 py-0.5 text-[11px] font-medium text-white/50">{t.nav.soon}</span>
              </span>
            </li>
          </ul>
        </nav>

        {extra}

        <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white/[0.05] p-2.5">
          {user}
          <form action={logout} className="ml-auto">
            <button className="grid size-10 place-items-center rounded-xl text-white/50 transition-colors hover:bg-bean-600/20 hover:text-bean-300" aria-label={t.shell.logout} title={t.shell.logout}>
              <LogOut className="size-[18px]" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

/**
 * Floating "Help" button (bottom-right, above the phone tab bar). One tap opens
 * big Call / WhatsApp buttons so a student can always reach a human.
 */
export function HelpButton({ inline = false }: { inline?: boolean }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const phone = digits(brand.whatsapp);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[55] bg-ink-950/25" />}
      </AnimatePresence>
      <div className={inline ? "relative hidden lg:block" : "fixed bottom-[5.5rem] right-4 z-[56] flex flex-col items-end gap-3 lg:hidden"}>
        <AnimatePresence>
          {open && (
            <motion.div
              role="dialog"
              aria-label={t.shell.help}
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className={cn("w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-surface p-5 text-fg shadow-[0_12px_32px_-8px_rgb(17_17_20/0.18)]", inline ? "absolute right-0 top-12 z-[56] origin-top-right" : "relative origin-bottom-right")} data-help-card
            >
              <div className="text-lg font-semibold">{t.shell.help}</div>
              <p className="mt-1 text-base text-fg-muted">{t.shell.helpBody}</p>
              <div className="mt-4 grid gap-2">
                <a href={`tel:+${phone}`} className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-bean-600 text-base font-semibold text-white hover:bg-bean-700">
                  <Phone className="size-5" /> {t.shell.call}
                </a>
                <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="flex min-h-13 items-center justify-center gap-2 rounded-xl border border-line text-base font-semibold text-fg hover:bg-surface-2">
                  <MessageCircle className="size-5 text-emerald-600" /> {t.shell.whatsapp}
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="dialog"
          className={cn("flex items-center gap-2 rounded-full border font-semibold transition-colors", inline ? "min-h-10 px-3.5 text-sm" : "min-h-12 px-4 text-base shadow-[0_4px_14px_-4px_rgb(17_17_20/0.18)]", open ? "border-ink-900 bg-ink-900 text-white" : "border-line bg-surface text-fg hover:bg-surface-2")}
        >
          <Headset className={cn("size-5", !open && "text-bean-600")} strokeWidth={1.75} />
          {open ? t.common.close : t.shell.helpBtn}
        </motion.button>
      </div>
    </>
  );
}

export function MobileTabBar() {
  const { t } = useT();
  const [more, setMore] = useState(false);
  // px-1 + centred, slightly smaller labels keep "My classes" / Hindi labels inside the pill on 360px phones
  const item = "relative flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium leading-tight min-[400px]:text-xs";
  return (
    <>
      <AnimatePresence>
        {more && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)} className="fixed inset-0 z-[57] bg-ink-950/30 lg:hidden" />
            <motion.div
              initial={{ y: "110%" }}
              animate={{ y: 0 }}
              exit={{ y: "110%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed inset-x-0 bottom-0 z-[58] rounded-t-2xl border-t border-line bg-surface px-3 pt-3 shadow-[0_-8px_30px_-12px_rgb(17_17_20/0.2)] lg:hidden" style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
            >
              <WithPath>
                {(path) =>
                  moreNav.map(({ href, key, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setMore(false)} className={cn("flex min-h-14 items-center gap-3 rounded-xl px-4 text-base", isActive(path, href) ? "bg-surface-2 font-semibold text-fg" : "font-medium text-fg hover:bg-surface-2")}>
                      <Icon className={cn("size-5", isActive(path, href) ? "text-bean-600" : "text-fg-muted")} strokeWidth={1.75} /> {t.nav[key]}
                    </Link>
                  ))
                }
              </WithPath>
              <div className="p-2">
                <LangToggle className="w-full justify-center" />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <nav className="fixed inset-x-0 bottom-0 z-[59] border-t border-white/10 bg-ink-950 px-1.5 pt-1.5 lg:hidden" style={{ paddingBottom: "max(0.375rem, env(safe-area-inset-bottom))" }}>
        <ul className="grid grid-cols-5">
          <WithPath>
            {(path) => {
              const moreActive = moreNav.some((n) => isActive(path, n.href));
              return (
                <>
                  {tabNav.map(({ href, key, icon: Icon }) => {
                    const active = isActive(path, href) && !more;
                    return (
                      <li key={href}>
                        <Link href={href} onClick={() => setMore(false)} className={item}>
                          {active && <motion.span layoutId="tab-pill" transition={{ type: "spring", stiffness: 500, damping: 40 }} className="absolute inset-0 rounded-xl bg-gradient-to-r from-bean-600 to-bean-700" />}
                          <Icon className={cn("relative size-[22px] transition-colors", active ? "text-white" : "text-white/55")} />
                          <span className={cn("relative max-w-full text-center transition-colors", active ? "font-semibold text-white" : "text-white/55")}>{t.nav[key]}</span>
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <button onClick={() => setMore((m) => !m)} aria-expanded={more} className={cn(item, "w-full")}>
                      {(more || moreActive) && <motion.span layoutId="tab-pill" transition={{ type: "spring", stiffness: 500, damping: 40 }} className="absolute inset-0 rounded-xl bg-gradient-to-r from-bean-600 to-bean-700" />}
                      <MoreHorizontal className={cn("relative size-[22px]", more || moreActive ? "text-white" : "text-white/55")} />
                      <span className={cn("relative max-w-full text-center", more || moreActive ? "font-semibold text-white" : "text-white/55")}>{t.nav.more}</span>
                    </button>
                  </li>
                </>
              );
            }}
          </WithPath>
        </ul>
      </nav>
    </>
  );
}

export function Topbar({ user, userWide, extra }: { user: ReactNode; userWide?: ReactNode; extra?: ReactNode }) {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
        <Link href="/student" className="lg:hidden">
          <Logo sub={false} imgClassName="h-9" />
        </Link>
        <WithPath>
          {(path) => (
            <span className="hidden text-base font-semibold text-fg lg:block">
              {path?.startsWith("/student/class") ? t.shell.liveClass : (() => { const n = [...portalNav].reverse().find((x) => isActive(path, x.href)); return n ? t.nav[n.key] : ""; })()}
            </span>
          )}
        </WithPath>
        <div className="ml-auto flex items-center gap-2">
          <LangToggle className="hidden sm:inline-flex" />
          <HelpButton inline />
          <div className="lg:hidden">{extra}</div>
          <div className="lg:hidden">{user}</div>
          {userWide && <div className="ml-1 hidden border-l border-line pl-3 lg:block">{userWide}</div>}
        </div>
      </div>
    </header>
  );
}

/** Wrap each portal page so route changes cross-fade with a soft slide (React ViewTransition). */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="page-slide" exit="page-slide" default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}

/** Current time, ticking. `null` until mounted so server and client markup match. */
export function useNow(intervalMs = 1000): number | null {
  const subscribe = useCallback(
    (onTick: () => void) => {
      const t = setInterval(onTick, intervalMs);
      return () => clearInterval(t);
    },
    [intervalMs],
  );
  // Snapshot is bucketed to the interval so it stays stable between ticks.
  return useSyncExternalStore(
    subscribe,
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => null,
  );
}

export function Greeting({ name }: { name: string }) {
  const now = useNow(60_000);
  const h = now ? Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(now)) : null;
  const { t } = useT();
  const word = h === null ? t.greet.hello : h < 12 ? t.greet.morning : h < 17 ? t.greet.afternoon : t.greet.evening;
  return (
    <>
      {word}, {name.split(" ")[0]}
    </>
  );
}
