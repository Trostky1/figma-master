#!/usr/bin/env node
// figma-master: cut key frames out of an exported motion video and build one contact sheet.
// Usage: node extract-frames.mjs <video.mp4> <outDir> <times> [columns]
//   times   = comma list of seconds, for example 0,0.2,0.5,1.2   or   auto:6  (6 evenly spaced frames)
//   columns = contact sheet columns (default 3)
// Prints JSON. Needs ffmpeg (PATH, FFMPEG env var, or a Windows winget install).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const [video, outDirArg, timesArg, colsArg] = process.argv.slice(2);
if (!video || !outDirArg || !timesArg) {
  console.error("Usage: node extract-frames.mjs <video.mp4> <outDir> <times|auto:N> [columns]");
  process.exit(2);
}

function findFfmpeg() {
  const tryRun = (p) => spawnSync(p, ["-version"], { encoding: "utf8" }).status === 0;
  if (process.env.FFMPEG && tryRun(process.env.FFMPEG)) return process.env.FFMPEG;
  if (tryRun("ffmpeg")) return "ffmpeg";
  const local = process.env.LOCALAPPDATA;
  if (local) {
    const root = join(local, "Microsoft", "WinGet", "Packages");
    if (existsSync(root)) {
      for (const pkg of readdirSync(root)) {
        if (!pkg.toLowerCase().startsWith("gyan.ffmpeg")) continue;
        const pkgDir = join(root, pkg);
        for (const sub of readdirSync(pkgDir)) {
          const exe = join(pkgDir, sub, "bin", "ffmpeg.exe");
          if (existsSync(exe) && tryRun(exe)) return exe;
        }
      }
    }
  }
  return null;
}

const ffmpeg = findFfmpeg();
if (!ffmpeg) {
  console.error("ffmpeg not found. Install it, or set the FFMPEG environment variable.");
  process.exit(3);
}
const videoPath = resolve(video);
if (!existsSync(videoPath)) { console.error("Video not found: " + videoPath); process.exit(4); }
const outDir = resolve(outDirArg);
mkdirSync(outDir, { recursive: true });

// duration from ffmpeg's banner
const probe = spawnSync(ffmpeg, ["-i", videoPath], { encoding: "utf8" });
const m = /Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/.exec(probe.stderr || "");
const duration = m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null;

let times;
if (timesArg.startsWith("auto:")) {
  const n = Math.max(2, parseInt(timesArg.slice(5), 10) || 6);
  if (duration === null) { console.error("Could not read video duration for auto times."); process.exit(5); }
  // stay clear of the very end: a seek past the last frame writes nothing
  const last = Math.max(0, duration - 0.15);
  times = Array.from({ length: n }, (_, i) => +((last * i) / (n - 1)).toFixed(3));
} else {
  times = timesArg.split(",").map((s) => parseFloat(s.trim())).filter((x) => Number.isFinite(x) && x >= 0);
}
if (!times.length) { console.error("No valid times."); process.exit(6); }

const frames = [];
times.forEach((t, i) => {
  const name = `frame_${String(i + 1).padStart(2, "0")}.png`;
  const cut = (at) =>
    spawnSync(ffmpeg, ["-y", "-v", "error", "-ss", String(at), "-i", videoPath, "-frames:v", "1", join(outDir, name)], { encoding: "utf8" });
  let usedT = t;
  let r = cut(t);
  let ok = r.status === 0 && existsSync(join(outDir, name));
  if (!ok && t > 0) {
    // asked for a time past the last frame: step back a little and say so
    usedT = Math.max(0, +(t - 0.15).toFixed(3));
    r = cut(usedT);
    ok = r.status === 0 && existsSync(join(outDir, name));
  }
  frames.push({ t, usedT, file: join(outDir, name), ok });
});
if (frames.some((f) => !f.ok)) {
  console.error("Some frames could not be cut: " + frames.filter((f) => !f.ok).map((f) => f.t).join(", "));
}

const okFrames = frames.filter((f) => f.ok);
let sheet = null;
// The sheet reads frame_01.. in order, so it only works when no frame failed.
if (okFrames.length >= 2 && okFrames.length === frames.length) {
  const cols = Math.min(parseInt(colsArg || "3", 10) || 3, okFrames.length);
  const rows = Math.ceil(okFrames.length / cols);
  const r = spawnSync(
    ffmpeg,
    ["-y", "-v", "error", "-framerate", "1", "-i", join(outDir, "frame_%02d.png"), "-vf", `tile=${cols}x${rows}:padding=6:color=gray`, "-frames:v", "1", join(outDir, "sheet.png")],
    { encoding: "utf8" }
  );
  if (r.status === 0) sheet = join(outDir, "sheet.png");
}

const result = { ffmpeg, video: videoPath, duration, times, frames, sheet, note: "Frame k in the sheet is times[k], left to right, top to bottom." };
writeFileSync(join(outDir, "frames.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
