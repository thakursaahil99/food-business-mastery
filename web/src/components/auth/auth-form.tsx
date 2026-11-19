"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, MessageCircle, Phone, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "./otp-input";
import { SuccessCheck } from "@/components/marketing/apply-form";
import { requestOtp, verifyOtp } from "@/lib/actions/auth";
import { cn, parseIdentifier } from "@/lib/utils";
import { EASE } from "@/components/motion/primitives";

type Mode = "login" | "register";
type Step = "identify" | "verify" | "done";
const REMEMBER_KEY = "rb_last_identifier";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Flat primary button (no glow, no sheen) to match the portal's calm style. */
const CALM_BUTTON = "shadow-none hover:shadow-none [&_[data-sheen]]:hidden";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect");
  const isRegister = mode === "register";

  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [remember, setRemember] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ channel: "email" | "whatsapp"; masked: string; devHint?: string } | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [pending, start] = useTransition();

  const parsed = parseIdentifier(identifier);
  const isPhone = parsed?.kind === "phone";
  const valid = isRegister ? name.trim().length >= 2 && EMAIL_RE.test(email.trim()) && isPhone : !!parsed;
  const register = isRegister ? { name: name.trim(), email: email.trim() } : undefined;

  useEffect(() => {
    if (isRegister) return;
    try {
      const last = localStorage.getItem(REMEMBER_KEY);
      // Restoring a remembered value from an external store on mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (last) setIdentifier(last);
    } catch {}
  }, [isRegister]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const finish = (to: string, first: string) => {
    setFirstName(first);
    setStep("done");
    setTimeout(() => router.replace(to), 1100);
  };

  const send = () =>
    start(async () => {
      setError(null);
      const res = await requestOtp({ identifier, remember, redirectTo, register });
      if (!res.ok) return setError(res.error);
      try {
        if (remember && !isRegister) localStorage.setItem(REMEMBER_KEY, identifier);
        else if (!remember) localStorage.removeItem(REMEMBER_KEY);
      } catch {}
      if (res.data.direct) return finish(res.data.redirectTo, res.data.firstName);
      setMeta(res.data);
      setResendIn(res.data.resendIn);
      setCode("");
      setStep("verify");
    });

  const verify = (c: string) =>
    start(async () => {
      setError(null);
      const res = await verifyOtp({ identifier, code: c, remember, redirectTo, register });
      if (!res.ok) {
        setError(res.error);
        setCode("");
        return;
      }
      finish(res.data.redirectTo, res.data.firstName);
    });

  return (
    <div className="relative w-full max-w-[420px]">
      <AnimatePresence mode="wait" initial={false}>
        {step === "identify" && (
          <motion.form
            key="identify"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: EASE }}
            onSubmit={(e) => {
              e.preventDefault();
              if (valid && !pending) send();
            }}
          >
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900">{isRegister ? "Create your account" : "Welcome back"}</h1>
            <p className="mt-2 text-ink-400">{isRegister ? "Join Redbean Academy. We'll verify your WhatsApp number." : "Sign in with your email or WhatsApp number"}</p>

            <div className="mt-10 space-y-4">
              {isRegister && (
                <>
                  <IconField id="name" label="Full name" icon={<UserIcon className="size-5" />} value={name} onChange={(v) => { setName(v); setError(null); }} autoComplete="name" autoFocus placeholder="Your full name" />
                  <IconField id="email" label="Email" icon={<Mail className="size-5" />} value={email} onChange={(v) => { setEmail(v); setError(null); }} autoComplete="email" type="email" placeholder="you@example.com" />
                </>
              )}
              <IconField
                id="identifier"
                label={isRegister ? "WhatsApp number" : "Email or WhatsApp number"}
                icon={
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span key={isPhone || isRegister ? "p" : "m"} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="block">
                      {isPhone || isRegister ? <Phone className="size-5" /> : <Mail className="size-5" />}
                    </motion.span>
                  </AnimatePresence>
                }
                value={identifier}
                onChange={(v) => { setIdentifier(v); setError(null); }}
                autoComplete={isRegister ? "tel" : "username"}
                autoFocus={!isRegister}
                inputMode={isRegister ? "tel" : undefined}
                placeholder={isRegister ? "98765 43210" : "you@example.com or 98765 43210"}
                error={!!error}
                badge={parsed ? (isPhone ? "WhatsApp" : "Email") : undefined}
              />
            </div>

            <ErrorLine error={error} />

            <label className="mt-5 flex w-fit cursor-pointer select-none items-center gap-2.5 text-sm text-ink-700">
              <span className="relative grid size-5 place-items-center">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="peer size-5 cursor-pointer appearance-none rounded-full border-2 border-ink-200 transition-colors checked:border-bean-600 checked:bg-bean-600" />
                <svg viewBox="0 0 12 12" className="pointer-events-none absolute size-3 text-white opacity-0 peer-checked:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2.5 6.2l2.3 2.3 4.7-4.9" />
                </svg>
              </span>
              Remember me
            </label>

            <Button type="submit" size="lg" disabled={!valid || pending} className={cn("mt-8 w-full", CALM_BUTTON)}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {pending ? "Please wait…" : isRegister ? "Create account" : "Continue with OTP"}
              {!pending && <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />}
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
              <Lock className="size-3.5" aria-hidden />
              No password needed. We’ll send a one-time code.
            </p>

            <div className="mt-8 border-t border-ink-100" />
            <p className="mt-6 text-center text-sm text-ink-400">
              {isRegister ? "Already have an account? " : "New to Redbean? "}
              <Link href={isRegister ? "/login" : "/register"} className="font-medium text-bean-600 underline-offset-4 hover:underline">
                {isRegister ? "Log in" : "Create an account"}
              </Link>
            </p>
            {!isRegister && (
              <p className="mt-3 text-center text-xs text-ink-300">
                Redbean team?{" "}
                <Link href="/admin/login" className="text-ink-500 underline-offset-4 hover:text-ink-900 hover:underline">
                  Admin login
                </Link>
              </p>
            )}
          </motion.form>
        )}

        {step === "verify" && meta && (
          <motion.div key="verify" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30, filter: "blur(4px)" }} transition={{ duration: 0.45, ease: EASE }}>
            <button onClick={() => { setStep("identify"); setError(null); }} className="group mb-8 inline-flex items-center gap-1.5 text-sm text-ink-400 transition-colors hover:text-ink-900">
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" /> Change
            </button>
            <div className={cn("grid size-14 place-items-center rounded-2xl", meta.channel === "whatsapp" ? "bg-emerald-50 text-emerald-600" : "bg-bean-50 text-bean-600")}>
              {meta.channel === "whatsapp" ? <MessageCircle className="size-6" /> : <Mail className="size-6" />}
            </div>
            <h1 className="font-display mt-6 text-4xl font-bold tracking-tight text-ink-900">Enter the code</h1>
            <p className="mt-2 text-ink-400">
              We sent a 6-digit code to your {meta.channel === "whatsapp" ? "WhatsApp" : "email"} <span className="font-medium text-ink-900">{meta.masked}</span>
            </p>
            {meta.devHint && <p className="mt-3 inline-block rounded-lg bg-gold-400/20 px-3 py-1.5 font-mono text-xs text-ink-700">{meta.devHint}</p>}

            <div className="mt-8">
              <OtpInput value={code} onChange={(v) => { setCode(v); setError(null); }} onComplete={verify} error={!!error} disabled={pending} />
            </div>
            <ErrorLine error={error} />

            <Button size="lg" className={cn("mt-8 w-full", CALM_BUTTON)} disabled={code.length !== 6 || pending} onClick={() => verify(code)}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              {pending ? "Verifying…" : isRegister ? "Verify & create account" : "Verify & sign in"}
            </Button>

            <div className="mt-6 text-center text-sm text-ink-400">
              {resendIn > 0 ? (
                <span>
                  Resend code in <span className="font-mono tabular-nums text-ink-700">0:{String(resendIn).padStart(2, "0")}</span>
                </span>
              ) : (
                <button onClick={send} disabled={pending} className="font-medium text-bean-600 underline-offset-4 hover:underline">
                  Resend code
                </button>
              )}
            </div>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 text-center">
            <SuccessCheck />
            <h1 className="font-display mt-8 text-3xl font-bold tracking-tight text-ink-900">
              {isRegister ? "You're in" : "Welcome"}
              {firstName ? `, ${firstName}` : ""}!
            </h1>
            <p className="mt-2 text-ink-400">Taking you to your academy…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconField({
  id,
  label,
  icon,
  value,
  onChange,
  error,
  badge,
  ...rest
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
  badge?: string;
} & Omit<React.ComponentProps<"input">, "onChange" | "value" | "id">) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-700">
        {label}
      </label>
      <div className="group relative mt-2">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-300 transition-colors group-focus-within:text-bean-500">{icon}</span>
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            // Reserve room for the WhatsApp/Email badge only while it shows, so the placeholder isn't cut off on phones.
            "h-14 w-full rounded-2xl border bg-white pl-12 text-[15px] text-ink-900 outline-none transition-all duration-300 placeholder:text-ink-300",
            badge ? "pr-24" : "pr-4",
            "focus:border-bean-500 focus:ring-4 focus:ring-bean-500/10",
            error ? "border-bean-500" : "border-ink-100",
          )}
          {...rest}
        />
        <AnimatePresence>
          {badge && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn("absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2.5 py-1 text-[11px] font-medium", badge === "WhatsApp" ? "bg-emerald-50 text-emerald-700" : "bg-bean-50 text-bean-700")}
            >
              {badge}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ErrorLine({ error }: { error: string | null }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.p role="alert" initial={{ opacity: 0, height: 0, marginTop: 0 }} animate={{ opacity: 1, height: "auto", marginTop: 10 }} exit={{ opacity: 0, height: 0, marginTop: 0 }} className="text-sm text-bean-600">
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
