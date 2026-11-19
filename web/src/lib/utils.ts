import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const IST = "Asia/Kolkata";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(amount: number) {
  return inr.format(amount);
}

export function formatIST(iso: string | Date, opts: Intl.DateTimeFormatOptions, locale = "en-IN") {
  return new Intl.DateTimeFormat(locale, { timeZone: IST, ...opts }).format(
    typeof iso === "string" ? new Date(iso) : iso,
  );
}

export const fmtTime = (iso: string) =>
  formatIST(iso, { hour: "numeric", minute: "2-digit", hour12: true });
export const fmtDay = (iso: string) =>
  formatIST(iso, { weekday: "short", day: "numeric", month: "short" });
export const fmtDayLong = (iso: string) =>
  formatIST(iso, { weekday: "long", day: "numeric", month: "long" });
export const fmtDate = (iso: string) =>
  formatIST(iso, { day: "numeric", month: "short", year: "numeric" });

/** YYYY-MM-DD for the given instant in IST — handy for grouping by local day. */
export function istDayKey(iso: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof iso === "string" ? new Date(iso) : iso);
  return parts;
}

export function durationLabel(startIso: string, endIso: string) {
  const mins = Math.round((+new Date(endIso) - +new Date(startIso)) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

export function secondsLabel(sec: number) {
  const m = Math.floor(sec / 60);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m} min`;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Accepts an email or an Indian WhatsApp number (10 digits, optional +91 / 0). */
export function parseIdentifier(raw: string):
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string }
  | null {
  const v = raw.trim();
  if (EMAIL_RE.test(v)) return { kind: "email", value: v.toLowerCase() };
  const digits = v.replace(/[\s\-()]/g, "");
  const m = digits.match(/^(?:\+?91|0)?([6-9]\d{9})$/);
  if (m) return { kind: "phone", value: `+91${m[1]}` };
  return null;
}

export function maskIdentifier(id: { kind: "email" | "phone"; value: string }) {
  if (id.kind === "phone") return `${id.value.slice(0, 3)} ${id.value.slice(3, 5)}••• ••${id.value.slice(-3)}`;
  const [user, domain] = id.value.split("@");
  return `${user!.slice(0, 2)}${"•".repeat(Math.max(1, user!.length - 2))}@${domain}`;
}
