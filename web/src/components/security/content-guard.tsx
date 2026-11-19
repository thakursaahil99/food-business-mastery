"use client";

import { useEffect } from "react";

/**
 * Deterrent only, not security. It stops casual users from right-click → Inspect, F12, view-source
 * and Ctrl+S. Anyone determined can still open DevTools from the browser menu, so real protection
 * lives on the server: auth via httpOnly cookie (BFF), server-only data code, short-lived signed
 * video URLs, and no browser source maps in production.
 *
 * Active in production builds only, so development keeps working normally.
 * Override with NEXT_PUBLIC_CONTENT_GUARD=on|off.
 */
const MODE = process.env.NEXT_PUBLIC_CONTENT_GUARD;
const ENABLED = MODE === "on" || (MODE !== "off" && process.env.NODE_ENV === "production");

/** Right-click stays available in text fields, so older users can still paste their number. */
const isEditable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || t.closest("input, textarea, select, [contenteditable='true']") !== null);

function blockedShortcut(e: KeyboardEvent) {
  const k = e.key.toLowerCase();
  const mod = e.ctrlKey || e.metaKey;
  if (k === "f12") return true;
  if (mod && e.shiftKey && ["i", "j", "c", "k"].includes(k)) return true; // DevTools panels (Win/Linux, Firefox)
  if (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(k)) return true; // DevTools / source (macOS)
  if (mod && !e.shiftKey && ["u", "s"].includes(k)) return true; // view source, save page
  return false;
}

export function ContentGuard() {
  useEffect(() => {
    if (!ENABLED) return;
    const onContext = (e: MouseEvent) => {
      if (!isEditable(e.target)) e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if (blockedShortcut(e)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // dragging an image/video to the desktop or another tab saves it
    const onDrag = (e: DragEvent) => {
      const t = e.target;
      if (t instanceof HTMLImageElement || t instanceof HTMLVideoElement) e.preventDefault();
    };
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("dragstart", onDrag);
    return () => {
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("dragstart", onDrag);
    };
  }, []);
  return null;
}
