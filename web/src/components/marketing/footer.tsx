import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/ui/logo";
import { brand, nav } from "@/content/site";

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink-950 pt-24 text-white grain">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-12 px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo dark imgClassName="h-20" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/55">
            {brand.tagline}. A {brand.company} initiative led by {brand.coach}.
          </p>
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">Explore</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-white/70 transition-colors hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-[0.2em] text-white/40">Academy</h4>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/programs/cgr-mastery" className="text-white/70 hover:text-white">CGR Mastery Program</Link></li>
            <li><Link href="/apply" className="text-white/70 hover:text-white">Apply for workshop</Link></li>
            <li><Link href="/login" className="text-white/70 hover:text-white">Student login</Link></li>
            <li><a href={`mailto:${brand.email}`} className="text-white/70 hover:text-white">{brand.email}</a></li>
          </ul>
        </div>
      </div>

      {/* Giant outlined wordmark that fills on hover */}
      <div className="group relative mt-20 select-none overflow-hidden" aria-hidden>
        <div className="font-display translate-y-[18%] text-center text-[25vw] font-extrabold leading-none tracking-tighter text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.12)] transition-all duration-1000 group-hover:[-webkit-text-stroke:1px_rgb(248_48_63/0.6)]">
          redbean
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bean-600/25 to-transparent opacity-0 blur-2xl transition-opacity duration-1000 group-hover:opacity-100" />
      </div>

      <div className="relative z-10 border-t border-white/8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-white/40 sm:flex-row">
          <span>© <Year /> {brand.company}. All rights reserved.</span>
          <span>Made in India · Built for food entrepreneurs</span>
        </div>
      </div>
    </footer>
  );
}

async function Year() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}
