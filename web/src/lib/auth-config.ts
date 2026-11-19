import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { User } from "./types";
import { parseIdentifier } from "./utils";

/**
 * Dev / pre-backend auth configuration. Everything comes from env (.env.local), never source.
 * Once the Laravel API is connected (API_URL set), these are ignored and Laravel owns auth.
 */

const env = (k: string) => process.env[k]?.trim() || "";

/** OTP bypass for listed numbers. Requires ENABLE_DEV_LOGIN=true so it can't leak into prod by accident. */
export function isDirectLoginIdentifier(identifier: string) {
  if (env("ENABLE_DEV_LOGIN") !== "true") return false;
  const id = parseIdentifier(identifier);
  if (!id) return false;
  const list = env("DEV_DIRECT_LOGIN").split(",").map((s) => parseIdentifier(s)?.value).filter(Boolean);
  return list.includes(id.value);
}

export function superAdmin(): (User & { password: string }) | null {
  const email = env("SUPER_ADMIN_EMAIL").toLowerCase();
  const password = env("SUPER_ADMIN_PASSWORD");
  if (!email || !password) return null;
  const phone = parseIdentifier(env("SUPER_ADMIN_PHONE"))?.value ?? null;
  return { id: 1, name: env("SUPER_ADMIN_NAME") || "Super Admin", email, phone, role: "super_admin", avatar: null, password };
}

/** Is this identifier (email or phone) the super admin's? */
export function matchesSuperAdmin(identifier: string) {
  const sa = superAdmin();
  const id = parseIdentifier(identifier);
  if (!sa || !id) return false;
  return id.kind === "email" ? id.value === sa.email : id.value === sa.phone;
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/* ───────── Signed mock session tokens: mock.<payload>.<hmac> ───────── */

function secret() {
  const s = env("SESSION_SECRET");
  if (s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET (16+ chars) is required in production");
  return "dev-only-insecure-session-secret";
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function signMockToken(user: User) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `mock.${payload}.${sign(payload)}`;
}

export function verifyMockToken(token: string): User | null {
  const [prefix, payload, sig] = token.split(".");
  if (prefix !== "mock" || !payload || !sig || !safeEqual(sig, sign(payload))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as User;
  } catch {
    return null;
  }
}
