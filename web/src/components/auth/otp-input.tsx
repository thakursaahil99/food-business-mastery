"use client";

import { motion } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

export function OtpInput({
  value,
  onChange,
  onComplete,
  error,
  disabled,
  length = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  error?: boolean;
  disabled?: boolean;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const set = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  };

  return (
    <motion.div
      className="flex justify-between gap-2 sm:gap-3"
      animate={error ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
      role="group"
      aria-label="One-time password"
    >
      {digits.map((d, i) => {
        const active = i === Math.min(value.length, length - 1);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            className="relative flex-1"
          >
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              disabled={disabled}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${i + 1}`}
              maxLength={length}
              autoFocus={i === 0}
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                if (!raw) return;
                // typed one digit or pasted / autofilled several
                const merged = raw.length > 1 ? raw : value.slice(0, i) + raw + value.slice(i + 1);
                const clean = set(raw.length > 1 ? raw : merged);
                refs.current[Math.min(clean.length, length - 1)]?.focus();
              }}
              onKeyDown={(e) => {
                if (e.key === "Backspace") {
                  e.preventDefault();
                  const idx = d ? i : i - 1;
                  if (idx < 0) return;
                  set(value.slice(0, idx) + value.slice(idx + 1));
                  refs.current[idx]?.focus();
                } else if (e.key === "ArrowLeft") refs.current[i - 1]?.focus();
                else if (e.key === "ArrowRight") refs.current[i + 1]?.focus();
              }}
              onPaste={(e) => {
                e.preventDefault();
                const clean = set(e.clipboardData.getData("text"));
                refs.current[Math.min(clean.length, length - 1)]?.focus();
              }}
              className={cn(
                "aspect-[4/5] w-full rounded-2xl border-2 bg-white text-center font-display text-2xl font-semibold text-ink-900 caret-transparent outline-none transition-all duration-200 sm:text-3xl",
                error ? "border-bean-500 bg-bean-50" : d ? "border-ink-900" : "border-ink-100",
                "focus:border-bean-500 focus:ring-4 focus:ring-bean-500/15",
              )}
            />
            {active && !d && !disabled && (
              <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-7 w-0.5 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded bg-bean-500" />
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
