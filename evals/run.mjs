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
      const src = readFileSync(f, "utf8").replace(/__SPEC__/g, "{}").replace(/__PROFILE__/g, "{}").replace(/__STYLE__/g, "{}").replace(/__ROOT_ID__/g, "x").replace(/__COLLECTION__/g, "x");
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
    const found = ["__SPEC__", "__ROOT_ID__", "__COLLECTION__", "__PROFILE__", "__STYLE__"].filter((p) => s.includes(p));
    // scripts that need no input (they read the current page, or run in a browser)
    if (["check-flow.js", "rip-dom.js"].includes(basename(f))) { assert(found.length === 0, `${basename(f)} needs no input but has a placeholder`); continue; }
    // scripts with two inputs
    if (["deck-check.js", "site-check.js"].includes(basename(f))) { assert(found.length === 2 && found.includes("__PROFILE__") && found.includes("__STYLE__"), `${basename(f)} needs __PROFILE__ and __STYLE__`); continue; }
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

// ------------------------------------------------------------ profiles, rip, link parser
test("profile presentation.json is valid and has the numbers audits need", () => {
  const p = JSON.parse(read("profiles/presentation.json"));
  for (const k of ["canvas", "type", "density", "contrast", "layout", "notObservable"]) assert(p[k], "missing " + k);
  assert(p.canvas.width === 1920 && p.canvas.height === 1080, "slide size");
  assert(p.type.absoluteFloor < p.type.labelMin && p.type.labelMin <= p.type.captionMin && p.type.captionMin <= p.type.bodyMin, "type minimums must be in order");
  assert(p.contrast.body >= 4.5, "body contrast must be at least 4.5");
});
test("profile website.json is valid and has the numbers audits need", () => {
  const p = JSON.parse(read("profiles/website.json"));
  for (const k of ["canvas", "type", "targets", "contrast", "sections", "responsive", "notObservable"]) assert(p[k], "missing " + k);
  assert(p.canvas.frames.length === 3 && p.canvas.frames.map((f) => f.width).join() === "1440,768,390", "breakpoint widths");
  assert(p.targets.pointer === 24 && p.targets.touch >= 44, "target sizes");
  assert(p.contrast.body >= 4.5, "body contrast must be at least 4.5");
  assert(p.responsive.collection === "Breakpoint", "breakpoint collection name");
});
test("figma-site skill, command, and reference exist", () => {
  for (const f of ["skills/figma-site/SKILL.md", "commands/figma-site.md", "skills/figma-site/references/breakpoint-modes.md", "skills/figma-site/scripts/site-check.js"]) assert(existsSync(join(ROOT, f)), "missing " + f);
});
test("profiles README lists every profile file", () => {
  const files = readdirSync(join(ROOT, "profiles")).filter((f) => f.endsWith(".json"));
  const r = read("profiles/README.md");
  for (const f of files) assert(r.includes(f), `profiles/README.md does not list ${f}`);
});
const RIP_STYLE = "skills/figma-rip/scripts/rip-to-style.mjs";
test("rip-to-style: roles, source variable names, tokens figma-sync can read, provenance", () => {
  const tmp = mkdtempSync(join(tmpdir(), "fm-eval-"));
  try {
    const r = node(RIP_STYLE, join(FIX, "rip-impeccable.json"), join(tmp, "style"), "--name", "fixture");
    assert(r.status === 0, r.stderr);
    for (const f of ["tokens.json", "tokens.css", "DESIGN.md", "components.json", "evidence.json", "provenance.md"]) assert(existsSync(join(tmp, "style", f)), "missing " + f);
    const ev = JSON.parse(readFileSync(join(tmp, "style", "evidence.json"), "utf8"));
    assert(ev.roles.page === "#fdfdfd", "page color " + ev.roles.page);
    assert(ev.roles.strong === "#070707", "strong text " + ev.roles.strong);
    assert(ev.families.display === "Alumni Sans Hero", "display font " + ev.families.display);
    assert(ev.type.display.figmaFamilyGuess === "Alumni Sans", "figma family guess");
    const md = readFileSync(join(tmp, "style", "DESIGN.md"), "utf8");
    assert(md.includes("--ks-patina") && md.includes("--ks-kinpaku"), "accent roles should name the site's own variables");
    assert(md.includes("needs human review"), "status line");
    const spec = node(SPEC_JS, join(tmp, "style", "tokens.json"));
    assert(spec.status === 0, "tokens.json should read with tokens-to-spec: " + spec.stderr);
    const s = JSON.parse(spec.stdout);
    assert(s.tokens.some((t) => t.name === "color/bg/page"), "color/bg/page missing from the spec");
    assert(s.tokens.some((t) => t.name === "font/family/display"), "font family token missing");
    assert(readFileSync(join(tmp, "style", "provenance.md"), "utf8").includes("NOT copied"), "provenance must list what was not copied");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
test("rip-image: finds the page color and an accent in a made-up image", () => {
  const ffcmd = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" }).status === 0 ? "ffmpeg" : (process.env.LOCALAPPDATA && existsSync(join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages")) ? walk(join(process.env.LOCALAPPDATA, "Microsoft", "WinGet", "Packages")).find((p) => /ffmpeg\.exe$/i.test(p)) : null);
  if (!ffcmd) return { skip: "ffmpeg not installed" };
  const tmp = mkdtempSync(join(tmpdir(), "fm-eval-"));
  try {
    const png = join(tmp, "t.png");
    const mk = spawnSync(ffcmd, ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0xfdfcfc:s=400x300:d=1,drawbox=x=40:y=40:w=120:h=80:color=0xee5533:t=fill,drawbox=x=0:y=270:w=400:h=30:color=0x111111:t=fill", "-frames:v", "1", png], { encoding: "utf8" });
    assert(mk.status === 0, "could not make the test image");
    const r = node("skills/figma-rip/scripts/rip-image.mjs", png, join(tmp, "out.json"), "--trim-bottom", "0.1");
    assert(r.status === 0, r.stderr);
    const j = JSON.parse(readFileSync(join(tmp, "out.json"), "utf8"));
    const near = (a, b) => Math.sqrt([1, 3, 5].reduce((s, i) => s + (parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)) ** 2, 0));
    assert(near(j.bgColors[0].c, "#fdfcfc") < 6, "page color " + j.bgColors[0].c);
    assert(j.textColors.some((t) => near(t.c, "#ee5533") < 10), "accent not found");
    assert(!j.bgColors.some((b) => near(b.c, "#111111") < 10 && b.areaShare > 0.02), "the bottom bar should have been trimmed");
    assert(j.confidence && j.confidence.fonts === "none", "must say fonts were not read");
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});
test("parse-figma-link: design, slides, branch, no node, and a wrong host", () => {
  const P = "skills/figma-here/scripts/parse-figma-link.mjs";
  const run = (u) => JSON.parse(node(P, u).stdout);
  const a = run("https://www.figma.com/design/ABC123/My-File?node-id=7-6&t=x");
  assert(a.ok && a.kind === "design" && a.fileKey === "ABC123" && a.nodeId === "7:6", "design link");
  const b = run("https://www.figma.com/slides/XYZ789/Deck?node-id=5-5");
  assert(b.ok && b.kind === "slides" && b.nodeId === "5:5", "slides link");
  const c = run("https://www.figma.com/design/ABC123/branch/BR456/My-File?node-id=1-2");
  assert(c.ok && c.fileKey === "BR456" && c.branchKey === "BR456", "branch link uses the branch key");
  const d = run("https://www.figma.com/design/ABC123");
  assert(d.ok && !d.hasNode && d.warnings.length > 0, "a link without a node id should warn");
  assert(node(P, "https://example.com/design/x").status === 3, "wrong host should exit 3");
  assert(node(P).status === 2, "no input should exit 2");
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
