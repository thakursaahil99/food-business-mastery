"use client";

import {
  animate,
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type HTMLMotionProps,
  type MotionValue,
} from "motion/react";
import { ReactLenis } from "lenis/react";
import { Children, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotionSafe } from "./motion-provider";

export const EASE = [0.16, 1, 0.3, 1] as const;

/* ───────────── Smooth scroll (Lenis) ───────────── */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduce = useReducedMotionSafe();
  if (reduce) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, anchors: { offset: -80 } }}>
      {children}
    </ReactLenis>
  );
}

/* ───────────── Reveal on view ───────────── */
type RevealProps = HTMLMotionProps<"div"> & { delay?: number; y?: number; blur?: boolean };

export function Reveal({ delay = 0, y = 28, blur = true, className, children, ...rest }: RevealProps) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y, filter: blur ? "blur(8px)" : "none" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Staggers direct children into view. */
export function Stagger({
  children,
  className,
  gap = 0.08,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
}) {
  const reduce = useReducedMotionSafe();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {Children.map(children, (child) => (
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 24, filter: "blur(6px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: EASE } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ───────────── Masked word-by-word headline ───────────── */
export function SplitWords({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.06,
  as: Tag = "span",
  animateOnView = false,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  as?: "span" | "h1" | "h2" | "p";
  animateOnView?: boolean;
}) {
  const reduce = useReducedMotionSafe();
  const words = text.split(" ");
  const trigger = animateOnView
    ? { whileInView: "show" as const, viewport: { once: true, margin: "0px 0px -10% 0px" } }
    : { animate: "show" as const };
  const MotionTag = motion[Tag];
  return (
    <MotionTag
      className={className}
      initial={reduce ? false : "hidden"}
      {...trigger}
      transition={{ staggerChildren: stagger, delayChildren: delay }}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
          <motion.span
            className={cn("inline-block will-change-transform", wordClassName)}
            variants={{
              hidden: { y: "110%", rotate: 4 },
              show: { y: "0%", rotate: 0, transition: { duration: 1, ease: EASE } },
            }}
          >
            {w}
          </motion.span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </MotionTag>
  );
}

/* ───────────── Scroll-linked word highlight ───────────── */
export function ScrollHighlight({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={cn("flex flex-wrap", className)}>
      {words.map((w, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
          {w}
        </Word>
      ))}
    </p>
  );
}

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <span className="relative mr-[0.25em]">
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
}

/* ───────────── Magnetic hover ───────────── */
export function Magnetic({ children, strength = 0.35, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 15, mass: 0.4 });
  const y = useSpring(0, { stiffness: 200, damping: 15, mass: 0.4 });
  const reduce = useReducedMotionSafe();
  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ───────────── Animated counter ───────────── */
export function Counter({ to, suffix = "", duration = 2, className, format }: { to: number; suffix?: string; duration?: number; className?: string; format?: (n: number) => string }) {
  const fmt = (n: number) => (format ? format(n) : `${Math.round(n)}${suffix}`);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduce = useReducedMotionSafe();
  useEffect(() => {
    if (!inView || !ref.current) return;
    if (reduce) {
      ref.current.textContent = fmt(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = fmt(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, to, suffix, duration, reduce]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {fmt(0)}
    </span>
  );
}

/* ───────────── Spotlight card ───────────── */
export function Spotlight({
  children,
  className,
  color = "rgb(248 48 63 / 0.18)",
  size = 420,
}: {
  children: ReactNode;
  className?: string;
  color?: string;
  size?: number;
}) {
  const mx = useMotionValue(-999);
  const my = useMotionValue(-999);
  const bg = useMotionTemplate`radial-gradient(${size}px circle at ${mx}px ${my}px, ${color}, transparent 70%)`;
  return (
    <div
      className={cn("group/spot relative overflow-hidden", className)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onPointerLeave={() => {
        mx.set(-999);
        my.set(-999);
      }}
    >
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100" style={{ background: bg }} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

/* ───────────── 3D tilt ───────────── */
export function Tilt({ children, className, max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const rx = useSpring(0, { stiffness: 150, damping: 18 });
  const ry = useSpring(0, { stiffness: 150, damping: 18 });
  const reduce = useReducedMotionSafe();
  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        onPointerMove={(e) => {
          if (reduce || e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          ry.set(px * max * 2);
          rx.set(-py * max * 2);
        }}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ───────────── Marquee ───────────── */
export function Marquee({
  children,
  className,
  duration = 40,
  reverse = false,
}: {
  children: ReactNode;
  className?: string;
  duration?: number;
  reverse?: boolean;
}) {
  return (
    <div className={cn("group/marquee flex overflow-hidden mask-fade-x", className)}>
      <div
        className="flex w-max shrink-0 animate-marquee gap-[inherit] group-hover/marquee:[animation-play-state:paused]"
        style={{ ["--marquee-duration" as string]: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
      >
        <div className="flex shrink-0 gap-[inherit]">{children}</div>
        <div className="flex shrink-0 gap-[inherit]" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Scroll progress bar ───────────── */
export function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div style={{ scaleX }} className={cn("fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-bean-500", className)} />;
}
