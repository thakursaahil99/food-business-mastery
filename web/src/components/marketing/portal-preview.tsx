import { CalendarDays, GraduationCap, LayoutGrid, PlayCircle, Radio, Wallet } from "lucide-react";
import { BeanMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

/** A static drawing of the student portal, used as product imagery on the marketing site. */
export function PortalPreview({ className }: { className?: string }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <div className={cn("overflow-hidden rounded-[22px] border border-white/10 bg-ink-900 text-left shadow-[0_60px_120px_-30px_rgb(224_20_38/0.35),0_30px_60px_-30px_rgb(0_0_0/0.8)]", className)}>
      {/* window chrome */}
      <div className="flex items-center gap-2 border-b border-white/8 bg-ink-800/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <div className="mx-auto rounded-md bg-white/5 px-10 py-1 text-[10px] text-white/40">academy.redbean · /student</div>
      </div>
      <div className="grid grid-cols-[52px_1fr] sm:grid-cols-[170px_1fr]">
        {/* sidebar */}
        <aside className="border-r border-white/8 p-3">
          <div className="mb-6 flex items-center gap-2 px-1">
            <BeanMark className="size-6" />
            <span className="hidden text-xs font-semibold text-white sm:inline">Red Bean</span>
          </div>
          {[
            [LayoutGrid, "Dashboard", true],
            [CalendarDays, "Schedule", false],
            [PlayCircle, "Learn", false],
            [Wallet, "Payments", false],
            [GraduationCap, "Certificate", false],
          ].map(([Icon, label, active], i) => {
            const I = Icon as typeof LayoutGrid;
            return (
              <div key={i} className={cn("mb-1 flex items-center gap-2.5 rounded-lg px-2 py-2 text-[11px]", active ? "bg-bean-600/15 text-bean-300" : "text-white/40")}>
                <I className="size-3.5 shrink-0" />
                <span className="hidden sm:inline">{label as string}</span>
              </div>
            );
          })}
        </aside>
        {/* content */}
        <div className="space-y-3 p-3 sm:p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] text-white/40">Good evening</div>
              <div className="font-display text-sm font-semibold text-white sm:text-lg">Rohit, week 7 of 16</div>
            </div>
            <div className="hidden rounded-full border border-white/10 px-2.5 py-1 text-[10px] text-white/50 sm:block">Batch 07</div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr]">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bean-600 to-bean-900 p-4">
              <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10 blur-xl" />
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/80">
                <span className="relative flex size-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-white" />
                  <span className="relative size-1.5 rounded-full bg-white" />
                </span>
                Live now
              </div>
              <div className="mt-2 text-sm font-semibold text-white sm:text-base">Live Q&A: Your compliance doubts</div>
              <div className="mt-1 text-[10px] text-white/70">Bobby Singh · 7:00 PM IST · 90 min</div>
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[10px] font-semibold text-bean-700">
                <Radio className="size-3" /> Join class
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Progress</div>
                <div className="relative mx-auto mt-2 size-14">
                  <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(255 255 255 / .08)" strokeWidth="3.5" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#f8303f" strokeWidth="3.5" strokeDasharray="94.2" strokeDashoffset="56" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold text-white">41%</span>
                </div>
              </div>
              <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Attendance</div>
                <div className="font-display mt-2 text-2xl font-semibold text-white">87%</div>
                <div className="mt-2 flex h-6 items-end gap-0.5">
                  {[60, 80, 70, 100, 90, 40, 100].map((h, i) => (
                    <span key={i} className="flex-1 rounded-sm bg-bean-500/70" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <div className="mb-2 text-[10px] uppercase tracking-wider text-white/40">This week</div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d, i) => (
                <div key={d} className={cn("rounded-lg p-1.5 text-center", i === 2 ? "bg-bean-600 text-white" : "bg-white/[0.03] text-white/50")}>
                  <div className="text-[9px]">{d}</div>
                  <div className="text-xs font-semibold">{18 + i}</div>
                  <div className="mx-auto mt-1 flex justify-center gap-0.5">
                    {(i === 1 || i === 3 || i === 5) && <span className="size-1 rounded-full bg-bean-400" />}
                    {i === 2 && <span className="size-1 rounded-full bg-white" />}
                    {i === 4 && <span className="size-1 rounded-full bg-gold-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
