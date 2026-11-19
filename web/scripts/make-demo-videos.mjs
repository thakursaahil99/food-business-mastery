// Generates silent, branded dummy lesson videos for demo mode (public/demo/*.webm + poster .jpg).
//
//   node scripts/make-demo-videos.mjs
//
// Frames are drawn as SVG with sharp, then piped as MJPEG into an ffmpeg that can encode VP9/WebM.
// It uses FFMPEG_PATH, else `ffmpeg` on PATH, else the ffmpeg that Playwright downloads.
import sharp from "sharp";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "public/demo";
const W = 1280;
const H = 720;

function findFfmpeg() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  if (spawnSync("ffmpeg", ["-version"]).status === 0) return "ffmpeg";
  const root = join(process.env.LOCALAPPDATA ?? join(process.env.HOME ?? "", ".cache"), "ms-playwright");
  for (const dir of existsSync(root) ? readdirSync(root).filter((d) => d.startsWith("ffmpeg")).sort().reverse() : []) {
    for (const exe of ["ffmpeg-win64.exe", "ffmpeg-linux", "ffmpeg-mac"]) {
      if (existsSync(join(root, dir, exe))) return join(root, dir, exe);
    }
  }
  throw new Error("No ffmpeg found. Install ffmpeg or set FFMPEG_PATH.");
}

const mark = `data:image/png;base64,${readFileSync("public/brand/redbean-mark.png").toString("base64")}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function frameSvg({ t, duration, kicker, title, slides }) {
  const slideLen = duration / slides.length;
  const si = Math.min(slides.length - 1, Math.floor(t / slideLen));
  const slide = slides[si];
  const local = t - si * slideLen;
  const fadeIn = ease(local / 0.8);
  const orbit = (t / duration) * Math.PI * 2;
  const cx = 1040 + Math.cos(orbit * 3) * 60;
  const cy = 220 + Math.sin(orbit * 3) * 40;
  const bullets = slide.points
    .map((p, i) => {
      const a = ease((local - 0.6 - i * 0.5) / 0.6);
      return `<g opacity="${a.toFixed(3)}" transform="translate(${(1 - a) * 24},0)">
        <circle cx="128" cy="${396 + i * 58}" r="7" fill="#e01426"/>
        <text x="152" y="${405 + i * 58}" font-family="Segoe UI, Arial, sans-serif" font-size="28" fill="#f4efe9">${esc(p)}</text>
      </g>`;
    })
    .join("");
  const progress = (t / duration) * (W - 192);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#14070a"/><stop offset="0.6" stop-color="#2a0a10"/><stop offset="1" stop-color="#5c0d18"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#e01426" stop-opacity="0.45"/><stop offset="1" stop-color="#e01426" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="260" fill="url(#glow)"/>
  <image href="${mark}" x="96" y="72" width="64" height="54"/>
  <text x="176" y="98" font-family="Segoe UI, Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff">Redbean Academy</text>
  <text x="176" y="124" font-family="Segoe UI, Arial, sans-serif" font-size="16" fill="#ffffff" fill-opacity="0.55">${esc(kicker)}</text>
  <text x="${W - 96}" y="104" text-anchor="end" font-family="Consolas, monospace" font-size="18" fill="#ffffff" fill-opacity="0.45">DEMO VIDEO</text>
  <text x="96" y="230" font-family="Segoe UI, Arial, sans-serif" font-size="18" letter-spacing="4" fill="#ff8a94">${esc(`PART ${si + 1} OF ${slides.length}`)}</text>
  <g opacity="${fadeIn.toFixed(3)}">
    <text x="96" y="300" font-family="Segoe UI, Arial, sans-serif" font-size="54" font-weight="700" fill="#ffffff">${esc(slide.heading)}</text>
  </g>
  ${bullets}
  <text x="96" y="${H - 96}" font-family="Segoe UI, Arial, sans-serif" font-size="20" fill="#ffffff" fill-opacity="0.6">${esc(title)}</text>
  <text x="${W - 96}" y="${H - 96}" text-anchor="end" font-family="Consolas, monospace" font-size="20" fill="#ffffff" fill-opacity="0.75">${mmss(t)} / ${mmss(duration)}</text>
  <rect x="96" y="${H - 72}" width="${W - 192}" height="6" rx="3" fill="#ffffff" fill-opacity="0.12"/>
  <rect x="96" y="${H - 72}" width="${progress.toFixed(1)}" height="6" rx="3" fill="#e01426"/>
</svg>`;
}

async function render(video) {
  const { file, duration, fps } = video;
  const ffmpeg = findFfmpeg();
  const target = join(OUT, `${file}.webm`);
  const total = Math.round(duration * fps);
  console.log(`→ ${target}  ${duration}s @${fps}fps (${total} frames)`);
  const proc = spawn(
    ffmpeg,
    ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", String(fps), "-i", "pipe:0",
      "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "40", "-deadline", "good", "-cpu-used", "5", "-row-mt", "1", "-pix_fmt", "yuv420p", target],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const done = new Promise((res, rej) => proc.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
  for (let i = 0; i < total; i++) {
    const jpg = await sharp(Buffer.from(frameSvg({ ...video, t: i / fps }))).jpeg({ quality: 82 }).toBuffer();
    if (!proc.stdin.write(jpg)) await new Promise((r) => proc.stdin.once("drain", r));
    if (i % (fps * 30) === 0) process.stdout.write(`   ${Math.round((i / total) * 100)}%\n`);
  }
  proc.stdin.end();
  await done;
  // poster = a frame a little in, once the first slide has drawn
  await sharp(Buffer.from(frameSvg({ ...video, t: Math.min(duration - 0.1, 3.5) }))).jpeg({ quality: 80 }).toFile(join(OUT, `${file}.jpg`));
}

export const VIDEOS = [
  {
    file: "welcome-12s",
    duration: 12,
    fps: 24,
    kicker: "Welcome",
    title: "Welcome to Redbean Academy",
    slides: [
      { heading: "Welcome to Redbean Academy", points: ["Live classes every week", "Recordings you can rewatch"] },
      { heading: "Learn from Bobby Singh", points: ["20+ years in contract food", "350+ success stories"] },
    ],
  },
  {
    file: "lesson-3m30s",
    duration: 210,
    fps: 15,
    kicker: "Sample lesson",
    title: "Food-cost control: a practical walkthrough",
    slides: [
      { heading: "Why food cost decides your margin", points: ["Cost-plus vs fixed-price contracts", "Where money leaks in a kitchen", "The 3 numbers to track daily"] },
      { heading: "Building a recipe cost card", points: ["Standard yield per dish", "Price every ingredient by unit", "Add wastage and fuel"] },
      { heading: "Daily consumption sheet", points: ["Opening stock + purchase − closing", "Compare against covers served", "Flag variance above 3%"] },
      { heading: "Vendor and inventory control", points: ["Two quotes for every buy", "FIFO in the store room", "Weekly stock audit"] },
      { heading: "Reporting to the client", points: ["Monthly cost-plus invoice", "KPI dashboard for the client", "Turn savings into renewals"] },
      { heading: "Your action items", points: ["Cost 5 dishes this week", "Start the consumption sheet", "Bring questions to the live class"] },
    ],
  },
];

mkdirSync(OUT, { recursive: true });
for (const v of VIDEOS) await render(v);
console.log("done");
