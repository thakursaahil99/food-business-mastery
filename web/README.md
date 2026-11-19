# Redbean Academy · Web

Marketing site + student portal for Redbean Academy. Next.js 16 (App Router, Cache Components), React 19.3, Tailwind v4, Motion, Lenis.

## Run

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

With `API_URL` empty the portal runs on **mock data**. Log in at `/login` with any email or 10-digit Indian mobile number and OTP **123456**.

Numbers listed in `DEV_DIRECT_LOGIN` (with `ENABLE_DEV_LOGIN=true`) skip the OTP. The super admin (`SUPER_ADMIN_*` in `.env.local`) signs in at `/admin/login` with email + password and can use both the admin console and the student portal.

## Routes

| Route | What |
|---|---|
| `/` | Home: hero with scroll-tilted product shot, CGR pillars, sticky curriculum timeline, pinned horizontal app showcase, FAQ, apply form |
| `/programs/cgr-mastery` | Program landing page (SEO) |
| `/apply` | Lead form → `submitLead` server action → `POST /leads` |
| `/login` | Passwordless OTP (email or WhatsApp), remember-me, redirect back |
| `/register` | Student sign-up (name, email, WhatsApp) → OTP |
| `/admin/login` | Team login (email + password) |
| `/admin` | Admin console: overview (revenue, funnel), leads, students, schedule, batches, payments |
| `/student` | Dashboard: next class + countdown, progress, attendance, payments, journey |
| `/student/schedule` | List (grouped by day) + FullCalendar (day/week/month), filters, .ics / Google Calendar |
| `/student/learn` | Modules → lessons, continue watching |
| `/student/payments` | Instalment plan, pay now (Razorpay later), invoices |
| `/student/class/[id]` | Pre-join lobby (camera/mic check) → LiveKit room (later) |

## Where things live

- `src/lib/api/` — `client.ts` (BFF fetch with httpOnly Sanctum token), `data.ts` (server data functions), `mock.ts`
- `src/lib/actions/` — server actions: auth (OTP), lead, session join
- `src/lib/join-window.ts` — join opens 10 min before start (UI hint; the API re-checks)
- `src/components/motion/primitives.tsx` — Reveal, Stagger, SplitWords, ScrollHighlight, Magnetic, Counter, Spotlight, Tilt, Marquee
- `src/proxy.ts` — redirects `/student/*` to `/login?redirect=…` when there's no session cookie
- `src/content/site.ts` — marketing copy (stories are anonymous placeholders: replace with real, consented ones)

All animations respect `prefers-reduced-motion`.
