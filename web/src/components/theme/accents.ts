/**
 * Theme colours for the student portal and admin console. The CSS for each lives in globals.css
 * under html[data-accent="…"] .rb-themed. "red" is the Redbean default and has no override.
 */
export const ACCENTS = [
  { id: "red", hex: "#e01426", en: "Redbean red", hi: "रेडबीन लाल" },
  { id: "orange", hex: "#ea580c", en: "Orange", hi: "नारंगी" },
  { id: "green", hex: "#059669", en: "Green", hi: "हरा" },
  { id: "teal", hex: "#0d9488", en: "Teal", hi: "फ़िरोज़ी" },
  { id: "blue", hex: "#2563eb", en: "Blue", hi: "नीला" },
  { id: "indigo", hex: "#4f46e5", en: "Indigo", hi: "जामुनी नीला" },
  { id: "purple", hex: "#7c3aed", en: "Purple", hi: "बैंगनी" },
  { id: "pink", hex: "#db2777", en: "Pink", hi: "गुलाबी" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
export const ACCENT_KEY = "rb_accent";

/** Sidebar / phone tab bar style: dark (Red-Black, default), light (White), soft (light tint), colour (deep tint). */
export type NavStyle = "dark" | "light" | "soft" | "colour";
export const NAV_STYLES: NavStyle[] = ["dark", "light", "soft", "colour"];
export const NAV_KEY = "rb_nav";

/** Content background: soft = faded wash (default), vivid = brighter wash, plain = flat cream. */
export type BgStyle = "soft" | "vivid" | "plain";
export const BG_STYLES: BgStyle[] = ["soft", "vivid", "plain"];

/** One-tap looks. `accent: null` keeps the colour the student already picked. */
export const LOOKS = [
  { id: "classic", accent: "red", nav: "dark", bg: "soft" },
  { id: "clean", accent: null, nav: "light", bg: "plain" },
  { id: "warm", accent: null, nav: "soft", bg: "soft" },
  { id: "bold", accent: null, nav: "colour", bg: "vivid" },
] as const satisfies readonly { id: string; accent: "red" | null; nav: NavStyle; bg: BgStyle }[];
export type LookId = (typeof LOOKS)[number]["id"];
export const BG_KEY = "rb_bg";

/** Runs in <head> before first paint so a saved colour, nav style or background never flashes. */
export const ACCENT_BOOT_SCRIPT = `try{var d=document.documentElement,a=localStorage.getItem("${ACCENT_KEY}"),n=localStorage.getItem("${NAV_KEY}"),b=localStorage.getItem("${BG_KEY}");if(a&&a!=="red")d.setAttribute("data-accent",a);if(n==="light"||n==="soft"||n==="colour")d.setAttribute("data-nav",n);if(b==="plain"||b==="vivid")d.setAttribute("data-bg",b)}catch(e){}`;
