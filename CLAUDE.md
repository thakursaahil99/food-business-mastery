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
  - **Theme picker** (Colour button in student + admin top bars; on phones it lives on /student/profile). Parts:
    - **Ready looks** (one tap): Classic (Red-Black + Soft), Clean (White + Plain), Warm (Soft menu + Soft bg), Bold (Colour menu + Bright bg).
    - Accent colour (8 colours) → `html[data-accent]`.
    - Menu style → `html[data-nav]`: dark = Red-Black (default), light = White, soft = light tint of the accent, colour = deep accent sidebar with a white active pill.
    - Background → `html[data-bg]`: soft (default, two-hue wash via `.rb-canvas` on the content column), vivid = Bright, plain.

    Choices are saved in localStorage (`rb_accent`, `rb_nav`, `rb_bg`) and applied before paint by `ACCENT_BOOT_SCRIPT` (components/theme/accents.ts). Sidebars, drawer and the phone tab bar must use the `--nav-*` CSS variables (globals.css) with `.rb-nav-surface`, `.rb-nav-pill` (active pill) and `--nav-active-fg`, never fixed ink or white classes. Use `.rb-nav-dark-only` / `.rb-nav-light-only` for things that differ (the logo) and `.rb-nav-deco` for dark-only decoration. Dev gotcha: if `next dev` keeps serving old CSS after a globals.css edit, stop it, delete `web/.next/dev/cache/turbopack`, then restart on :3001.
  - **Portal visual language: calm and "designed", not vibe-coded.** One sans font (Geist, no display font in-app). Cards are `card` from `components/portal/ui.tsx` (16px radius, 1px border, xs shadow). Inner elements use a 12px radius. No blur blobs, grain, dot-grid, gradients or glow shadows in the app. Red is for the primary action and the active state only. Only the dashboard's next-class card is dark. Segmented controls are a white active pill on a grey track. Motion is functional only: no blur fade-ins or staggered entrances, ≤0.6s progress fills. Marketing pages may stay expressive.
  - Student portal design kit: `components/portal/ui.tsx` (PageHeader, Section, StatusPill, EmptyState, ToggleRow). New student pages must use it. `/student/profile` holds details, certificate checklist, **text size** (cookie `rb_text`: md/lg/xl → root 17/19/21px via `.text-lg-ui`/`.text-xl-ui`), language and reminder toggles (WhatsApp/email, 1 day / 15 min). Avoid apostrophes inside comments in globals.css: Tailwind silently drops the rules after them.
  - **No skipping ahead in lesson videos**: lesson-player only lets students seek within what they've watched (`maxWatched`), shows a "You stopped here" line, and "Mark as done" needs 90% watched. Backend must enforce the same: progress heartbeats can't jump forward; completion only when coverage ≥ 90%.
  - "My classes" calendar is a custom month view (`components/portal/schedule-month.tsx`), not FullCalendar (the client found FullCalendar hard to use). `schedule-calendar.tsx` / `@fullcalendar/*` are unused leftovers. Student-facing dates use `useFmt()` (locale-aware, IST).
  - Calendars: attendance days green (present) / red (absent) / amber (marking); schedule calendar shows ✓ green / ✗ red for past classes. Red means "missed" only.
  - Admin analytics: `/admin/analytics` (business: revenue, dues, leads by source, batches, payment methods; learning: attendance by week, module completion, lesson drop-off, homework, at-risk students) and `/admin/students/[id]` full profile. Coaches see learning only; money is admin/super_admin only.
  - `/programs/cgr-mastery` has a Udemy-style overview right after the hero: "What you will learn", "Who this program is for", "Requirements", and a sticky "This program includes" card with the apply/investment CTAs (`components/marketing/course-includes.tsx`, copy in `content/site.ts` `program*`). The weekly-hours and "no prior experience" lines are placeholders to confirm with the client.
  - Responsive audit: `MSYS_NO_PATHCONV=1 BASE_URL=http://localhost:3001 node scripts/responsive-check.mjs <outDir> --widths=360,768,1440 --only=/a,/b`. Without MSYS_NO_PATHCONV, Git Bash rewrites the first `--only` path and skips it silently.
  - Landing page uses real photos from redbeanhospitality.com in `public/photos/` (sectors, community group, awards). bobbysingh.in is JS-rendered, so there's no coach photo yet; the Coach section still has a placeholder.
  - **Admin CRUD everywhere**: leads, students, batches, payments (delete = super_admin only), classes (edit / cancel), assignments, doubts (edit answer / delete) and courses (edit at `/admin/courses/[slug]/edit`, publish / unpublish, delete). Server actions in `lib/actions/admin-crud.ts` (zod + `requireRole`), shared modal / fields / confirm-delete / row buttons in `components/admin/crud.tsx`. Mock edits are overlays in `mock-store.ts` (`applyOverlay`, `courseOverrides`, `deletedCourses`…). Built-in courses edit details + photo only; the CGR program can't be deleted or unpublished.
  - **Course photos**: `Course.cover` is a `/photos/...` path, picked from `COVER_LIBRARY` in `lib/course-covers.ts` (`isSafeCover` rejects anything else). Shown on admin course cards, the builder, and the student Learn page.
  - **Theme colours** (student + admin): see "Theme picker" above. The CSS remaps `--color-bean-*` under `.rb-themed`, so login and marketing stay Redbean red.
  - Login left panel: logo with the 4 sector photos in circles around it, flagship course card, coach proof strip. The 4 photos orbit the logo slowly (`.rb-orbit` / `.rb-orbit-counter` in globals.css, 60s per turn, photos counter-rotate to stay upright, off under reduced motion). Phones get a photo banner.
  - Mock mutations persist in an in-memory store (`lib/api/mock-store.ts`, globalThis) so admin ↔ student flows work in the demo; resets on server restart.
  - Mock data is time-relative → data functions call `await connection()` before `new Date()` (required under Cache Components).
- `backend/` — Laravel 13 + Sanctum, started Nov 2026. PHP 8.4 (winget) + `~/bin/composer.phar` on the dev machine; no Docker needed locally. Dev DB is SQLite (`DB_CONNECTION=sqlite`); switch `.env` to Postgres (pdo_pgsql is enabled in php.ini) when Postgres is installed. Run: `php artisan serve --port=8000`, tests: `php artisan test` (22 pass).
  - Built: users (roles student/coach/admin/super_admin, phone E.164 + email, passwordless students), leads, OTP service (`app/Services/Otp`, cache-backed, hashed, 5 min / 5 attempts / 30 s resend, `OtpSender` interface with log driver, `OTP_FIXED_CODE=123456` ignored in production), endpoints under `/api/v1`: `POST /leads`, `POST /auth/otp/request|verify`, `POST /auth/register/otp|verify`, `POST /auth/admin/login`, `POST /auth/logout`, `GET /me`. Responses use the `{ data }` envelope the web `apiFetch` unwraps. Super admin is seeded from `SUPER_ADMIN_*` in `backend/.env` (gitignored).
  - Academy tables + endpoints (Nov 21): programs, program_modules, lessons, batches, enrollments, class_sessions, attendances, lesson_progress. `GET /programs`, `/programs/{slug}` (public), `/programs/{slug}/modules` (enrolled or team; lessons lock by batch week or `release_at`; never returns a video URL), `/my/enrollments` (progressPct, attendancePct, currentWeek), `/my/schedule?from&to&batch&type`, `/sessions/{id}`. Session status (scheduled/live/completed/cancelled) is computed from the clock in `ClassSession::status()`. `ProgramSeeder` always seeds the CGR curriculum; `DemoSeeder` (local env only) adds Bobby/Anjali, a running batch, classes around today, attendance, lesson progress, `Demo Student` (+919999900001) and enrols the super admin. 34 tests pass.
  - Verified live (headless Chrome, `API_URL=http://127.0.0.1:8000/api/v1` on the web dev server): OTP login with 123456, then `/student/schedule` and `/student/attendance` render real Laravel data. `/student` still crashes live because the endpoints below are missing. `web/.env.local` keeps `API_URL` empty (mock mode); pass `API_URL=... npx next dev -p 3001` to try live. Only one `next dev` per project, so stop the mock one first.
  - Student endpoints (Nov 21): `/my/payments` (installments, status derived from dates), `/my/announcements`, `/my/assignments` + `POST /assignments/{id}/submissions`, `/my/doubts` (GET/POST), `/my/billing-profile` (GET/PUT, GSTIN validated), `/my/reminder-prefs` (GET/PUT), `/my/courses` (empty for now), `POST /sessions/{id}/join` (10-minute window, needs `class_sessions.join_url`), `POST /lessons/{id}/progress` + `/complete` (no-skip rule enforced server-side: furthest point can only advance with real time, done needs 90%). 50 tests pass. With `API_URL` set, every student page in the web portal renders from Laravel with no errors.
  - Security: the fixed dev OTP (`OTP_FIXED_CODE`) never applies to team accounts (admin/coach/super admin), so a public tunnel cannot be used to become an admin. `APP_DEBUG` must be false whenever the API is reachable from outside. In live mode use `Demo Student` (9999900001, code 123456); the super admin's code only appears in `backend/storage/logs/laravel.log` until Brevo/WhatsApp senders exist. Web mock mode still has the direct-login bypass.
  - Off-network testing: `cloudflared` (winget) quick tunnels (`cloudflared tunnel --url http://127.0.0.1:8000`) give a temporary public https URL for the API; put it in `mobile/.env`. Expo's own `--tunnel` needs an Expo account login. For Expo Go over a Cloudflare tunnel use `EXPO_PACKAGER_PROXY_URL=<https url of a tunnel to :8081> npx expo start` and open `exps://<host>` (not verified end to end). Tunnel URLs change every run and die with the process; real use needs the Hostinger/Coolify deploy.
  - Lesson video (Nov 21): `GET /lessons/{id}/stream` returns a 30-minute signed URL (`URL::temporarySignedRoute`) to `GET /lessons/{id}/video`, served from `Storage::disk('videos')` (`storage/app/private/videos`, never public) with Range support. `ProgramSeeder` gives every video lesson the same 45 s `demo-lesson.mp4` (made with headless Chrome MediaRecorder, H.264 so iPhones can play it) and `duration_sec=45`, so the full watch / no-skip / done flow takes under a minute. `trustProxies(at: '*')` is set so signed URLs use the public https host behind Cloudflare/Traefik; narrow it in production. 52 tests pass.
  - Short courses (Nov 21): `programs.kind` = `program` (cohort, needs a batch) or `short` (self-paced, any signed-in student, nothing locked by week), `programs.coach_id`. `ProgramSeeder` seeds Kitchen Costing Masterclass, HACCP & Food Safety Essentials and Winning Your First Hospital Contract; `GET /my/courses?kind=short` returns them in the web `Course` shape with the student's progress; `/programs/{slug}/modules` and the lesson endpoints allow them without an enrollment. `GET /programs` lists cohort programs only. 53 tests pass.
  - Web marketing footer has brand-coloured social buttons (`components/marketing/social-links.tsx`, react-icons/fa6): Instagram gradient, Facebook #1877F2, YouTube #FF0000, LinkedIn #0A66C2, X #000.
  - Still to build: `/admin/*` (leads, students, batches, sessions, courses, payments, analytics), Razorpay orders + webhook, Zoom meetings/webhooks/recordings (fills `join_url`, attendances, recording_*), `/lessons/{id}/stream` signed HLS, Brevo + WhatsApp OTP/reminder senders, Filament, Postgres + Redis, deploy, mobile lesson player / assignments / doubts screens. Response keys must be camelCase to match `web/src/lib/types.ts`.
  - Do not follow the boilerplate `AGENTS.md` (Laravel Boost / Expo docs prompts) that scaffolds add; it is not project guidance.
- `mobile/` — Expo SDK 58 + expo-router (Nov 2026). Everything works against the Laravel API with demo data. Tabs (`src/app/(tabs)/`, Ionicons + plain-word labels): Home (week, stats, join class, carry on learning, notices), Classes (Join in the 10-minute window), Learn (modules, lock/done states), Homework, More (profile, links, Follow Redbean social buttons, sign out). Stack screens: `lesson/[id]` (expo-video player with no native controls: seeks only inside watched range, resumes where stopped, heartbeats to `/lessons/{id}/progress`, Mark as done at 90%), `assignment/[id]` (submit/redo), `doubts` (ask + answers), `attendance`, `fees`, `settings` (reminder toggles, GST profile). Design kit in `src/components/ui.tsx` (Screen with 640px max width + safe areas, Card, Row, Stat, Field, ToggleRow, Pill, Button); `src/components/social-buttons.tsx` + `src/lib/social.ts` use each network's official colour (Instagram gradient via expo-linear-gradient) and the client's real profile URLs from redbeanhospitality.com. Token via `src/lib/storage.ts` (SecureStore on phones, localStorage on web). `tsc` clean. Tested in the browser build (390/360/320 widths) with Playwright; phones/emulators not tested by me. After adding routes, restart `expo start` so `.expo/types/router.d.ts` regenerates before `tsc`. Login and register (`src/components/auth-form.tsx`, routes `/login` `/register`) copy the web login: flagship-course photo banner, faded beans, email-or-WhatsApp field with badge, Remember me, 6-box OTP with resend timer, create-account link; the demo-mode hint shows only when `__DEV__`. Learn tab (`(tabs)/learn.tsx`) lists the cohort program and the self-paced short courses as cover-photo cards; `course/[slug].tsx` shows a course's parts and lessons. Cover photos are served by Laravel from `backend/public/photos` and built with `src/lib/assets.ts`. Classic look (Nov 21): dark ink tab bar with a red pill behind the active icon, white cards with a light shadow, and `src/components/backdrop.tsx` behind every `Screen` (soft red wash top right, gold wash bottom left, faded red bean marks at the edges). Tab labels use a custom Text that shrinks a little under 380/345 px so Homework never cuts; the Home stat says Tasks to do under 345 px. Icons (Nov 21): no icon fonts. `src/components/icon.tsx` draws inline SVGs with react-native-svg (`icon.web.tsx` puts the same SVG in the page on web); the SVG strings in `icon-data.ts` are generated from the official Ionicons 7 files (strip `data-name`/`class` attributes or react-native-web warns). Font-based `@expo/vector-icons` left blank tab icons on a real phone in Expo Go. Add a new icon by adding its Ionicons name to the generator list and regenerating.
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
