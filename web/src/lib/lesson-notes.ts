"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Timestamped personal notes per lesson (Udemy-style). Stored on this device for now;
 * with the API they move to POST/GET /lessons/{id}/notes so they follow the student across devices.
 */

export type Note = { id: string; t: number; text: string; at: number };

const KEY = (lessonId: number) => `rb:notes:${lessonId}`;
const listeners = new Set<() => void>();
const cache = new Map<number, { raw: string | null; notes: Note[] }>();
const EMPTY: Note[] = [];

function read(lessonId: number): Note[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY(lessonId));
  } catch {
    return EMPTY;
  }
  const hit = cache.get(lessonId);
  if (hit && hit.raw === raw) return hit.notes; // stable reference for useSyncExternalStore
  let notes: Note[] = EMPTY;
  try {
    notes = raw ? (JSON.parse(raw) as Note[]).sort((a, b) => a.t - b.t) : EMPTY;
  } catch {
    notes = EMPTY;
  }
  cache.set(lessonId, { raw, notes });
  return notes;
}

function write(lessonId: number, notes: Note[]) {
  try {
    window.localStorage.setItem(KEY(lessonId), JSON.stringify(notes));
  } catch {
    /* storage blocked: notes just aren't kept */
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useLessonNotes(lessonId: number) {
  const notes = useSyncExternalStore(subscribe, () => read(lessonId), () => EMPTY);
  const add = useCallback(
    (t: number, text: string) => write(lessonId, [...read(lessonId), { id: `${Date.now()}`, t: Math.floor(t), text: text.trim(), at: Date.now() }]),
    [lessonId],
  );
  const remove = useCallback((id: string) => write(lessonId, read(lessonId).filter((n) => n.id !== id)), [lessonId]);
  return { notes, add, remove };
}
