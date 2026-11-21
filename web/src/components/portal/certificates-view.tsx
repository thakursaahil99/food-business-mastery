"use client";

import Image from "next/image";
import { Award, Check, Copy, Download, GraduationCap, Printer } from "lucide-react";
import { toast } from "sonner";
import { useT, useFmt } from "@/components/i18n";
import { Button } from "@/components/ui/button";
import type { CertificateEntry, CertificateStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState, PageHeader, Section, StatusPill, card } from "./ui";

export function CertificatesView({ entries, studentName }: { entries: CertificateEntry[]; studentName: string }) {
  const { t } = useT();
  const T = t.certificates;
  const earned = entries.filter((e) => e.status === "earned" && e.certificate);
  const pending = entries.filter((e) => e.status !== "earned");

  return (
    <div className="space-y-7">
      <PageHeader icon={GraduationCap} title={T.title} sub={T.sub} />

      {entries.length === 0 && <EmptyState icon={Award} title={T.empty} />}

      {earned.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-fg">{T.earned}</h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {earned.map((e) => (
              <EarnedCard key={e.course.slug} entry={e} fallbackName={studentName} />
            ))}
          </div>
        </section>
      )}

      {pending.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-fg">{T.pending}</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {pending.map((e) => (
              <PendingCard key={e.course.slug} entry={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EarnedCard({ entry, fallbackName }: { entry: CertificateEntry; fallbackName: string }) {
  const { t } = useT();
  const { fmtDate } = useFmt();
  const T = t.certificates;
  const c = entry.certificate!;
  const id = `cert-${c.code}`;

  /** Prints only this certificate (A4 landscape): see .rb-printing in globals.css. */
  const print = () => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("rb-print-me");
    document.body.classList.add("rb-printing");
    const done = () => {
      el.classList.remove("rb-print-me");
      document.body.classList.remove("rb-printing");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  const copy = async (text: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(ok);
    } catch {
      window.prompt(T.copy, text);
    }
  };

  return (
    <article className={cn(card, "space-y-4 p-4 sm:p-5")}>
      <CertificateSheet id={id} name={c.studentName || fallbackName} course={c.courseTitle} batch={entry.course.batchName} issued={fmtDate(c.issuedAt)} code={c.code} />
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill tone="good" icon={Check}>{T.earnedPill}</StatusPill>
        <span className="text-sm text-fg-muted">
          {T.code}: <span className="font-mono font-semibold text-fg">{c.code}</span>
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {c.url ? (
          <Button size="lg" className="w-full shadow-none hover:shadow-none" onClick={() => window.open(c.url!, "_blank", "noopener")}>
            <Download /> {T.download}
          </Button>
        ) : (
          <Button size="lg" className="w-full shadow-none hover:shadow-none" onClick={print}>
            <Printer /> {T.print}
          </Button>
        )}
        <Button size="lg" variant="outline" className="w-full" onClick={() => (c.url ? copy(c.url, T.copied) : copy(c.code, T.codeCopied))}>
          <Copy /> {c.url ? T.copy : T.copyCode}
        </Button>
      </div>
    </article>
  );
}

/** The certificate itself. Keeps A4 landscape proportions; text scales with its width (container units). */
function CertificateSheet({ id, name, course, batch, issued, code }: { id: string; name: string; course: string; batch: string | null; issued: string; code: string }) {
  const { t } = useT();
  const T = t.certificates;
  return (
    <div id={id} className="rb-cert relative aspect-[297/210] w-full overflow-hidden rounded-lg bg-[#fdfbf8] text-ink-950 shadow-[0_18px_40px_-24px_rgb(0_0_0/0.35)] [container-type:inline-size]" aria-label={`${T.kicker}: ${name}, ${course}`}>
      <Image src="/brand/redbean-mark.png" alt="" aria-hidden width={240} height={240} className="pointer-events-none absolute -bottom-[8cqw] -right-[6cqw] w-[34cqw] rotate-[-24deg] opacity-[0.06]" />
      <Image src="/brand/redbean-mark.png" alt="" aria-hidden width={160} height={160} className="pointer-events-none absolute -left-[4cqw] -top-[5cqw] w-[20cqw] rotate-[30deg] opacity-[0.06]" />
      <div className="absolute inset-[2.2cqw] border-[0.35cqw] border-bean-600">
        <div className="absolute inset-[0.8cqw] border-[0.12cqw] border-[#b8862f]" />
      </div>
      <div className="absolute inset-[5cqw_7cqw] flex flex-col items-center text-center">
        <Image src="/brand/redbean-logo.png" alt="Red Bean Hospitality" width={240} height={240} className="h-auto w-[13cqw]" />
        <div className="mt-[1.4cqw] font-bold uppercase text-[#b8862f]" style={{ fontSize: "1.35cqw", letterSpacing: "0.5cqw" }}>
          Redbean Academy
        </div>
        <div className="mt-[0.5cqw] font-serif font-bold" style={{ fontSize: "4.2cqw" }}>
          {T.kicker}
        </div>
        <div className="mt-[1.6cqw] text-ink-500" style={{ fontSize: "1.55cqw" }}>
          {T.certify}
        </div>
        <div className="mt-[0.5cqw] border-b-[0.12cqw] border-[#d9d2c5] px-[3cqw] pb-[0.8cqw] font-serif italic leading-tight text-bean-700" style={{ fontSize: "5cqw" }}>
          {name}
        </div>
        <div className="mt-[1.4cqw] text-ink-500" style={{ fontSize: "1.55cqw" }}>
          {T.completed}
        </div>
        <div className="mt-[0.4cqw] font-bold" style={{ fontSize: "2.3cqw" }}>
          {course}
        </div>
        <div className="text-ink-500" style={{ fontSize: "1.45cqw" }}>
          {batch ? `${batch} · ` : ""}
          {T.issued(issued)}
        </div>
        <div className="mt-auto grid w-full grid-cols-[1fr_auto_1fr] items-end gap-[3cqw]">
          <Signature name="Bobby Singh" role={T.md} />
          <div className="text-center font-mono text-ink-500" style={{ fontSize: "1.2cqw", letterSpacing: "0.1cqw" }}>
            <div className="mx-auto mb-[0.6cqw] grid size-[6cqw] place-items-center rounded-full border-[0.2cqw] border-[#b8862f] text-[#b8862f]">
              <Award className="size-[3.4cqw]" strokeWidth={1.5} />
            </div>
            {code}
          </div>
          <Signature name="Redbean Academy" role="Academic team" />
        </div>
      </div>
    </div>
  );
}

function Signature({ name, role }: { name: string; role: string }) {
  return (
    <div className="text-center text-ink-500" style={{ fontSize: "1.25cqw" }}>
      <div className="mx-auto mb-[0.6cqw] w-[20cqw] border-t-[0.12cqw] border-ink-900 pt-[0.6cqw] font-serif italic text-ink-950" style={{ fontSize: "1.9cqw" }}>
        {name}
      </div>
      {role}
    </div>
  );
}

function PendingCard({ entry }: { entry: CertificateEntry }) {
  const { t } = useT();
  const T = t.certificates;
  const total = entry.steps.length;
  return (
    <Section title={entry.course.title} icon={Award} action={<span className="text-sm font-semibold text-fg-muted">{T.stepsDone(entry.stepsDone, total)}</span>}>
      <div className="mb-4 h-3 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={entry.stepsDone} aria-valuemin={0} aria-valuemax={total}>
        <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${(entry.stepsDone / total) * 100}%` }} />
      </div>
      <ol className="space-y-2">
        {entry.steps.map((s) => (
          <StepRow key={s.key} step={s} />
        ))}
      </ol>
    </Section>
  );
}

function StepRow({ step: s }: { step: CertificateStep }) {
  const { t } = useT();
  const T = t.certificates;
  const count = s.key === "final" ? null : s.unit === "%" ? T.now(s.current) : s.total > 0 ? T.of(s.current, s.total) : null;
  const hint = !s.done && s.key === "final" ? T.finalHint : null;
  return (
    <li className={cn("flex items-start gap-3 rounded-2xl p-3", s.done ? "bg-emerald-50" : "bg-surface-2/60")}>
      <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-full", s.done ? "bg-emerald-600 text-white" : "border-2 border-line-strong")}>
        {s.done && <Check className="size-4" strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span className={cn("block text-base", s.done ? "font-medium text-emerald-900" : "text-fg")}>{T.steps[s.key] ?? s.label}</span>
        {(count || hint) && <span className="text-sm text-fg-muted">{[count, hint].filter(Boolean).join(" · ")}</span>}
      </span>
    </li>
  );
}
