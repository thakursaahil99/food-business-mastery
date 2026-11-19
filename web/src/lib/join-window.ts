import type { ClassSession } from "./types";

/** Join opens this many minutes before a session starts (CLAUDE.md §9). */
export const JOIN_OPENS_MIN_BEFORE = 10;

export type JoinState =
  | { state: "cancelled" }
  | { state: "upcoming"; opensInMs: number }
  | { state: "open"; live: boolean }
  | { state: "ended" };

/**
 * UI hint only. The server re-checks the window when issuing a LiveKit token —
 * never trust the client clock for access.
 */
export function getJoinState(s: Pick<ClassSession, "startsAt" | "endsAt" | "status">, now = Date.now()): JoinState {
  if (s.status === "cancelled") return { state: "cancelled" };
  const start = +new Date(s.startsAt);
  const end = +new Date(s.endsAt);
  const opens = start - JOIN_OPENS_MIN_BEFORE * 60_000;
  if (now >= end || s.status === "completed") return { state: "ended" };
  if (now >= opens) return { state: "open", live: now >= start };
  return { state: "upcoming", opensInMs: opens - now };
}

export function countdownParts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  };
}
