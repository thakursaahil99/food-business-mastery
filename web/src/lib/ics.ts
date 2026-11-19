import type { ClassSession } from "./types";

const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");

export function sessionToIcs(s: ClassSession, joinUrl: string) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Redbean Academy//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:session-${s.id}@redbean.academy`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(s.startsAt)}`,
    `DTEND:${stamp(s.endsAt)}`,
    `SUMMARY:${esc(s.title)}`,
    `DESCRIPTION:${esc(`${s.programTitle} · ${s.batchName}\nCoach: ${s.coach.name}\nJoin: ${joinUrl}`)}`,
    `URL:${joinUrl}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT15M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Class starts in 15 minutes",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(s: ClassSession, joinUrl: string) {
  const blob = new Blob([sessionToIcs(s, joinUrl)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${s.title.replace(/[^\w]+/g, "-").toLowerCase()}.ics`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function googleCalendarUrl(s: ClassSession, joinUrl: string) {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: s.title,
    dates: `${stamp(s.startsAt)}/${stamp(s.endsAt)}`,
    details: `${s.programTitle} · ${s.batchName}\nCoach: ${s.coach.name}\nJoin: ${joinUrl}`,
    ctz: "Asia/Kolkata",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}
