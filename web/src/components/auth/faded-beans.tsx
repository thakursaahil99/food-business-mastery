"use client";

import { motion } from "motion/react";
import { useReducedMotionSafe } from "@/components/motion/motion-provider";
import { BeanMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

/** Positions keep clear of the centred form: corners and edges only. */
const BEANS = [
  { cls: "left-6 top-24 size-24", rotate: -28, opacity: 0.07, d: 0 },
  { cls: "right-8 top-6 size-16", rotate: 32, opacity: 0.07, d: 1.2 },
  { cls: "-right-10 top-1/3 size-40", rotate: 14, opacity: 0.06, d: 2.4 },
  { cls: "left-6 top-1/2 size-14", rotate: 40, opacity: 0.08, d: 0.6 },
  { cls: "left-4 bottom-24 size-28", rotate: -12, opacity: 0.06, d: 1.8 },
  { cls: "right-16 bottom-10 size-20", rotate: -35, opacity: 0.08, d: 3 },
  { cls: "left-1/3 -bottom-8 size-24", rotate: 22, opacity: 0.05, d: 2 },
];

/** Soft, slowly floating Redbean beans behind the login form. Decorative only. */
export function FadedBeans({ className }: { className?: string }) {
  const reduce = useReducedMotionSafe();
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {BEANS.map((b, i) => (
        <motion.div
          key={i}
          className={cn("absolute", b.cls)}
          style={{ opacity: b.opacity, rotate: b.rotate }}
          animate={reduce ? undefined : { y: [0, -12, 0], rotate: [b.rotate, b.rotate + 6, b.rotate] }}
          transition={{ duration: 9 + i, delay: b.d, repeat: Infinity, ease: "easeInOut" }}
        >
          <BeanMark className="size-full" />
        </motion.div>
      ))}
    </div>
  );
}
