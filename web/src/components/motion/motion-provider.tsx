"use client";

import { MotionConfig } from "motion/react";
import { useSyncExternalStore, type ReactNode } from "react";

/**
 * reducedMotion="user": for people with "reduce motion" switched on, Motion skips transform/layout
 * animations app-wide (opacity fades still run), so components don't each have to branch on it.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

const QUERY = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/**
 * Hydration-safe replacement for Motion's useReducedMotion(): false on the server AND during
 * hydration, then the real preference. Use it whenever the value changes rendered markup
 * (initial props, transform ranges); Motion's own hook is null on the server and true on the
 * client, which causes hydration mismatches for reduced-motion users.
 */
export function useReducedMotionSafe() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
