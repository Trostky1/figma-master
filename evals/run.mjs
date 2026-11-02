#!/usr/bin/env node
// figma-master offline checks. No dependencies. No Figma needed.
// Run: node evals/run.mjs      (or: npm test)
// Checks that the plugin is well formed and that every Node script still behaves.
// Behavior of the model itself is covered by evals/scenarios.md (run by hand or by an agent).
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = join(ROOT, "evals", "fixtures");
const results = [];
const test = (name, fn) => {
  try {
    const r = fn();
    if (r && r.skip) results.push({ name, status: "skip", note: r.skip });
    else results.push({ name, status: "pass" });
  } catch (e) {
    results.push({ name, status: "fail", note: e.message });
  }
};
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const node = (script, ...a) => spawnSync(process.execPath, [join(ROOT, script), ...a], { encoding: "utf8" });
const walk = (dir, out = []) => {
  for (const f of readdirSync(dir)) {
    if (f === ".git" || f === "node_modules") continue;
    const p = join(dir, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};
const frontmatter = (text) => {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!m) return null;
  const o = {};
  for (const line of m[1].split(/\r?\n/)) { const k = /^([\w-]+):\s*(.*)$/.exec(line); if (k) o[k[1]] = k[2].replace(/^["']|["']$/g, ""); }
  return o;
};
const allFiles = walk(ROOT);

// ------------------------------------------------------------ structure
const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
test("plugin.json has name, semver version, description", () => {
  assert(plugin.name === "figma-master", "name must be figma-master");
  assert(/^\d+\.\d+\.\d+$/.test(plugin.version), "version must be semver");
  assert(plugin.description && plugin.description.length > 30, "description too short");
});
test("package.json version matches plugin.json", () => {
  assert(JSON.parse(read("package.json")).version === plugin.version, "package.json version differs");
});
test("README heading names the current version", () => {
  const m = /What is in v(\d+\.\d+)/.exec(read("README.md"));
  assert(m, "README has no 'What is in vX.Y' heading");
  assert(plugin.version.startsWith(m[1] + "."), `README says v${m[1]}, plugin is ${plugin.version}`);
});

const skillDirs = readdirSync(join(ROOT, "skills")).filter((d) => existsSync(join(ROOT, "skills", d, "SKILL.md")));
const commandFiles = readdirSync(join(ROOT, "commands")).filter((f) => f.endsWith(".md"));

for (const d of skillDirs) {
  test(`skill ${d}: frontmatter name matches folder, description is useful`, () => {
    const fm = frontmatter(read(`skills/${d}/SKILL.md`));
    assert(fm, "no frontmatter");
    assert(fm.name === d, `name "${fm.name}" differs from folder "${d}"`);
    assert(fm.description && fm.description.length >= 80, "description under 80 characters");
    assert(/^Use /.test(fm.description), 'description should start with "Use " so it triggers well');
  });
  test(`skill ${d}: every script path it names exists`, () => {
    const text = read(`skills/${d}/SKILL.md`);
    const refs = [...text.matchAll(/(?:\.\.\/[\w-]+\/|skills\/[\w-]+\/)?scripts\/[\w.-]+\.(?:js|mjs)/g)].map((m) => m[0]);
    for (const r of refs) {
      const candidates = [join(ROOT, "skills", d, r), join(ROOT, r), join(ROOT, "skills", d, "..", r.replace(/^\.\.\//, ""))];
      assert(candidates.some(existsSync), `missing script: ${r}`);
    }
  });
}
for (const f of commandFiles) {
  test(`command ${f}: has a description and points at a real skill`, () => {
    const text = read(`commands/${f}`);
    const fm = frontmatter(text);
    assert(fm && fm.description && fm.description.length > 20, "missing description");
    if (f !== "figma-doctor.md") {
      const m = /`(figma-[a-z0-9-]+)` skill/.exec(text);
      assert(m, "command does not name a skill");
      assert(skillDirs.includes(m[1]), `names skill "${m[1]}" which does not exist`);
    }
  });
  test(`README lists /${basename(f, ".md")}`, () => {
    assert(read("README.md").includes("/" + basename(f, ".md")), "not in README");
  });
}
test("router skill lists every command as available", () => {
  const router = read("skills/figma-master/SKILL.md");
  const avail = /Available commands:([^\n]*)/.exec(router);
  assert(avail, "router has no 'Available commands' line");
  for (const f of commandFiles) assert(avail[1].includes("/" + basename(f, ".md")), `router missing /${basename(f, ".md")}`);
});

// ------------------------------------------------------------ hygiene
const scriptFiles = allFiles.filter((f) => /[\\/]scripts[\\/].+\.(js|mjs)$/.test(f));
test("every script parses", () => {
  for (const f of scriptFiles) {
    if (f.endsWith(".mjs")) {
      const r = spawnSync(process.execPath, ["--check", f], { encoding: "utf8" });
      assert(r.status === 0, `${relative(ROOT, f)}: ${r.stderr.split("\n")[0]}`);
    } else {
      const src = readFileSync(f, "utf8").replace(/__SPEC__/g, "{}").replace(/__ROOT_ID__/g, "x").replace(/__COLLECTION__/g, "x");
      try { new Function("return (async()=>{" + src + "\n})")(); } catch (e) { throw new Error(`${relative(ROOT, f)}: ${e.message}`); }
    }
  }
});
test("Figma scripts are read-only unless named apply, sync, or motion", () => {
  for (const f of scriptFiles.filter((x) => x.endsWith(".js"))) {
    const name = basename(f);
    const writes = /\b(setReactionsAsync|applyManualKeyframeTrack|createVariable\(|setValueForMode|setBoundVariable|\.fills\s*=|appendChild|createFrame|createText)\b/.test(readFileSync(f, "utf8"));
    const allowed = /^(apply-reactions|apply-motion|sync-tokens)\.js$/.test(name);
    assert(!(writes && !allowed), `${name} writes to Figma but is not an apply script`);
  }
});
test("each Figma script has its placeholder exactly once", () => {
  for (const f of scriptFiles.filter((x) => x.endsWith(".js"))) {
    const s = readFileSync(f, "utf8");
    const found = ["__SPEC__", "__ROOT_ID__", "__COLLECTION__"].filter((p) => s.includes(p));
    if (basename(f) === "check-flow.js") { assert(found.length === 0, "check-flow.js scans the current page and needs no input"); continue; }
    assert(found.length === 1, `${basename(f)}: expected one placeholder, found ${found.join(", ") || "none"}`);
    const count = s.split(found[0]).length - 1;
    assert(count >= 1, `${basename(f)}: placeholder missing`);
  }
});
test("no project specific words (this plugin is general)", () => {
  const banned = /go mode|gomode|caviar|essential oil|scent pod/i;
  for (const f of allFiles) {
    if (/\.(png|jpg|mp4|woff2?)$/i.test(f) || f.endsWith("run.mjs")) continue;
    const hit = banned.exec(readFileSync(f, "utf8"));
    assert(!hit, `${relative(ROOT, f)} contains "${hit && hit[0]}"`);
  }
});
test("no secrets or signed links in the repo", () => {
  const bad = /figd_[A-Za-z0-9_-]{10,}|X-Amz-Signature=|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{20,}/;
  for (const f of allFiles) {
    if (/\.(png|jpg|mp4)$/i.test(f) || f.endsWith("run.mjs")) continue;
    assert(!bad.test(readFileSync(f, "utf8")), `${relative(ROOT, f)} looks like it holds a secret or signed link`);
  }
});
test("attribution file names every borrowed project", () => {
  const a = read("ATTRIBUTION.md");
  for (const n of ["mcp-server-guide", "figma-console-mcp-skills", "chudarin-design-skills", "figma-suite", "design-token-audit-skills"]) assert(a.includes(n), `ATTRIBUTION.md misses ${n}`);
});

// ------------------------------------------------------------ tokens
const SPEC_JS = "skills/figma-sync/scripts/tokens-to-spec.mjs";
const CSS_JS = "skills/figma-sync/scripts/tokens-to-css.mjs";
let spec;
test("tokens-to-spec: reads CSS (modes, alias, units, skips)", () => {
  const r = node(SPEC_JS, join(FIX, "tokens.css"));
  assert(r.status === 0, "exit " + r.status + " " + r.stderr);
  spec = JSON.parse(r.stdout);
  assert(spec.modes.join() === "Light,Dark", "modes " + spec.modes);
  assert(spec.tokens.length === 13, "expected 13 tokens, got " + spec.tokens.length);
  const get = (n) => spec.tokens.find((t) => t.name === n);
  assert(get("space/4").values.Light === 16, "1rem should be 16");
  assert(get("color/brand/primary/alias").type === "ALIAS", "alias not detected");
  assert(Math.abs(get("color/bg/page").values.Dark.r - 0.0784) < 0.001, "dark override missing");
  assert(Math.abs(get("color/text/muted").values.Dark.r - 0.6588) < 0.001, "prefers-color-scheme block missing");
  assert(get("font/family/body").values.Light === "Inter, sans-serif", "font family quotes");
  assert(spec.skipped.some((s) => s.name === "shadow/card"), "shadow should be skipped, and reported");
  assert(spec.skipped.some((s) => s.name === "motion/ease"), "easing should be skipped, and reported");
});
test("tokens-to-spec: reads DTCG JSON with aliases", () => {
  const r = node(SPEC_JS, join(FIX, "tokens.dtcg.json"));
  assert(r.status === 0, r.stderr);
  const s = JSON.parse(r.stdout);
  const get = (n) => s.tokens.find((t) => t.name === n);
  assert(get("color/ink"), "color/ink missing");
  assert(get("color/link").type === "ALIAS" && get("color/link").values.Light.alias === "color/accent", "alias");
  assert(get("space/md").values.Light === 16, "rem in DTCG");
  assert(get("font/family/body").values.Light === "Inter", "fontFamily array");
});
test("tokens-to-spec: --chunk splits, puts aliases last, argument order does not matter", () => {
  const r = node(SPEC_JS, "--chunk", "5", join(FIX, "tokens.css"));
  assert(r.status === 0, r.stderr);
  const p = JSON.parse(r.stdout).parts;
  assert(p.length === 3 && p.every((x) => x.partial), "expected 3 partial parts");
  assert(p.at(-1).tokens.at(-1).type === "ALIAS", "alias should be last");
});
test("tokens-to-spec: bad input exits non zero", () => {
  assert(node(SPEC_JS).status === 2, "no file should exit 2");
});
test("tokens round trip: CSS -> spec -> CSS -> spec has no differences", () => {
  const tmp = mkdtempSync(join(tmpdir(), "fm-eval-"));
  try {
    const exportJson = join(tmp, "spec.json");
    const first = node(SPEC_JS, join(FIX, "tokens.css"));
    require_ok(first);
    writeText(exportJson, first.stdout);
    const css = node(CSS_JS, exportJson);
    require_ok(css);
    writeText(join(tmp, "round.css"), css.stdout);
    const second = node(SPEC_JS, join(tmp, "round.css"));
    require_ok(second);
    const a = JSON.parse(first.stdout), b = JSON.parse(second.stdout);
    assert(a.tokens.length === b.tokens.length, `token count ${a.tokens.length} vs ${b.tokens.length}`);
    for (const t of a.tokens) {
      const u = b.tokens.find((x) => x.name === t.name);
      assert(u, "lost " + t.name);
      for (const m of a.modes) {
        const x = t.values[m], y = u.values[m];
        if (t.type === "COLOR") for (const k of "rgba") assert(Math.abs(x[k] - y[k]) < 0.003, `${t.name} ${m} ${k}`);
        else assert(JSON.stringify(x) === JSON.stringify(y), `${t.name} ${m}: ${JSON.stringify(x)} vs ${JSON.stringify(y)}`);
      }
    }
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
test("tokens-to-css: dark mode goes in its own block, DTCG output nests", () => {
  const spec1 = node(SPEC_JS, join(FIX, "tokens.css"));
  const tmp = mkdtempSync(join(tmpdir(), "fm-eval-"));
  try {
    writeText(join(tmp, "s.json"), spec1.stdout);
    const css = node(CSS_JS, join(tmp, "s.json")).stdout;
    assert(css.includes(':root {') && css.includes('[data-theme="dark"] {'), "blocks");
    assert(/--font-weight-bold: 700;/.test(css), "weight should be unitless");
    assert(/--space-2: 8px;/.test(css), "space should have px");
    assert(css.includes("var(--color-brand-primary)"), "alias should become var()");
    const dtcg = JSON.parse(node(CSS_JS, join(tmp, "s.json"), "--dtcg").stdout);
    assert(dtcg.color.bg.page.$value === "#ffffff", "dtcg nesting");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

// ------------------------------------------------------------ motion
const MOTION = "skills/figma-motion/scripts/motion-to-css.mjs";
test("motion-to-css: plays once, uses Figma curves, delays, reduced motion", () => {
  const r = node(MOTION, join(FIX, "motion.json"));
  assert(r.status === 0, r.stderr);
  const css = r.stdout;
  assert(css.includes("@keyframes fm-open-button"), "keyframes");
  assert(css.includes("cubic-bezier(0, 0, 0.58, 1)"), "EASE_OUT curve");
  assert(/fm-buy-button \{[^}]*animation-delay: 0\.16s/.test(css), "stagger delay");
  assert(css.includes("1 both"), "should play once");
  assert(!css.includes("infinite"), "must not loop by default");
  assert(css.includes("@media (prefers-reduced-motion: reduce)"), "reduced motion block");
  assert(css.includes("fills tracks"), "unsupported groups should be named");
});
test("motion-to-css: --loop repeats", () => {
  assert(node(MOTION, join(FIX, "motion.json"), "--loop").stdout.includes("infinite"), "no infinite");
});
test("motion-to-css: rotation sign is flipped for CSS", () => {
  const tmp = mkdtempSync(join(tmpdir(), "fm-eval-"));
  try {
    const f = join(tmp, "m.json");
    writeText(f, JSON.stringify({ root: { name: "T" }, nodes: [{ name: "Spin", tracks: { ROTATION: { keyframes: [
      { timelinePosition: 0, value: { type: "FLOAT", value: 0 }, easing: null },
      { timelinePosition: 1, value: { type: "FLOAT", value: 10 }, easing: { type: "LINEAR" } }] } } }] }));
    const css = node(MOTION, f).stdout;
    assert(css.includes("rotate(-10deg)"), "expected rotate(-10deg)");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
test("motion-to-css: empty input exits non zero", () => {
  const tmp = mkdtempSync(join(tmpdir(), "fm-eval-"));
  try { writeText(join(tmp, "e.json"), JSON.stringify({ nodes: [] })); assert(node(MOTION, join(tmp, "e.json")).status === 4, "should exit 4"); }
  finally { rmSync(tmp, { recursive: true, force: true }); }
});
test("extract-frames: cuts frames and a sheet from a synthetic video", () => {
  const find = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  let ff = find.status === 0 ? "ffmpeg" : null;
  if (!ff && process.env.LOCALAPPDATA) {
    const root = join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages");
    if (existsSync(root)) ff = walk(root).find((p) => /ffmpeg\.exe$/i.test(p)) || null;
  }
  if (!ff) return { skip: "ffmpeg not installed" };
  const tmp = mkdtempSync(join(tmpdir(), "fm-eval-"));
  try {
    const mk = spawnSync(ff, ["-y", "-v", "error", "-f", "lavfi", "-i", "testsrc=duration=2:size=160x100:rate=10", join(tmp, "v.mp4")], { encoding: "utf8" });
    assert(mk.status === 0, "could not make test video");
    const r = node("skills/figma-motion/scripts/extract-frames.mjs", join(tmp, "v.mp4"), join(tmp, "out"), "auto:6", "3");
    assert(r.status === 0, r.stderr);
    const j = JSON.parse(r.stdout);
    assert(j.frames.length === 6 && j.frames.every((x) => x.ok), "all 6 frames should cut, including the last");
    assert(j.sheet && existsSync(j.sheet), "sheet missing");
    assert(node("skills/figma-motion/scripts/extract-frames.mjs", join(tmp, "nope.mp4"), join(tmp, "o2"), "auto:4").status === 4, "missing video should exit 4");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

// ------------------------------------------------------------ learn log
test("add-gotcha: numbers the row, escapes pipes, refuses duplicates", () => {
  const tmp = mkdtempSync(join(tmpdir(), "fm-eval-"));
  try {
    const copy = join(tmp, "gotchas.md");
    copyFileSync(join(ROOT, "skills/figma-master/references/gotchas.md"), copy);
    const before = readFileSync(copy, "utf8");
    const lastNum = Math.max(...[...before.matchAll(/^\|\s*(\d+)\s*\|/gm)].map((m) => +m[1]));
    const run = (...a) => node("skills/figma-learn/scripts/add-gotcha.mjs", "--file", copy, ...a);
    const ok = run("--problem", "A test problem with a pipe | inside it", "--fix", "Use the safe way instead");
    assert(ok.status === 0, ok.stderr);
    assert(JSON.parse(ok.stdout).added === lastNum + 1, "wrong number");
    assert(readFileSync(copy, "utf8").includes("pipe \\| inside"), "pipe not escaped");
    assert(run("--problem", "A test problem with a pipe | inside it", "--fix", "Another fix text").status === 3, "duplicate not refused");
    assert(run("--problem", "short", "--fix", "x").status === 2, "short input not refused");
    const dry = run("--problem", "Different dry run problem text here", "--fix", "Dry fix text", "--dry");
    assert(dry.status === 0 && !readFileSync(copy, "utf8").includes("Different dry run"), "dry run wrote");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
test("gotcha list is numbered 1..N with no gaps or repeats", () => {
  const nums = [...read("skills/figma-master/references/gotchas.md").matchAll(/^\|\s*(\d+)\s*\|/gm)].map((m) => +m[1]);
  nums.forEach((n, i) => assert(n === i + 1, `row ${i + 1} is numbered ${n}`));
});

// ------------------------------------------------------------ helpers (hoisted by function declarations)
function writeText(p, text) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, text); }
function require_ok(r) { if (r.status !== 0) throw new Error("command failed: " + (r.stderr || r.stdout).slice(0, 200)); }

// ------------------------------------------------------------ report
const pad = (s, n) => s + " ".repeat(Math.max(0, n - s.length));
let pass = 0, fail = 0, skip = 0;
for (const r of results) {
  if (r.status === "pass") pass++; else if (r.status === "fail") fail++; else skip++;
  const mark = r.status === "pass" ? "PASS" : r.status === "fail" ? "FAIL" : "SKIP";
  if (r.status !== "pass" || process.argv.includes("--verbose")) console.log(`${mark}  ${pad(r.name, 70)} ${r.note || ""}`);
}
console.log(`\n${pass} passed, ${fail} failed, ${skip} skipped (of ${results.length})`);
process.exit(fail ? 1 : 0);
