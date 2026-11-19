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

/** Runs in <head> before first paint so a saved colour never flashes red first. */
export const ACCENT_BOOT_SCRIPT = `try{var a=localStorage.getItem("${ACCENT_KEY}");if(a&&a!=="red")document.documentElement.setAttribute("data-accent",a)}catch(e){}`;
