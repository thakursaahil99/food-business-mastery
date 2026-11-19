import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official Red Bean Hospitality artwork, taken from redbeanhospitality.com (public/brand/):
 * - redbean-logo.png        full "Food for Happiness" badge, for light backgrounds (772×638)
 * - redbean-logo-white.png  same badge, black/grey recoloured to white for dark backgrounds (772×638)
 * - redbean-mark.png        the two beans only, cropped from the full logo, padded square (144×144)
 */
export const BRAND = {
  logo: { src: "/brand/redbean-logo.png", width: 772, height: 638 },
  logoWhite: { src: "/brand/redbean-logo-white.png", width: 772, height: 638 },
  mark: { src: "/brand/redbean-mark.png", width: 144, height: 144 },
} as const;

/** The two red beans from the Redbean logo. Size it with a `size-*` class. */
export function BeanMark({ className }: { className?: string }) {
  return (
    <Image
      src={BRAND.mark.src}
      width={BRAND.mark.width}
      height={BRAND.mark.height}
      alt=""
      aria-hidden
      className={cn("size-8 object-contain", className)}
    />
  );
}

/**
 * Full Red Bean Hospitality badge. `dark` switches to the white version for dark backgrounds.
 * `sub` adds an "Academy" label next to the badge. Set the badge height with `imgClassName` (default h-11).
 */
export function Logo({
  className,
  imgClassName,
  dark = false,
  sub = true,
  priority = false,
}: {
  className?: string;
  imgClassName?: string;
  dark?: boolean;
  sub?: boolean;
  priority?: boolean;
}) {
  const art = dark ? BRAND.logoWhite : BRAND.logo;
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src={art.src}
        width={art.width}
        height={art.height}
        alt="Red Bean Hospitality"
        priority={priority}
        className={cn("h-11 w-auto", imgClassName)}
      />
      {sub && (
        <span
          className={cn(
            "border-l pl-3 text-[0.65rem] font-semibold uppercase tracking-[0.28em]",
            dark ? "border-white/15 text-white/60" : "border-ink-900/10 text-ink-400",
          )}
        >
          Academy
        </span>
      )}
    </span>
  );
}
