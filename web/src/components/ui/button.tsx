import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full font-medium transition-[transform,background-color,color,box-shadow,opacity] duration-300 ease-[cubic-bezier(.16,1,.3,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bean-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-bean-600 text-white shadow-[0_8px_30px_-8px_rgb(var(--accent-rgb)/0.65),inset_0_1px_0_rgb(255_255_255/0.25)] hover:bg-bean-500 hover:shadow-[0_14px_40px_-8px_rgb(var(--accent-rgb)/0.8),inset_0_1px_0_rgb(255_255_255/0.3)]",
        light: "bg-white text-ink-900 shadow-[0_8px_30px_-12px_rgb(0_0_0/0.4)] hover:bg-cream-100",
        dark: "bg-ink-900 text-white hover:bg-ink-700",
        outline: "border border-line-strong bg-transparent text-fg hover:bg-surface-2",
        ghostDark: "border border-white/15 bg-white/5 text-white backdrop-blur-md hover:bg-white/12 hover:border-white/25",
        ghost: "text-fg hover:bg-surface-2",
        success: "bg-emerald-600 text-white hover:bg-emerald-500",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-14 px-7 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

/** Sheen that sweeps across on hover. Put inside a primary button. */
function Sheen() {
  return (
    <span
      data-sheen
      aria-hidden
      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-all duration-700 ease-out group-hover/btn:left-[120%] group-hover/btn:opacity-100"
    />
  );
}

type Variants = VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, children, ...props }: ComponentProps<"button"> & Variants) {
  return (
    <button data-variant={variant ?? "primary"} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {variant === "primary" || variant === undefined ? <Sheen /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({ className, variant, size, children, ...props }: ComponentProps<typeof Link> & Variants) {
  return (
    <Link data-variant={variant ?? "primary"} className={cn(buttonVariants({ variant, size }), className)} {...props}>
      {variant === "primary" || variant === undefined ? <Sheen /> : null}
      {children}
    </Link>
  );
}
