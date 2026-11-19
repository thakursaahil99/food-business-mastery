"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo, useState, useTransition, type ReactNode } from "react";
import { motion } from "motion/react";
import { dictionaries, LANG_COOKIE, TEXT_COOKIE, textSizeClass, type Dict, type Lang, type TextSize } from "@/lib/i18n/dict";
import { cn, formatIST } from "@/lib/utils";

/** Writes a year-long, site-wide preference cookie (outside components, so React treats it as a plain side effect). */
function writePrefCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/** Swaps the text-size class on the portal root right away (the server applies it on the next render). */
function applyTextSize(s: TextSize) {
  const root = document.querySelector(".portal-easy");
  if (!root) return;
  root.classList.remove("text-lg-ui", "text-xl-ui");
  if (textSizeClass[s]) root.classList.add(textSizeClass[s]);
}

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void; pending: boolean };
const LangContext = createContext<Ctx>({ lang: "en", t: dictionaries.en, setLang: () => {}, pending: false });

/** Seeded with the server-read cookie so the first paint is already in the right language. */
export function LangProvider({ lang: initial, children }: { lang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const setLang = (l: Lang) => {
    setLangState(l);
    writePrefCookie(LANG_COOKIE, l);
    document.documentElement.lang = l === "hi" ? "hi" : "en-IN";
    start(() => router.refresh()); // re-render server parts in the new language
  };
  return <LangContext.Provider value={{ lang, t: dictionaries[lang], setLang, pending }}>{children}</LangContext.Provider>;
}

export const useT = () => useContext(LangContext);

/** Big, always-visible English / हिंदी switch. */
export function LangToggle({ className, dark = false }: { className?: string; dark?: boolean }) {
  const { lang, setLang, t } = useT();
  return (
    <div role="radiogroup" aria-label={t.shell.language} className={cn("inline-flex rounded-full border p-1", dark ? "border-white/15 bg-white/5" : "border-transparent bg-surface-2", className)}>
      {(
        [
          ["en", "English"],
          ["hi", "हिंदी"],
        ] as const
      ).map(([l, label]) => {
        const on = lang === l;
        return (
          <button
            key={l}
            role="radio"
            aria-checked={on}
            lang={l === "hi" ? "hi" : "en"}
            onClick={() => !on && setLang(l)}
            className={cn("relative min-h-10 rounded-full px-4 text-sm font-semibold transition-colors", on ? (dark ? "text-white" : "text-fg") : dark ? "text-white/60 hover:text-white" : "text-fg-muted hover:text-fg")}
          >
            {on && <motion.span layoutId={`lang-pill-${dark ? "d" : "l"}`} transition={{ type: "spring", stiffness: 400, damping: 32 }} className={cn("absolute inset-0 rounded-full", dark ? "bg-bean-600" : "bg-surface shadow-sm ring-1 ring-line")} />}
            <span className="relative">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Normal / Large / Extra large — three big buttons with a live "Aa" preview. */
export function TextSizePicker({ initial }: { initial: TextSize }) {
  const { t } = useT();
  const router = useRouter();
  const [size, setSize] = useState<TextSize>(initial);
  const [, start] = useTransition();
  const pick = (s: TextSize) => {
    setSize(s);
    writePrefCookie(TEXT_COOKIE, s);
    applyTextSize(s);
    start(() => router.refresh());
  };
  const demo: Record<TextSize, string> = { md: "text-xl", lg: "text-2xl", xl: "text-3xl" };
  return (
    <div role="radiogroup" aria-label={t.profile.textSize} className="grid grid-cols-3 gap-2">
      {(["md", "lg", "xl"] as TextSize[]).map((s) => {
        const on = size === s;
        return (
          <button
            key={s}
            role="radio"
            aria-checked={on}
            onClick={() => pick(s)}
            className={cn("flex min-h-24 flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 transition-colors", on ? "border-bean-600 bg-bean-50 text-bean-800" : "border-line text-fg hover:border-line-strong")}
          >
            <span className={cn("font-display font-bold leading-none", demo[s])}>Aa</span>
            <span className="text-sm font-semibold">{t.profile.sizes[s]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Date/time formatters in the student's language (IST). Use these in student-facing views. */
export function useFmt() {
  const { lang } = useT();
  return useMemo(() => {
    const loc = lang === "hi" ? "hi-IN" : "en-IN";
    const f = (o: Intl.DateTimeFormatOptions) => (iso: string | Date) => formatIST(iso, o, loc);
    return {
      locale: loc,
      fmtTime: f({ hour: "numeric", minute: "2-digit", hour12: true }),
      fmtDay: f({ weekday: "short", day: "numeric", month: "short" }),
      fmtDayLong: f({ weekday: "long", day: "numeric", month: "long" }),
      fmtDate: f({ day: "numeric", month: "short", year: "numeric" }),
    };
  }, [lang]);
}
