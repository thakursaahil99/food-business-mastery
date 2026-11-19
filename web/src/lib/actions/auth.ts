"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError, apiFetch, isMock, SESSION_COOKIE } from "../api/client";
import { mockUser } from "../api/mock";
import { isDirectLoginIdentifier, matchesSuperAdmin, safeEqual, signMockToken, superAdmin } from "../auth-config";
import { maskIdentifier, parseIdentifier } from "../utils";
import type { ActionResult, Role, User } from "../types";

const MOCK_OTP = "123456";
const RESEND_SECONDS = 30;
const ADMIN_ROLES: Role[] = ["admin", "super_admin", "coach"];

type RegisterInfo = { name: string; email: string };

type OtpRequested =
  | { direct: false; channel: "email" | "whatsapp"; masked: string; resendIn: number; devHint?: string }
  | { direct: true; redirectTo: string; firstName: string };

/** Only allow same-site relative redirects. */
function safeRedirect(path: string | null | undefined, fallback = "/student") {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}

async function setSession(token: string, remember: boolean) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
}

/** Who is logging in, in mock mode. The super admin's phone/email maps to the super admin. */
function resolveMockUser(identifier: string, register?: RegisterInfo): User {
  if (matchesSuperAdmin(identifier)) {
    return publicUser(superAdmin()!);
  }
  const base = mockUser(identifier);
  return register ? { ...base, id: Date.now() % 100000, name: register.name, email: register.email } : base;
}

/** Strip the password before the user goes anywhere near a cookie or the client. */
const publicUser = (u: User & { password?: string }): User => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, avatar: u.avatar });

const firstName = (u: User) => u.name.split(" ")[0] ?? "";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.email("Enter a valid email").trim().toLowerCase(),
});

export async function requestOtp(input: {
  identifier: string;
  remember?: boolean;
  redirectTo?: string | null;
  register?: RegisterInfo;
}): Promise<ActionResult<OtpRequested>> {
  const id = parseIdentifier(input.identifier);
  if (!id) return { ok: false, error: "Enter a valid email or 10-digit WhatsApp number." };
  if (input.register) {
    const r = registerSchema.safeParse(input.register);
    if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? "Check your details." };
    if (id.kind !== "phone") return { ok: false, error: "Enter your 10-digit WhatsApp number." };
  }

  // Dev bypass: listed numbers skip OTP entirely (mock mode only — with an API, Laravel decides).
  if (isMock && isDirectLoginIdentifier(input.identifier)) {
    const user = resolveMockUser(input.identifier, input.register);
    await setSession(signMockToken(user), input.remember ?? true);
    return { ok: true, data: { direct: true, redirectTo: safeRedirect(input.redirectTo), firstName: firstName(user) } };
  }

  const data = {
    direct: false as const,
    channel: id.kind === "email" ? ("email" as const) : ("whatsapp" as const),
    masked: maskIdentifier(id),
    resendIn: RESEND_SECONDS,
  };

  if (isMock) return { ok: true, data: { ...data, devHint: `Dev mode: use ${MOCK_OTP}` } };

  try {
    await apiFetch(input.register ? "/auth/register/otp" : "/auth/otp/request", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ identifier: id.value, ...(input.register ?? {}) }),
    });
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ApiError && e.status === 429) return { ok: false, error: "Too many attempts. Try again in a minute." };
    if (e instanceof ApiError && e.status === 404) return { ok: false, error: "No account found. Register first." };
    if (e instanceof ApiError && e.status === 409) return { ok: false, error: "An account already exists. Please log in." };
    return { ok: false, error: "Couldn't send the code. Please try again." };
  }
}

export async function verifyOtp(input: {
  identifier: string;
  code: string;
  remember: boolean;
  redirectTo?: string | null;
  register?: RegisterInfo;
}): Promise<ActionResult<{ redirectTo: string; firstName: string }>> {
  const id = parseIdentifier(input.identifier);
  if (!id || !/^\d{6}$/.test(input.code)) return { ok: false, error: "Enter the 6-digit code." };

  let token: string;
  let user: User;

  if (isMock) {
    if (input.code !== MOCK_OTP) return { ok: false, error: "That code isn't right. Check and try again." };
    user = resolveMockUser(input.identifier, input.register);
    token = signMockToken(user);
  } else {
    try {
      const res = await apiFetch<{ token: string; user: User }>(input.register ? "/auth/register/verify" : "/auth/otp/verify", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ identifier: id.value, code: input.code, device_name: "web", ...(input.register ?? {}) }),
      });
      token = res.token;
      user = res.user;
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) return { ok: false, error: "Too many wrong attempts. Request a new code." };
      return { ok: false, error: "That code isn't right or has expired." };
    }
  }

  await setSession(token, input.remember);
  return { ok: true, data: { redirectTo: safeRedirect(input.redirectTo), firstName: firstName(user) } };
}

/** Email + password login for the team (admin console). */
export async function adminLogin(input: {
  email: string;
  password: string;
  remember: boolean;
  redirectTo?: string | null;
}): Promise<ActionResult<{ redirectTo: string; firstName: string }>> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) return { ok: false, error: "Enter your email and password." };
  const generic = "Incorrect email or password.";

  let user: User;
  let token: string;

  if (isMock) {
    const sa = superAdmin();
    if (!sa) return { ok: false, error: "Admin login isn't configured. Set SUPER_ADMIN_* in .env.local." };
    // Compare both fields in constant time so a wrong email and a wrong password look the same.
    const okEmail = safeEqual(email, sa.email ?? "");
    const okPass = safeEqual(input.password, sa.password);
    if (!okEmail || !okPass) {
      await new Promise((r) => setTimeout(r, 400));
      return { ok: false, error: generic };
    }
    user = publicUser(sa);
    token = signMockToken(user);
  } else {
    try {
      const res = await apiFetch<{ token: string; user: User }>("/auth/admin/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({ email, password: input.password, device_name: "web-admin" }),
      });
      user = res.user;
      token = res.token;
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) return { ok: false, error: "Too many attempts. Try again later." };
      return { ok: false, error: generic };
    }
  }

  if (!ADMIN_ROLES.includes(user.role)) return { ok: false, error: "This account doesn't have admin access." };
  await setSession(token, input.remember);
  return { ok: true, data: { redirectTo: safeRedirect(input.redirectTo, "/admin"), firstName: firstName(user) } };
}

export async function logout(formData?: FormData) {
  if (!isMock) await apiFetch("/auth/logout", { method: "POST" }).catch(() => undefined);
  (await cookies()).delete(SESSION_COOKIE);
  redirect(formData?.get("to") === "/admin/login" ? "/admin/login" : "/login");
}
