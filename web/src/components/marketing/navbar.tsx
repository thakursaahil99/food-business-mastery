"use client";

import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { ButtonLink } from "@/components/ui/button";
import { Magnetic, EASE } from "@/components/motion/primitives";
import { nav } from "@/content/site";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > prev && y > 240 && !open);
    setScrolled(y > 24);
  });

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: hidden ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
      >
        <nav
          className={cn(
            "flex w-full max-w-6xl items-center justify-between rounded-full border px-3 py-2 pl-5 transition-all duration-500",
            scrolled || open
              ? "border-white/10 bg-ink-950/70 shadow-[0_20px_60px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          <Link href="/" aria-label="Redbean Academy home" onClick={() => setOpen(false)}>
            <Logo dark priority />
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="group relative rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:text-white"
                >
                  <span className="absolute inset-0 scale-75 rounded-full bg-white/8 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
                  <span className="relative">{n.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden px-3 text-sm text-white/70 transition-colors hover:text-white sm:block">
              Student login
            </Link>
            <Magnetic className="hidden sm:block">
              <ButtonLink href="/apply" size="sm" className="pl-4 pr-3">
                Apply now <ArrowUpRight className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </ButtonLink>
            </Magnetic>
            <button
              onClick={() => setOpen((o) => !o)}
              className="grid size-10 place-items-center rounded-full bg-white/10 text-white lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={open ? "x" : "m"} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-ink-950/95 backdrop-blur-2xl lg:hidden"
            initial={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            animate={{ clipPath: "circle(150% at calc(100% - 44px) 44px)" }}
            exit={{ clipPath: "circle(0% at calc(100% - 44px) 44px)" }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="flex h-full flex-col justify-between px-6 pb-10 pt-32">
              <ul className="space-y-2">
                {[...nav, { href: "/login", label: "Student login" }].map((n, i) => (
                  <motion.li key={n.href} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: EASE }}>
                    <Link href={n.href} onClick={() => setOpen(false)} className="font-display block text-4xl font-semibold tracking-tight text-white">
                      {n.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <ButtonLink href="/apply" size="lg" onClick={() => setOpen(false)} className="w-full">
                Apply for CGR Workshop <ArrowUpRight />
              </ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
