"use client";

import { useSyncExternalStore } from "react";
import type { Lesson } from "./types";

/**
 * Per-device watch progress for the demo. Once the API is live, POST /lessons/{id}/progress becomes
 * the source of truth and this only smooths over the gap until the next fetch.
 *
 * t = where the student last stopped, m = the furthest point reached by normal playback.
 * Students can't seek past `m` (no skipping ahead); the server must enforce the same rule.
 */
type Saved = { t: number; m?: number; done?: boolean };
const KEY = (id: number) => `rb:lesson:${id}`;
const listeners = new Set<() => void>();
let version = 0;

export function readProgress(id: number): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY(id));
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

/** Furthest point watched (never less than where they last stopped). */
export function readMaxWatched(id: number): number {
  const s = readProgress(id);
  return s ? Math.max(s.m ?? 0, s.t) : 0;
}

export function saveProgress(id: number, t: number, done = false, max?: number) {
  try {
    const prev = readProgress(id);
    const m = Math.floor(Math.max(prev?.m ?? 0, prev?.t ?? 0, max ?? 0, t));
    window.localStorage.setItem(KEY(id), JSON.stringify({ t: Math.floor(t), m, done: done || prev?.done || false }));
  } catch {
    /* private mode / storage blocked: progress just isn't remembered */
  }
  version++;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Re-renders when any lesson's saved progress changes. 0 during SSR, so markup stays identical. */
export function useProgressVersion() {
  return useSyncExternalStore(subscribe, () => version + 1, () => 0);
}

/** Server progress merged with what was watched on this device (whichever is further). */
export function withLocalProgress(l: Lesson, enabled: boolean): Lesson {
  if (!enabled || l.locked) return l;
  const s = readProgress(l.id);
  if (!s) return l;
  const completed = l.completed || !!s.done;
  return { ...l, completed, watchedSec: completed ? l.durationSec : Math.max(l.watchedSec, Math.min(s.t, l.durationSec)) };
}
