# Redbean Academy: Build Prompt & Project Context

> Working name: "Redbean Academy". Final app name still open, stays under the Redbean brand.

## 0. Current status (keep updated)

- `web/` — Next.js 16.4 (App Router, React 19.3, Tailwind v4, Cache Components on). **Read `web/AGENTS.md` and `web/node_modules/next/dist/docs/` before writing Next code** — `middleware` is now `proxy.ts`, request APIs are async, uncached/runtime reads must sit inside `<Suspense>`.
  - Motion stack: `motion` (`motion/react`), `lenis` smooth scroll, React `<ViewTransition>` for route transitions.
  - Calendar: FullCalendar **v7** — everything comes from `@fullcalendar/react` subpaths (`/daygrid`, `/timegrid`, `/list`, `/themes/monarch`). Do NOT install v6 `@fullcalendar/core|daygrid|...`.
  - Data layer: `web/src/lib/api/*` — uses mock data until `API_URL` is set, then calls Laravel `/api/v1`. Session is an httpOnly cookie (`rb_session`) set by server actions (BFF pattern); Sanctum token never reaches client JS.
  - Dev OTP is **123456** while in mock mode.
  - Built (UI on mock data): home, `/programs/cgr-mastery`, `/apply`, `/login` (OTP), `/student` dashboard, `/student/schedule`, `/student/learn`, `/student/payments`, `/student/class/[id]` lobby. `npm run build` passes; marketing pages are static, portal pages are Partial Prerender.
  - Auth (mock mode): `/login` + `/register` (OTP, dev code 123456), `/admin/login` (email + password). Super admin + OTP-bypass numbers come from `web/.env.local` (`SUPER_ADMIN_*`, `ENABLE_DEV_LOGIN`, `DEV_DIRECT_LOGIN`) — never hardcode credentials. Mock session cookie is HMAC-signed with `SESSION_SECRET`. Remove the OTP bypass before launch.
  - Admin console `/admin` (overview, leads, students, schedule, batches, payments) guarded by `requireRole()`; super_admin/admin also see the student portal with an "Admin console" switch. Laravel endpoints expected: `/auth/admin/login`, `/auth/register/otp|verify`, `/admin/*`.
  - **Live classes run on Zoom** (client's existing setup; decided Nov 2026). LiveKit stays as an optional `platform: "livekit"`. Laravel side: Zoom Server-to-Server OAuth app → create meeting per class with `settings.auto_recording = "cloud"` when "Record" is on → register each enrolled student as a registrant (unique join_url ⇒ attendance from `meeting.participant_joined/left` webhooks) → `recording.completed` webhook → download MP4 → ffmpeg HLS → `Storage::disk('videos')` → shows in Learn → Class recordings. Cloud recording needs a paid Zoom license on the host account. Mentorship (1:1) is never recorded by default.
  - Student portal tabs: Dashboard, Schedule, Attendance, Learn (Course videos + Class recordings), Assignments, Doubts (ask + my questions), Payments (+ GSTIN billing profile). Admin adds: Classes (Zoom, record toggle, host start), Course content (upload), Assignments (create + review), Doubts (answer).
  - **Student portal is "easy mode" for everyone** (many students are older / non-technical): base text 17px (`.portal-easy`), ≥48px tap targets, plain words, no icon-only controls, floating "Help/मदद" button (Call + WhatsApp, number from `content/site.ts` `brand.whatsapp`, still a TODO). **English / हिंदी** toggle: strings in `lib/i18n/dict.ts`, `useT()` on the client, cookie `rb_lang` read in the student layout. Any new student-facing text must go through the dictionary in both languages.
  - **Student portal matches the admin console's look** (client's choice): dark ink-950 sidebar with a red gradient active pill and the user card at the bottom, a top bar with language + Help + name chip, display-font headings, `card` = 24px radius, and one dark KPI tile per stat row. On phones the bottom tab bar is dark with a red active pill and Help floats bottom-right; on desktop Help sits in the top bar. Udemy-style lesson tabs (Overview / My notes / Questions / Files) live in `lesson-tabs.tsx`.
  - **Portal visual language: calm and "designed", not vibe-coded.** One sans font (Geist, no display font in-app). Cards are `card` from `components/portal/ui.tsx` (16px radius, 1px border, xs shadow). Inner elements use a 12px radius. No blur blobs, grain, dot-grid, gradients or glow shadows in the app. Red is for the primary action and the active state only. Only the dashboard's next-class card is dark. Segmented controls are a white active pill on a grey track. Motion is functional only: no blur fade-ins or staggered entrances, ≤0.6s progress fills. Marketing pages may stay expressive.
  - Student portal design kit: `components/portal/ui.tsx` (PageHeader, Section, StatusPill, EmptyState, ToggleRow). New student pages must use it. `/student/profile` holds details, certificate checklist, **text size** (cookie `rb_text`: md/lg/xl → root 17/19/21px via `.text-lg-ui`/`.text-xl-ui`), language and reminder toggles (WhatsApp/email, 1 day / 15 min). Avoid apostrophes inside comments in globals.css: Tailwind silently drops the rules after them.
  - **No skipping ahead in lesson videos**: lesson-player only lets students seek within what they've watched (`maxWatched`), shows a "You stopped here" line, and "Mark as done" needs 90% watched. Backend must enforce the same: progress heartbeats can't jump forward; completion only when coverage ≥ 90%.
  - "My classes" calendar is a custom month view (`components/portal/schedule-month.tsx`), not FullCalendar (the client found FullCalendar hard to use). `schedule-calendar.tsx` / `@fullcalendar/*` are unused leftovers. Student-facing dates use `useFmt()` (locale-aware, IST).
  - Calendars: attendance days green (present) / red (absent) / amber (marking); schedule calendar shows ✓ green / ✗ red for past classes. Red means "missed" only.
  - Admin analytics: `/admin/analytics` (business: revenue, dues, leads by source, batches, payment methods; learning: attendance by week, module completion, lesson drop-off, homework, at-risk students) and `/admin/students/[id]` full profile. Coaches see learning only; money is admin/super_admin only.
  - Landing page uses real photos from redbeanhospitality.com in `public/photos/` (sectors, community group, awards). bobbysingh.in is JS-rendered, so there's no coach photo yet; the Coach section still has a placeholder.
  - Mock mutations persist in an in-memory store (`lib/api/mock-store.ts`, globalThis) so admin ↔ student flows work in the demo; resets on server restart.
  - Mock data is time-relative → data functions call `await connection()` before `new Date()` (required under Cache Components).
- `backend/` — not started (PHP/Composer not installed on the dev machine yet).
- `mobile/` — not started (Expo).
- `packages/shared/` — placeholder; types live in `web/src/lib/types.ts` for now and move here when mobile starts.

---

## 1. What we are building

A **student learning portal + mobile app for Red Bean Hospitality**, where **Mr. Bobby Singh** (MD of Red Bean Hospitality, contract food business coach) runs his training programs online.

- Brand / coach reference: https://bobbysingh.in and https://bobbysingh.in/crmp
- Portal reference (UX): Overbooked Academy student portal — https://student-new.overbookedacademy.com/student/schedule

### What Bobby Singh offers
- India's business coach for **contract food entrepreneurs**: 20+ years, 350+ success stories, Shark Tank India alumnus.
- Flagship: **CGR / Food Contract Mastery Program** (aka **CMS — Cost-plus Management System — Mastery Program**), a **4-month practical workshop**.
  - CGR pillars: Cash, Growth, Royalty
  - 4 sectors: Corporate, Hospitals, Institutions, Industries
  - 4-month Healthcare F&B Consultancy curriculum:
    - Month 1 (Weeks 1–4) Healthcare Infrastructure: kitchen layout, equipment, budgeting, workflow
    - Month 2 (Weeks 5–8) Compliance & Standards: NABH, HACCP, food safety, regulatory compliance
    - Month 3 (Weeks 9–12) Operations Management: staff, inventory and supply chain, cost control, performance monitoring
    - Month 4 (Weeks 13–16) Patient Care Integration: clinical nutrition, therapeutic diets, patient meal service, QA
    - Business Development (ongoing): contract negotiation, client acquisition, proposals, scaling
    - Certification & Practice (final): live project, case studies, certification assessment, mentorship
  - Benefits: webinars and events, MD Sir assistance (direct mentorship), business coach, RFC CRM, social media content support, discipline classes, training and education
- Site has an "Apply for CGR Workshop" lead form (name, email, phone, business goals) and a "Get Investment Details" CTA.

App must support: cohort/batch-based multi-month programs, weekly live classes, recorded lessons, webinars/events, mentorship sessions with the MD, assessments + certification, and a lead/application funnel.

## 2. Reference: Overbooked Academy portal

Login UX to copy (with Redbean colours, not purple):
- Split layout: left ~45% brand gradient panel with soft circles + dot pattern, logo centered, "© year" at bottom. Right is white.
- "Welcome back" / "Sign in with your email or WhatsApp number"
- Single input: email OR WhatsApp number; "Remember me"; "Continue with OTP →" disabled until valid.
- Passwordless: identifier → OTP → redirect back to requested page.

Schedule page features: Day/Week/Month + list views; class card (title, coach, IST time, duration, batch, type, status badge); Join enabled from 10 min before start (server-validated); recording link after class; attendance auto-tracked; reminders 1 day + 15 min (WhatsApp + push); Add to Google Calendar (.ics); filters by program/batch/type.

## 3. Tech stack (decided)

| Layer | Choice |
|---|---|
| Web (marketing + student portal) | Next.js (App Router) + TypeScript + Tailwind + shadcn-style components |
| Mobile | React Native (Expo) + Expo Router + TypeScript |
| Backend API | Laravel + Sanctum |
| Admin | Filament |
| DB | PostgreSQL |
| Cache / queues / OTP | Redis |
| Realtime | Laravel Reverb |
| Live classes | LiveKit (self-hosted) |
| Recorded videos | VPS (HLS via ffmpeg) behind `Storage::disk('videos')`, R2 later |
| Email OTP | Brevo |
| WhatsApp OTP + reminders | Meta WhatsApp Cloud API |
| Payments | Razorpay |
| Push | Firebase Cloud Messaging |
| Calendar UI | FullCalendar (MIT) |
| Deployment | Coolify (Docker) on Hostinger KVM 4 (Mumbai) |

Why: Laravel (dev has 2.5y exp), Expo (shares TS with Next), Postgres (relational data), Next (SEO), self-hosted LiveKit (no per-minute fees).

## 4. Hosting
Hostinger KVM 4 (4 vCPU, 16 GB, 200 GB NVMe), everything via Coolify. ~100–150 concurrent WebRTC students per server; use Egress HLS / LiveKit Cloud / YouTube Live for larger webinars. Move videos to R2 at 70% disk or 50–100 GB. Daily off-server Postgres backups.

## 5. Roles
Student · Coach/Trainer · Admin (Redbean team, Filament) · Super admin (Bobby Singh).

## 6. Modules
MVP: OTP auth · Programs & batches · Applications/leads · Razorpay payments (full / instalments, GST invoice, coupons) · Schedule · Live classes (LiveKit, join tokens, coach controls, Egress recording) · Recorded lessons (HLS 360p/720p, signed URLs, resume) · Attendance (LiveKit webhooks) · Notifications (WhatsApp, FCM, email, in-app) · Student dashboard · Filament admin + reports.
Phase 2: assignments, quizzes + certificate PDF with QR, mentorship booking, webinars/events, resources library, announcements + community chat, success stories.

## 7. Core tables
```
users(id, name, email, phone, role, avatar, is_active, timestamps)
otp_codes -> Redis (hashed code, attempts, expires_at)
devices(id, user_id, fcm_token, platform)
leads(id, name, email, phone, business_goals, source, status, assigned_to, notes, timestamps)
programs(id, title, slug, description, duration_weeks, thumbnail, is_published)
program_modules(id, program_id, title, order, week_from, week_to)
lessons(id, module_id, title, type[video|pdf|live], video_path, duration_sec, order, is_preview)
batches(id, program_id, name, start_date, end_date, seats, coach_id, price, status)
enrollments(id, user_id, batch_id, status[pending|active|completed|cancelled], enrolled_at)
class_sessions(id, batch_id, lesson_id?, title, type[live|webinar|mentorship], coach_id,
               starts_at, ends_at, livekit_room, status, recording_path)
attendances(id, class_session_id, user_id, joined_at, left_at, duration_sec)
lesson_progress(id, user_id, lesson_id, watched_sec, completed_at)
payments(id, user_id, enrollment_id, razorpay_order_id, razorpay_payment_id, amount, gst,
         status, invoice_no, paid_at)
installments(id, enrollment_id, due_date, amount, status, payment_id)
coupons(id, code, type, value, max_uses, valid_till)
notifications (Laravel default)
```

## 8. API (`/api/v1`)
```
POST /auth/otp/request {identifier}
POST /auth/otp/verify  {identifier, code} -> token
POST /auth/logout
GET  /me
POST /leads
GET  /programs, /programs/{slug}
GET  /my/enrollments
GET  /my/schedule?from=&to=&batch=&type=
GET  /sessions/{id}
POST /sessions/{id}/join   -> LiveKit token (enrolled + within window)
GET  /lessons/{id}/stream  -> signed HLS URL
POST /lessons/{id}/progress
POST /payments/order
POST /webhooks/razorpay
POST /webhooks/livekit
POST /devices
```

## 9. Implementation rules
- Always `Storage::disk('videos')`; store relative paths, never full URLs.
- Videos never public; short-lived signed URLs after enrollment check.
- OTP: 6 digits, 5-min expiry, max 5 attempts, rate-limit per identifier + IP, hashed in Redis.
- Verify Razorpay + LiveKit webhook signatures; idempotent handlers.
- Store UTC, display Asia/Kolkata.
- Join window decided by server (`starts_at - 10min` → `ends_at`).
- Mobile: LiveKit RN + Razorpay need an Expo dev build.
- Check Play/App Store rules on selling courses in-app (buy on web, consume in app).
- TS strict; Laravel Form Requests + API Resources + Policies; feature tests for auth, payments, join-token, webhooks.
- Respect `prefers-reduced-motion` in every animation.

## 10. Repo structure
```
backend/  web/  mobile/  packages/shared/  infra/
```

## 11. Build order
1. Backend foundation (Laravel, Postgres, Redis, OTP auth, roles, Filament)
2. Web: marketing pages, apply form, OTP login, student dashboard  ← started here (UI first, mock data)
3. Payments  4. Schedule + live classes  5. Recorded lessons  6. Notifications  7. Mobile  8. Phase 2

## 12. Budget
Launch (web + Android) ≈ ₹34–35k incl. VPS; 4-year total ≈ ₹1.2 lakh (≈ ₹1.55 lakh with iOS).
