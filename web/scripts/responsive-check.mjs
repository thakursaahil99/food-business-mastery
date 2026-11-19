// Responsive audit: logs in, visits every page at phone / tablet / desktop widths, takes full-page
// screenshots and reports anything that sticks out horizontally (the usual cause of mobile side-scroll).
//
//   node scripts/responsive-check.mjs [outDir] [--only=/student,/admin/leads] [--widths=360,768,1440]
//
// Needs the dev server on BASE_URL (default http://localhost:3001) and a local Chrome install.
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3001";
const args = process.argv.slice(2);
const outDir = args.find((a) => !a.startsWith("--")) ?? "responsive-shots";
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const only = flag("only")?.split(",");
const widths = (flag("widths") ?? "360,768,1024,1440").split(",").map(Number);
const heightFor = (w) => (w < 600 ? 780 : w < 900 ? 1024 : 800);

const PAGES = {
  public: ["/", "/programs/cgr-mastery", "/apply", "/login", "/register", "/admin/login"],
  student: ["/student", "/student/schedule", "/student/learn", "/student/learn/1", "/student/learn/9002", "/student/assignments", "/student/attendance", "/student/doubts", "/student/payments", "/student/profile", "/student/class/1000", "/student/class/2001"],
  admin: ["/admin", "/admin/analytics", "/admin/leads", "/admin/students", "/admin/students/100", "/admin/batches", "/admin/sessions", "/admin/courses", "/admin/courses/new", "/admin/assignments", "/admin/doubts", "/admin/payments"],
};

const chromePaths = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);
const executablePath = chromePaths.find((p) => existsSync(p));
if (!executablePath) throw new Error("No Chrome/Edge found. Set CHROME_PATH.");

function readEnv(key) {
  try {
    const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim().replace(/^["']|["']$/g, "");
  } catch {
    return undefined;
  }
}

async function loginStudent(context) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#identifier", "9876543210");
  await page.locator('button[type="submit"]').click();
  await page.locator('[aria-label="Digit 1"]').waitFor({ timeout: 15000 });
  await page.fill('[aria-label="Digit 1"]', "123456");
  await page.waitForURL(/\/student/, { timeout: 20000 });
  await page.close();
}

async function loginAdmin(context) {
  const email = readEnv("SUPER_ADMIN_EMAIL");
  const password = readEnv("SUPER_ADMIN_PASSWORD");
  if (!email || !password) return false;
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
  await page.fill("#admin-email", email);
  await page.fill("#admin-password", password);
  await page.locator('button[type="submit"]').click();
  try {
    await page.waitForURL((u) => u.pathname.startsWith("/admin") && !u.pathname.startsWith("/admin/login"), { timeout: 20000 });
    return true;
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

/** Runs in the page: elements whose box crosses the viewport edge and is not clipped by an ancestor. */
function findOverflow() {
  const vw = document.documentElement.clientWidth;
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const s = getComputedStyle(p);
      if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) {
        const r = p.getBoundingClientRect();
        if (r.left >= -1 && r.right <= vw + 1) return true;
      }
    }
    return false;
  };
  const hits = [];
  for (const el of document.body.querySelectorAll("*")) {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || s.position === "fixed" || s.pointerEvents === "none") continue; // pointer-events-none = decorative glow
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) {
      // keep only the outermost offender of a chain
      if (hits.some((h) => h.el.contains(el))) continue;
      hits.push({ el, r });
    }
  }
  return {
    vw,
    scrollWidth: document.documentElement.scrollWidth,
    offenders: hits.slice(0, 12).map(({ el, r }) => ({
      tag: el.tagName.toLowerCase(),
      cls: (el.getAttribute("class") ?? "").slice(0, 140),
      text: (el.textContent ?? "").trim().slice(0, 60),
      left: Math.round(r.left),
      right: Math.round(r.right),
    })),
  };
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.7;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  });
}

const slug = (p) => (p === "/" ? "home" : p.replace(/^\//, "").replace(/\//g, "_"));

// --tabs: on phone widths, click every tab / toggle / calendar view button and check each state too.
const tabsMode = args.includes("--tabs");
const TAB_SELECTOR = '[role="tab"], button[aria-pressed], button[aria-selected], .fc-button:not(.fc-prev-button):not(.fc-next-button)';

async function checkTabs(page, path, w, errors) {
  // recount every time: some tabs (e.g. calendar views) only appear after another tab is clicked
  for (let i = 0; i < (await page.locator(TAB_SELECTOR).count()); i++) {
    const tab = page.locator(TAB_SELECTOR).nth(i);
    if (!(await tab.isVisible().catch(() => false))) continue;
    const label = ((await tab.innerText().catch(() => "")) || (await tab.getAttribute("aria-label")) || `#${i}`).replace(/\s+/g, " ").trim().slice(0, 30);
    await page.evaluate(() => window.scrollTo(0, 0));
    await tab.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(700);
    const o = await page.evaluate(findOverflow);
    const file = join(outDir, `${slug(path)}@${w}~tab-${i}-${label.toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, "-").replace(/^-|-$/g, "")}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const bad = o.scrollWidth > o.vw || o.offenders.length > 0 || errors.size > 0;
    console.log(`  ${bad ? "✗" : "✓"} tab "${label}"  scrollWidth=${o.scrollWidth}/${o.vw}  offenders=${o.offenders.length}`);
    for (const e of errors) console.log(`       ⚠ ${e}`);
    errors.clear();
    for (const off of o.offenders) console.log(`       ${off.tag} [${off.left}..${off.right}] .${off.cls.split(" ").slice(0, 8).join(".")}  "${off.text}"`);
  }
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath, headless: true });
// --lang=hi sets the portal language cookie, to catch longer Devanagari labels wrapping
const lang = flag("lang");
const newContext = async () => {
  const ctx = await browser.newContext({ reducedMotion: "reduce", deviceScaleFactor: 1 });
  if (lang) await ctx.addCookies([{ name: "rb_lang", value: lang, url: BASE }]);
  // --cookies=rb_text=xl,rb_lang=hi : any extra portal preference cookies (text size etc.)
  for (const pair of (flag("cookies") ?? "").split(",").filter(Boolean)) {
    const [name, value] = pair.split("=");
    await ctx.addCookies([{ name, value, url: BASE }]);
  }
  return ctx;
};
const report = [];

// Public pages get their own logged-out context, otherwise /login and /register redirect to /student.
const groups = [[await newContext(), PAGES.public]];
try {
  const student = await newContext();
  await loginStudent(student);
  groups.push([student, PAGES.student]);
} catch (e) {
  console.warn("student login failed:", e.message);
}
const adminCtx = await newContext();
if (await loginAdmin(adminCtx)) groups.push([adminCtx, PAGES.admin]);
else console.warn("admin login skipped/failed (SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD in .env.local)");

for (const [context, paths] of groups) {
  for (const path of paths) {
    if (only && !only.includes(path)) continue;
    const page = await context.newPage();
    const errors = new Set();
    page.on("pageerror", (e) => errors.add(`pageerror: ${e.message.split(/\r?\n/)[0]}`));
    page.on("console", (m) => m.type() === "error" && errors.add(`console: ${process.env.FULL_ERRORS ? m.text().slice(0, 4000) : m.text().split(/\r?\n/)[0].slice(0, 220)}`));
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: heightFor(w) });
      const res = await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" }).catch((e) => ({ status: () => e.message }));
      await scrollThrough(page);
      const o = await page.evaluate(findOverflow);
      const file = join(outDir, `${slug(path)}@${w}.png`);
      await page.screenshot({ path: file, fullPage: true });
      const bad = o.scrollWidth > o.vw || o.offenders.length > 0 || errors.size > 0;
      report.push({ path, width: w, status: res?.status?.(), url: page.url().replace(BASE, ""), ...o, file });
      console.log(`${bad ? "✗" : "✓"} ${path} @${w}  status=${res?.status?.()}  scrollWidth=${o.scrollWidth}/${o.vw}  offenders=${o.offenders.length}`);
      for (const e of errors) console.log(`     ⚠ ${e}`);
      errors.clear();
      for (const off of o.offenders) console.log(`     ${off.tag} [${off.left}..${off.right}] .${off.cls.split(" ").slice(0, 8).join(".")}  "${off.text}"`);
      if (tabsMode && w < 600) await checkTabs(page, path, w, errors);
    }
    await page.close();
  }
}

writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2));
await browser.close();
