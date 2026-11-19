"use client";

import Link from "next/link";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuccessCheck } from "@/components/marketing/apply-form";
import { adminLogin } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { EASE } from "@/components/motion/primitives";

export function AdminLoginForm() {
  const router = useRouter();
  const redirectTo = useSearchParams().get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [scope, animate] = useAnimate<HTMLFormElement>();
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await adminLogin({ email, password, remember, redirectTo });
      if (!res.ok) {
        setError(res.error);
        if (scope.current) animate(scope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.45 });
        return;
      }
      setDone(res.data.firstName);
      setTimeout(() => router.replace(res.data.redirectTo), 1000);
    });

  const field = "h-14 w-full rounded-2xl border bg-white pl-12 text-[15px] text-ink-900 outline-none transition-all duration-300 placeholder:text-ink-300 focus:border-ink-900 focus:ring-4 focus:ring-ink-900/10";

  return (
    <div className="w-full max-w-[420px]">
      <AnimatePresence mode="wait" initial={false}>
        {done === null ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: 16 }}
            ref={scope}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.45, ease: EASE }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!pending) submit();
            }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
              <ShieldCheck className="size-3.5 text-bean-400" /> Team access
            </span>
            <h1 className="font-display mt-5 text-4xl font-bold tracking-tight text-ink-900">Admin console</h1>
            <p className="mt-2 text-ink-400">Sign in with your Redbean team account</p>

            <label htmlFor="admin-email" className="mt-10 block text-sm font-medium text-ink-700">Email</label>
            <div className="group relative mt-2">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-300 group-focus-within:text-ink-900" />
              <input id="admin-email" type="email" autoComplete="username" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }} placeholder="you@redbean.in" className={cn(field, "pr-4", error ? "border-bean-500" : "border-ink-100")} />
            </div>

            <label htmlFor="admin-password" className="mt-4 block text-sm font-medium text-ink-700">Password</label>
            <div className="group relative mt-2">
              <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-300 group-focus-within:text-ink-900" />
              <input id="admin-password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(null); }} placeholder="••••••••" className={cn(field, "pr-12", error ? "border-bean-500" : "border-ink-100")} />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-xl text-ink-400 hover:bg-cream-100 hover:text-ink-900" aria-label={show ? "Hide password" : "Show password"}>
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p role="alert" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="pt-3 text-sm text-bean-600">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <label className="mt-5 flex w-fit cursor-pointer select-none items-center gap-2.5 text-sm text-ink-700">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-ink-900" />
              Keep me signed in for 30 days
            </label>

            <Button type="submit" variant="dark" size="lg" disabled={!email || !password || pending} className="mt-8 w-full">
              {pending ? <Loader2 className="animate-spin" /> : null}
              {pending ? "Signing in…" : "Sign in"}
              {!pending && <ArrowRight className="transition-transform group-hover/btn:translate-x-1" />}
            </Button>

            <p className="mt-8 text-center text-sm text-ink-400">
              Student?{" "}
              <Link href="/login" className="font-medium text-bean-600 underline-offset-4 hover:underline">
                Log in with OTP
              </Link>
            </p>
          </motion.form>
        ) : (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-10 text-center">
            <SuccessCheck />
            <h1 className="font-display mt-8 text-3xl font-bold tracking-tight text-ink-900">Welcome{done ? `, ${done}` : ""}!</h1>
            <p className="mt-2 text-ink-400">Opening the admin console…</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
