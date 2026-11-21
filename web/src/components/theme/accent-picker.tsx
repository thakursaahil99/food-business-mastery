"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ACCENT_KEY, ACCENTS, BG_KEY, BG_STYLES, LOOKS, NAV_KEY, NAV_STYLES, type AccentId, type BgStyle, type LookId, type NavStyle } from "./accents";

export type AccentLabels = {
  button: string;
  title: string;
  hint: string;
  selected: string;
  names: Record<AccentId, string>;
  navStyle: string;
  navRedBlack: string;
  navDark: string;
  navWhite: string;
  navSoft: string;
  navColour: string;
  bgVivid: string;
  looks: string;
  lookNames: Record<string, string>;
  background: string;
  bgSoft: string;
  bgPlain: string;
};

const EN_LABELS: AccentLabels = {
  button: "Colour",
  title: "Theme colour",
  hint: "Changes the whole panel, student and admin.",
  selected: "Selected",
  names: Object.fromEntries(ACCENTS.map((a) => [a.id, a.en])) as Record<AccentId, string>,
  navStyle: "Menu style",
  navRedBlack: "Red-Black",
  navDark: "Dark",
  navWhite: "White",
  navSoft: "Soft",
  navColour: "Colour",
  bgVivid: "Bright",
  looks: "Ready looks",
  lookNames: { classic: "Classic", clean: "Clean", warm: "Warm", bold: "Bold" },
  background: "Background",
  bgSoft: "Soft colour",
  bgPlain: "Plain",
};

function readAccent(): AccentId {
  const v = document.documentElement.getAttribute("data-accent");
  return ACCENTS.some((a) => a.id === v) ? (v as AccentId) : "red";
}

function readNav(): NavStyle {
  const v = document.documentElement.getAttribute("data-nav") as NavStyle | null;
  return v && NAV_STYLES.includes(v) ? v : "dark";
}
function readBg(): BgStyle {
  const v = document.documentElement.getAttribute("data-bg") as BgStyle | null;
  return v && BG_STYLES.includes(v) ? v : "soft";
}
/** Sets (or clears, for the default) a data-* flag on <html> and remembers it on this device. */
function applyFlag(attr: string, key: string, value: string, fallback: string) {
  const root = document.documentElement;
  if (value === fallback) root.removeAttribute(attr);
  else root.setAttribute(attr, value);
  try {
    localStorage.setItem(key, value);
  } catch {}
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
 * Colour button + popover with swatches. Picking one re-colours the whole student portal and admin
 * console at once (both roots carry .rb-themed); the choice is remembered on this device.
 * `showLabel` puts the word next to the icon (the student portal avoids icon-only buttons).
 */
export function AccentPicker({
  labels = EN_LABELS,
  showLabel = false,
  size = "md",
  className,
}: {
  labels?: AccentLabels;
  showLabel?: boolean;
  size?: "md" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<AccentId>("red");
  const [nav, setNav] = useState<NavStyle>("dark");
  const [bg, setBg] = useState<BgStyle>("soft");
  const ref = useRef<HTMLDivElement>(null);

  // The boot script in <head> already applied the saved colour before paint; sync the checkmark to it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(readAccent());
    setNav(readNav());
    setBg(readBg());
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
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
  const setNavStyle = (v: NavStyle) => {
    applyFlag("data-nav", NAV_KEY, v, "dark");
    setNav(v);
  };
  const setBgStyle = (v: BgStyle) => {
    applyFlag("data-bg", BG_KEY, v, "soft");
    setBg(v);
  };
  const applyLook = (id: LookId) => {
    const l = LOOKS.find((x) => x.id === id)!;
    if (l.accent) pick(l.accent);
    setNavStyle(l.nav);
    setBgStyle(l.bg);
  };

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={showLabel ? undefined : labels.title}
        title={labels.title}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface font-medium text-fg-muted transition-colors hover:text-fg",
          size === "lg" ? "h-12 min-w-12 text-base" : "h-10 min-w-10 text-sm",
          showLabel && "px-3.5",
        )}
      >
        <span className="relative">
          <Palette className="size-[18px]" aria-hidden />
          <span className="absolute -bottom-1 -right-1 size-2.5 rounded-full bg-bean-600 ring-2 ring-surface" aria-hidden />
        </span>
        {showLabel && <span className="text-fg">{labels.button}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label={labels.title}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 max-h-[calc(100dvh-5.5rem)] w-[20rem] max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-4 shadow-lg"
          >
            <p className="text-sm font-semibold text-fg">{labels.title}</p>
            <p className="mt-0.5 text-xs text-fg-muted">{labels.hint}</p>
            <p className="mt-3 text-sm font-semibold text-fg">{labels.looks}</p>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {LOOKS.map((l) => {
                const on = nav === l.nav && bg === l.bg && (l.accent === null || current === l.accent);
                return (
                  <button key={l.id} type="button" onClick={() => applyLook(l.id)} aria-pressed={on} className={cn("rounded-xl border p-1 text-center transition-colors", on ? "border-bean-600 bg-bean-50" : "border-line hover:border-line-strong")}>
                    <MiniPreview nav={NAV_PREVIEW[l.nav]} body={BG_PREVIEW[l.bg]} />
                    <span className="mt-1 block text-[11px] font-semibold leading-tight text-fg">{labels.lookNames[l.id]}</span>
                  </button>
                );
              })}
            </div>
            <div role="radiogroup" aria-label={labels.title} className="mt-4 grid grid-cols-4 gap-2">
              {ACCENTS.map((a) => {
                const on = current === a.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={labels.names[a.id]}
                    title={labels.names[a.id]}
                    onClick={() => pick(a.id)}
                    className={cn(
                      "grid aspect-square min-h-12 place-items-center rounded-xl ring-offset-2 ring-offset-surface transition-transform",
                      on ? "ring-2 ring-fg" : "hover:scale-105",
                    )}
                    style={{ backgroundColor: a.hex }}
                  >
                    {on && <Check className="size-4 text-white" strokeWidth={3} aria-hidden />}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-fg-muted">
              {labels.selected}: <span className="font-medium text-fg">{labels.names[current]}</span>
            </p>
            <Segment
              label={labels.navStyle}
              value={nav}
              cols={2}
              options={[
                { value: "dark", label: current === "red" ? labels.navRedBlack : labels.navDark, preview: { nav: "bg-ink-950", body: "bg-cream-100" } },
                { value: "light", label: labels.navWhite, preview: { nav: "bg-white", body: "bg-cream-100" } },
                { value: "soft", label: labels.navSoft, preview: { nav: "bg-bean-100", body: "bg-cream-100" } },
                { value: "colour", label: labels.navColour, preview: { nav: "bg-gradient-to-b from-bean-700 to-bean-950", body: "bg-cream-100" } },
              ]}
              onChange={setNavStyle}
            />
            <Segment
              label={labels.background}
              value={bg}
              cols={3}
              options={[
                { value: "soft", label: labels.bgSoft, preview: { body: "bg-gradient-to-br from-cream-50 via-cream-50 to-bean-100" } },
                { value: "vivid", label: labels.bgVivid, preview: { body: "bg-gradient-to-br from-gold-400/50 via-cream-50 to-bean-300" } },
                { value: "plain", label: labels.bgPlain, preview: { body: "bg-cream-100" } },
              ]}
              onChange={setBgStyle}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const NAV_PREVIEW: Record<NavStyle, string> = { dark: "bg-ink-950", light: "bg-white", soft: "bg-bean-100", colour: "bg-gradient-to-b from-bean-700 to-bean-950" };
const BG_PREVIEW: Record<BgStyle, string> = {
  soft: "bg-gradient-to-br from-cream-50 via-cream-50 to-bean-100",
  vivid: "bg-gradient-to-br from-gold-400/50 via-cream-50 to-bean-300",
  plain: "bg-cream-100",
};

/** A tiny picture of the panel: sidebar strip on the left, content background on the right. */
function MiniPreview({ nav, body }: { nav?: string; body: string }) {
  return (
    <span className={cn("relative flex h-7 w-full overflow-hidden rounded-lg ring-1 ring-inset ring-line", body)} aria-hidden>
      {nav && <span className={cn("h-full w-[32%] border-r border-black/5", nav)} />}
      <span className="m-1.5 h-2 w-1/3 rounded-sm bg-white/90 shadow-sm" />
    </span>
  );
}

/** Option grid used for menu style and background, each with a small preview. */
function Segment<T extends string>({ label, value, options, onChange, cols }: { label: string; value: T; options: { value: T; label: string; preview: { nav?: string; body: string } }[]; onChange: (v: T) => void; cols: 2 | 3 }) {
  return (
    <div className="mt-4">
      <p className="text-sm font-semibold text-fg">{label}</p>
      <div role="radiogroup" aria-label={label} className={cn("mt-2 grid gap-2", cols === 3 ? "grid-cols-3" : "grid-cols-2")}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={cn("rounded-xl border p-1.5 text-left transition-colors", on ? "border-bean-600 bg-bean-50" : "border-line hover:border-line-strong")}
            >
              <MiniPreview nav={o.preview.nav} body={o.preview.body} />
              <span className="mt-1 flex items-center gap-1 px-0.5 text-xs font-semibold leading-tight text-fg">
                <span className="min-w-0 flex-1">{o.label}</span>
                {on && <Check className="size-3.5 shrink-0 text-bean-600" strokeWidth={3} aria-hidden />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
