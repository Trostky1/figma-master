#!/usr/bin/env node
// figma-master: read the PALETTE from a screenshot or any image. Needs ffmpeg.
// Usage: node rip-image.mjs <image> <out.json> [--source "<where the image came from>"]
// Output has the same shape rip-to-style.mjs reads, with low confidence for everything a picture cannot show.
// A picture gives colors well. It does NOT give font names, exact sizes, spacing, or radius.
// Fonts, sizes, and shapes must be filled in by looking at the picture (and the user's say so), or by a live page read.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const pos = args.filter((a, i) => !a.startsWith("--") && !["--source", "--trim-bottom", "--sample"].includes(args[i - 1]));
const [img, outFile] = pos;
const si = args.indexOf("--source");
const source = si >= 0 ? args[si + 1] : img;
if (!img || !outFile) { console.error("Usage: node rip-image.mjs <image> <out.json> [--source text]"); process.exit(2); }

function findFfmpeg() {
  const ok = (p) => spawnSync(p, ["-version"], { encoding: "utf8" }).status === 0;
  if (process.env.FFMPEG && ok(process.env.FFMPEG)) return process.env.FFMPEG;
  if (ok("ffmpeg")) return "ffmpeg";
  const root = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages");
  if (root && existsSync(root)) for (const pkg of readdirSync(root)) {
    if (!pkg.toLowerCase().startsWith("gyan.ffmpeg")) continue;
    for (const sub of readdirSync(join(root, pkg))) { const exe = join(root, pkg, sub, "bin", "ffmpeg.exe"); if (existsSync(exe) && ok(exe)) return exe; }
  }
  return null;
}
const ff = findFfmpeg();
if (!ff) { console.error("ffmpeg not found."); process.exit(3); }
const path = resolve(img);
if (!existsSync(path)) { console.error("Image not found: " + path); process.exit(4); }

// size of the image
const probe = spawnSync(ff, ["-i", path], { encoding: "utf8" });
const dim = /(\d{2,5})x(\d{2,5})/.exec((probe.stderr || "").split("\n").filter((l) => /Video:/.test(l)).join(" "));
const W0 = dim ? +dim[1] : 0, H0 = dim ? +dim[2] : 0;
// decode at 240 px wide
const TW = 240;
const th = H0 && W0 ? Math.max(1, Math.round((H0 / W0) * TW)) : 160;
// --trim-bottom 0.09 cuts the bottom 9% first (for example a "curated by" bar on reference screenshots)
const tb = args.indexOf("--trim-bottom");
const trim = tb >= 0 ? Math.min(0.8, Math.max(0, parseFloat(args[tb + 1]) || 0)) : 0;
const thTrim = trim ? Math.max(1, Math.round(th * (1 - trim))) : th;
const vf = (trim ? `crop=iw:ih*${1 - trim}:0:0,` : "") + `scale=${TW}:${thTrim}:flags=area`;
const r = spawnSync(ff, ["-v", "error", "-i", path, "-vf", vf, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 26 });
if (r.status !== 0 || !r.stdout || !r.stdout.length) { console.error("Could not decode the image."); process.exit(5); }
const buf = r.stdout, pixels = Math.floor(buf.length / 3);

// bucket to 5 bits per channel, then merge close buckets
const buckets = new Map();
for (let i = 0; i < pixels; i++) {
  const R = buf[i * 3], G = buf[i * 3 + 1], B = buf[i * 3 + 2];
  const k = ((R >> 3) << 10) | ((G >> 3) << 5) | (B >> 3);
  const b = buckets.get(k) || { n: 0, r: 0, g: 0, b: 0 }; b.n++; b.r += R; b.g += G; b.b += B; buckets.set(k, b);
}
let cl = [...buckets.values()].map((b) => ({ n: b.n, r: b.r / b.n, g: b.g / b.n, b: b.b / b.n })).sort((a, b) => b.n - a.n);
const d = (a, b) => Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
const merged = [];
for (const c of cl) {
  const near = merged.find((m) => d(m, c) < 20);
  if (near) { const t = near.n + c.n; near.r = (near.r * near.n + c.r * c.n) / t; near.g = (near.g * near.n + c.g * c.n) / t; near.b = (near.b * near.n + c.b * c.n) / t; near.n = t; }
  else merged.push({ ...c });
}
merged.sort((a, b) => b.n - a.n);
const hx = (c) => "#" + [c.r, c.g, c.b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const sat = (c) => { const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b); return mx === 0 ? 0 : (mx - mn) / mx; };
const cr = (a, b) => { const [x, y] = lum(a) >= lum(b) ? [a, b] : [b, a]; return (lum(x) + 0.05) / (lum(y) + 0.05); };
const top = merged.slice(0, 14).map((c) => ({ c: hx(c), share: +(c.n / pixels).toFixed(4), lum: +lum(c).toFixed(3), sat: +sat(c).toFixed(2), _c: c }));
const page = top[0];
const bgColors = top.filter((t) => t.share >= 0.01).map((t) => ({ c: t.c, n: 1, areaShare: t.share }));
const textColors = top.filter((t) => t !== page && t.share >= 0.002 && cr(t._c, page._c) >= 3 && t.sat < 0.35).map((t) => ({ c: t.c, n: 1, w: Math.round(t.share * 10000) }));
const accents = top.filter((t) => t.sat >= 0.45 && t.share >= 0.002 && t.lum > 0.03).map((t) => ({ c: t.c, n: 1, w: Math.round(t.share * 10000) }));
const out = {
  tool: "figma-master rip-image.mjs v1", method: "image", url: source, title: "image", readAt: new Date().toISOString(),
  viewport: { w: W0 || TW, h: H0 || th }, elementsRead: pixels, visible: pixels,
  textColors: [...textColors, ...accents], bgColors, borderColors: [], fonts: [], typeScale: [], typeByTag: {},
  radii: [], shadows: [], spacing: [], gaps: [], motion: { durationsMs: [], easings: [] }, buttons: [], inputs: [], cards: [], sections: [], cssVariables: {}, fontsLoaded: [],
  palette: top.map(({ _c, ...t }) => t),
  confidence: { colors: "good (about 5 to 15 units off in RGB)", fonts: "none", sizes: "none", spacing: "none", radius: "none" },
  needsLooking: ["font families (look at the picture, or read the live page)", "font sizes and weights", "corner radius", "spacing scale", "shadows", "motion"],
  notRead: ["text content", "images", "logos and icons", "font files", "everything a flat picture cannot show"],
};
// --sample "x,y;x,y" reads exact pixels at full size (use it to read a small accent, such as a button)
const sa = args.indexOf("--sample");
if (sa >= 0 && W0 && H0) {
  const full = spawnSync(ff, ["-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { maxBuffer: 1 << 28 });
  out.samples = [];
  for (const pt of String(args[sa + 1] || "").split(";").map((s) => s.trim()).filter(Boolean)) {
    const [x, y] = pt.split(",").map((n) => parseInt(n, 10));
    if (full.status === 0 && x >= 0 && y >= 0 && x < W0 && y < H0) {
      // average a 5 by 5 block so a single noisy pixel does not mislead
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const px = x + dx, py = y + dy; if (px < 0 || py < 0 || px >= W0 || py >= H0) continue; const o = (py * W0 + px) * 3; r += full.stdout[o]; g += full.stdout[o + 1]; b += full.stdout[o + 2]; n++; }
      out.samples.push({ x, y, hex: hx({ r: r / n, g: g / n, b: b / n }) });
    } else out.samples.push({ x, y, error: "outside the image or decode failed" });
  }
}
writeFileSync(resolve(outFile), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ out: resolve(outFile), image: `${W0}x${H0}`, page: page.c, top: out.palette.slice(0, 10).map((p) => `${p.c} ${(p.share * 100).toFixed(1)}%`) }, null, 2));
