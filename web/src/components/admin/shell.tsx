"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { BarChart3, Bell, BookOpen, CalendarRange, ClipboardList, CreditCard, GraduationCap, Inbox, Layers, LayoutDashboard, LogOut, Menu, MessageCircleQuestion, Search, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { WithPath } from "@/components/portal/shell";
import { logout } from "@/lib/actions/auth";
import { AccentPicker } from "@/components/theme/accent-picker";
import { cn } from "@/lib/utils";

export const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/sessions", label: "Classes (Zoom)", icon: CalendarRange },
  { href: "/admin/courses", label: "Course content", icon: BookOpen },
  { href: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { href: "/admin/doubts", label: "Doubts", icon: MessageCircleQuestion },
  { href: "/admin/batches", label: "Programs & batches", icon: Layers },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
] as const;

const isActive = (path: string | null, href: string) => path !== null && (href === "/admin" ? path === href : path.startsWith(href));

function NavLinks({ onNavigate, badges }: { onNavigate?: () => void; badges?: Partial<Record<string, ReactNode>> }) {
  return (
    <ul className="space-y-1">
      <WithPath>
        {(path) =>
          adminNav.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn("relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors", active ? "text-[var(--nav-active-fg)]" : "text-[var(--nav-muted)] hover:bg-[var(--nav-hover)] hover:text-[var(--nav-fg)]")}
                >
                  {active && <motion.span layoutId={onNavigate ? "admin-pill-m" : "admin-pill"} transition={{ type: "spring", stiffness: 400, damping: 32 }} className="rb-nav-pill absolute inset-0 rounded-xl" />}
                  <Icon className="relative size-[18px]" />
                  <span className="relative">{label}</span>
                  {badges?.[href]}
                </Link>
              </li>
            );
          })
        }
      </WithPath>
    </ul>
  );
}

function SidebarBody({ user, onNavigate, badges }: { user: ReactNode; onNavigate?: () => void; badges?: Partial<Record<string, ReactNode>> }) {
  return (
    <>
      <Link href="/admin" onClick={onNavigate} className="flex items-center gap-2 px-3">
        <span className="rb-nav-dark-only"><Logo dark sub={false} /></span>
        <span className="rb-nav-light-only"><Logo sub={false} /></span>
        <span className="rounded-md bg-[var(--nav-chip)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--nav-muted)]">Console</span>
      </Link>
      <nav className="mt-8 flex-1 overflow-y-auto" data-lenis-prevent>
        <div className="px-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--nav-faint)]">Manage</div>
        <div className="mt-3">
          <NavLinks onNavigate={onNavigate} badges={badges} />
        </div>
      </nav>
      <Link href="/student" className="group mb-4 flex items-center justify-between rounded-2xl border border-[var(--nav-border)] bg-[var(--nav-card)] p-3.5 text-sm text-[var(--nav-muted)] transition-colors hover:text-[var(--nav-fg)]">
        <span>
          <span className="block text-[11px] uppercase tracking-wider text-[var(--nav-faint)]">Switch view</span>
          Student portal
        </span>
        <GraduationCap className="size-5 text-bean-400 transition-transform group-hover:scale-110" />
      </Link>
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--nav-card)] p-2.5">
        {user}
        <form action={logout} className="ml-auto">
          <input type="hidden" name="to" value="/admin/login" />
          <button className="grid size-9 place-items-center rounded-xl text-[var(--nav-faint)] transition-colors hover:bg-bean-600/15 hover:text-bean-600" aria-label="Log out" title="Log out">
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
    </>
  );
}

export function AdminSidebar({ user, badges }: { user: ReactNode; badges?: Partial<Record<string, ReactNode>> }) {
  return (
    <aside className="rb-nav rb-nav-surface sticky top-0 hidden h-dvh flex-col bg-[var(--nav-bg)] px-4 py-6 grain lg:flex">
      <div aria-hidden className="rb-nav-deco pointer-events-none absolute -left-20 bottom-20 size-64 rounded-full bg-bean-700/20 blur-3xl" />
      <div className="relative z-10 flex h-full flex-col">
        <SidebarBody user={user} badges={badges} />
      </div>
    </aside>
  );
}

export function AdminTopbar({ user, mobileUser }: { user: ReactNode; mobileUser: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
          <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-xl border border-line bg-surface lg:hidden" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
            <input placeholder="Search students, leads, invoices…" className="h-10 w-full rounded-xl border border-line bg-surface pl-10 pr-14 text-sm outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5" />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-fg-muted">⌘K</kbd>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <AccentPicker />
            <button className="relative grid size-10 place-items-center rounded-xl border border-line bg-surface text-fg-muted hover:text-fg" aria-label="Notifications">
              <Bell className="size-[18px]" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-bean-500 ring-2 ring-surface" />
            </button>
            <div className="hidden sm:block">{user}</div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm lg:hidden" />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="rb-nav rb-nav-surface fixed inset-y-0 left-0 z-50 flex w-[290px] flex-col bg-[var(--nav-bg)] px-4 py-6 lg:hidden"
            >
              <button onClick={() => setOpen(false)} className="absolute right-4 top-6 grid size-9 place-items-center rounded-xl bg-[var(--nav-chip)] text-[var(--nav-fg)]" aria-label="Close menu">
                <X className="size-4" />
              </button>
              <SidebarBody user={mobileUser} onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
