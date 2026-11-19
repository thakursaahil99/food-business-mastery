"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ACCENT_KEY, ACCENTS, type AccentId } from "./accents";

function readAccent(): AccentId {
  if (typeof document === "undefined") return "red";
  return (document.documentElement.getAttribute("data-accent") as AccentId | null) ?? "red";
}

function applyAccent(id: AccentId) {
  const root = document.documentElement;
  if (id === "red") root.removeAttribute("data-accent");
  else root.setAttribute("data-accent", id);
  try {
    localStorage.setItem(ACCENT_KEY, id);
  } catch {}
}

/**
 * Colour button + popover with swatches. Changing it re-colours the whole student portal and admin
 * console at once (both roots carry .rb-themed), and the choice is remembered on this device.
 */
export function AccentPicker({ lang = "en", className, size = "md" }: { lang?: "en" | "hi"; className?: string; size?: "md" | "lg" }) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<AccentId>("red");
  const ref = useRef<HTMLDivElement>(null);
  const title = lang === "hi" ? "थीम का रंग" : "Theme colour";

  // The boot script already set the attribute before paint; sync the checkmark to it.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setCurrent(readAccent()), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (id: AccentId) => {
    applyAccent(id);
    setCurrent(id);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={title}
        title={title}
        className={cn(
          "grid place-items-center rounded-xl border border-line bg-surface text-fg-muted transition-colors hover:text-fg",
          size === "lg" ? "size-12" : "size-10",
        )}
      >
        <span className="relative">
          <Palette className="size-[18px]" />
          <span className="absolute -bottom-1 -right-1 size-2.5 rounded-full bg-bean-600 ring-2 ring-surface" />
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={title}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-line bg-surface p-4 shadow-lg"
          >
            <p className="text-sm font-semibold text-fg">{title}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{lang === "hi" ? "पूरा पैनल इसी रंग में बदल जाएगा।" : "Changes the whole panel, student and admin."}</p>
            <div role="radiogroup" aria-label={title} className="mt-3 grid grid-cols-4 gap-2">
              {ACCENTS.map((a) => {
                const on = current === a.id;
                const name = lang === "hi" ? a.hi : a.en;
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={name}
                    title={name}
                    onClick={() => pick(a.id)}
                    className={cn("grid aspect-square place-items-center rounded-xl ring-offset-2 ring-offset-surface transition", on ? "ring-2 ring-fg" : "hover:scale-105")}
                    style={{ backgroundColor: a.hex }}
                  >
                    {on && <Check className="size-4 text-white" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-fg-muted">{lang === "hi" ? "चुना गया" : "Selected"}: <span className="font-medium text-fg">{ACCENTS.find((a) => a.id === current)?.[lang]}</span></p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
