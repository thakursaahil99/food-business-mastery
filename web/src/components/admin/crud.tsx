"use client";

/**
 * Shared create / edit / delete building blocks for the admin console:
 * a modal form, labelled fields, a delete confirmation and the Edit / Delete row buttons.
 * Every section (leads, students, batches, payments, classes, assignments, doubts, courses) uses these
 * so CRUD looks and behaves the same everywhere.
 */

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ───────── Modal ───────── */

export function Modal({ open, onClose, title, sub, children, footer, wide }: { open: boolean; onClose: () => void; title: string; sub?: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // createPortal needs document, which only exists after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>("input, select, textarea, button[data-autofocus]")?.focus(), 50);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="rb-themed fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-ink-950/50" />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal
            aria-labelledby={titleId}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2 }}
            className={cn("relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl", wide ? "sm:max-w-2xl" : "sm:max-w-lg")}
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
              <div>
                <h2 id={titleId} className="font-display text-lg font-semibold text-fg">
                  {title}
                </h2>
                {sub && <p className="mt-0.5 text-sm text-fg-muted">{sub}</p>}
              </div>
              <button onClick={onClose} className="grid size-9 shrink-0 place-items-center rounded-xl text-fg-muted hover:bg-surface-2 hover:text-fg" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6" data-lenis-prevent>
              {children}
            </div>
            {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 sm:flex-row sm:justify-end sm:px-6">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ───────── Fields ───────── */

const control = "mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] text-fg outline-none transition focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block text-sm font-medium text-fg", className)}>
      {label}
      {hint && <span className="font-normal text-fg-muted"> ({hint})</span>}
      {children}
    </label>
  );
}

export function TextInput({ label, hint, value, onChange, className, ...rest }: { label: string; hint?: string; value: string; onChange: (v: string) => void; className?: string } & Omit<React.ComponentProps<"input">, "value" | "onChange">) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={control} {...rest} />
    </Field>
  );
}

export function NumberInput({ label, hint, value, onChange, className, ...rest }: { label: string; hint?: string; value: number; onChange: (v: number) => void; className?: string } & Omit<React.ComponentProps<"input">, "value" | "onChange" | "type">) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input type="number" inputMode="numeric" value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(e.target.valueAsNumber)} className={cn(control, "tabular-nums")} {...rest} />
    </Field>
  );
}

export function TextArea({ label, hint, value, onChange, rows = 3, className, maxLength }: { label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number; className?: string; maxLength?: number }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} maxLength={maxLength} className={cn(control, "h-auto resize-y py-3")} />
    </Field>
  );
}

export function Select<T extends string | number>({ label, hint, value, onChange, options, className }: { label: string; hint?: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <select
        value={String(value)}
        onChange={(e) => {
          const o = options.find((x) => String(x.value) === e.target.value);
          if (o) onChange(o.value);
        }}
        className={control}
      >
        {options.map((o) => (
          <option key={String(o.value)} value={String(o.value)}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/* Dates: edited as IST wall-clock values, stored as UTC ISO strings. */
const IST_MS = 330 * 60_000;
export const isoToIstDate = (iso: string) => new Date(+new Date(iso) + IST_MS).toISOString().slice(0, 10);
export const isoToIstLocal = (iso: string) => new Date(+new Date(iso) + IST_MS).toISOString().slice(0, 16);
export const istDateToIso = (d: string, time = "00:00") => (d ? new Date(`${d}T${time}:00+05:30`).toISOString() : "");
export const istLocalToIso = (v: string) => (v ? new Date(`${v}:00+05:30`).toISOString() : "");

export function DateInput({ label, hint, value, onChange, className, min }: { label: string; hint?: string; value: string; onChange: (v: string) => void; className?: string; min?: string }) {
  return (
    <Field label={label} hint={hint} className={className}>
      <input type="date" value={value} min={min} onChange={(e) => onChange(e.target.value)} className={control} />
    </Field>
  );
}

export function DateTimeInput({ label, hint, value, onChange, className }: { label: string; hint?: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <Field label={label} hint={hint ?? "IST"} className={className}>
      <input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} className={control} />
    </Field>
  );
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl bg-bean-50 px-3.5 py-2.5 text-sm text-bean-700">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
    </p>
  );
}

/* ───────── Running an action ───────── */

/**
 * Runs a server action with a pending state, shows a toast, and refreshes the server data on success.
 * Returns `run`, which resolves to the action result so the caller can update local state.
 */
export function useAdminAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const run = <T,>(fn: () => Promise<ActionResult<T>>, success?: string, onOk?: (r: Extract<ActionResult<T>, { ok: true }>) => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) {
        setError(r.error);
        toast.error(r.error);
        return;
      }
      if (success) toast.success(success);
      onOk?.(r as Extract<ActionResult<T>, { ok: true }>);
      router.refresh();
    });
  return { pending, error, setError, run };
}

/** Save / Cancel footer for a form modal. */
export function FormFooter({ onCancel, onSave, pending, saveLabel = "Save" }: { onCancel: () => void; onSave: () => void; pending: boolean; saveLabel?: string }) {
  return (
    <>
      <Button variant="outline" onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
      <Button onClick={onSave} disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        {saveLabel}
      </Button>
    </>
  );
}

/* ───────── Delete confirmation ───────── */

export function ConfirmDelete({
  open,
  onClose,
  onConfirm,
  pending,
  title,
  body,
  confirmLabel = "Delete",
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  error?: string | null;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={pending} data-autofocus>
            Keep it
          </Button>
          <button onClick={onConfirm} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-bean-600 px-5 text-sm font-medium text-white transition-colors hover:bg-bean-500 disabled:opacity-50">
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-bean-50 text-bean-600">
          <Trash2 className="size-5" />
        </span>
        <div className="text-sm text-fg">{body}</div>
      </div>
      <FormError error={error ?? null} />
    </Modal>
  );
}

/* ───────── Buttons ───────── */

export function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <Button size="md" onClick={onClick}>
      <Plus /> {children}
    </Button>
  );
}

/** Labelled Edit + Delete buttons for a row or card. Stops the click from opening the row. */
export function RowActions({ onEdit, onDelete, dark, className, editLabel = "Edit", deleteLabel = "Delete" }: { onEdit?: () => void; onDelete?: () => void; dark?: boolean; className?: string; editLabel?: string; deleteLabel?: string }) {
  const base = "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors";
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} onClick={(e) => e.stopPropagation()}>
      {onEdit && (
        <button type="button" onClick={onEdit} className={cn(base, dark ? "border-white/15 text-white/80 hover:bg-white/10 hover:text-white" : "border-line bg-surface text-fg hover:bg-surface-2")}>
          <Pencil className="size-3.5" /> {editLabel}
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className={cn(base, dark ? "border-white/15 text-white/70 hover:bg-bean-600/30 hover:text-white" : "border-line bg-surface text-fg-muted hover:border-bean-200 hover:bg-bean-50 hover:text-bean-700")}>
          <Trash2 className="size-3.5" /> {deleteLabel}
        </button>
      )}
    </span>
  );
}
