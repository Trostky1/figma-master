#!/usr/bin/env node
// figma-master: turn a page read (rip-dom.js output) into a reusable STYLE folder.
// Usage: node rip-to-style.mjs <rip.json> <outDir> [--name <style-name>]
// Writes: tokens.json (DTCG, ready for figma-sync), tokens.css, DESIGN.md, components.json,
//         evidence.json, provenance.md.
// Roles (page background, strong text, accents, display font...) are guesses with evidence.
// A person must review them before the style is used. Nothing here copies text, images, or fonts.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--name");
const outArg = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--name")[1];
const ni = args.indexOf("--name");
if (!file || !outArg) { console.error("Usage: node rip-to-style.mjs <rip.json> <outDir> [--name style-name]"); process.exit(2); }
const rip = JSON.parse(readFileSync(file, "utf8"));
const outDir = resolve(outArg);
mkdirSync(outDir, { recursive: true });
const host = (() => { try { return new URL(rip.url).hostname.replace(/^www\./, ""); } catch { return "source"; } })();
const styleName = ni >= 0 ? args[ni + 1] : host;

// ---------------- color helpers ----------------
const clamp = (x) => Math.min(1, Math.max(0, x));
const toHex = (r, g, b) => "#" + [r, g, b].map((v) => Math.round(clamp(v) * 255).toString(16).padStart(2, "0")).join("");
const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
const lum = (h) => { const [r, g, b] = hexRgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = lum(a) >= lum(b) ? [a, b] : [b, a]; return (lum(x) + 0.05) / (lum(y) + 0.05); };
const sat = (h) => { const [r, g, b] = hexRgb(h); const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
const dist = (a, b) => { const x = hexRgb(a), y = hexRgb(b); return Math.sqrt(x.reduce((s, v, i) => s + (v - y[i]) ** 2, 0)) * 255; };
const opaque = (h) => typeof h === "string" && /^#[0-9a-f]{6}$/i.test(h);
function oklchToHex(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b, m_ = L - 0.1055613458 * a - 0.0638541728 * b, s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return toHex(gam(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), gam(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), gam(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s));
}
function parseColor(v) {
  v = String(v).trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  let m = /^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(v);
  if (m) return toHex(+m[1] / 255, +m[2] / 255, +m[3] / 255);
  m = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?))?\s*\)$/i.exec(v);
  if (m) { if (m[5] && parseFloat(m[5]) < 1 && !m[5].includes("%")) return null; return oklchToHex(m[2] ? +m[1] / 100 : +m[1], +m[3], +m[4]); }
  return null;
}

// ---------------- source variables (names and exact colors) ----------------
const varColors = [];
const varsByName = rip.cssVariables || {};
for (const [name, val] of Object.entries(varsByName)) { const hx = parseColor(val); if (hx) varColors.push({ name, hex: hx }); }
const nameFor = (hx) => { let best = null; for (const v of varColors) { const d = dist(hx, v.hex); if (d < 10 && (!best || d < best.d)) best = { name: v.name, d }; } return best ? best.name : null; };

// ---------------- palette roles ----------------
const bgs = (rip.bgColors || []).filter((b) => opaque(b.c));
const page = (bgs[0] || { c: "#ffffff" }).c;
const alt = (bgs.find((b) => b.c !== page && b.areaShare >= 0.01 && lum(b.c) > 0.1) || {}).c || null;
const inverse = (bgs.filter((b) => lum(b.c) < 0.08 && b.areaShare >= 0.01).sort((a, b) => lum(a.c) - lum(b.c))[0] || {}).c || null;
const totalText = (rip.textColors || []).reduce((s, t) => s + t.w, 0) || 1;
const texts = (rip.textColors || []).filter((t) => opaque(t.c)).map((t) => ({ ...t, cr: contrast(t.c, page), share: t.w / totalText }));
const strong = texts.filter((t) => t.share >= 0.03).sort((a, b) => b.cr - a.cr)[0] || texts[0];
const body = texts.filter((t) => t.cr >= 4.5).sort((a, b) => b.w - a.w)[0] || strong;
const muted = texts.filter((t) => t.cr >= 3 && t.cr < (body ? body.cr : 99) && t.c !== (body && body.c) && sat(t.c) < 0.25).sort((a, b) => b.w - a.w)[0] || null;
const onInverse = inverse ? texts.filter((t) => contrast(t.c, inverse) >= 4.5).sort((a, b) => lum(b.c) - lum(a.c))[0] : null;
const lineC = ((rip.borderColors || []).find((b) => opaque(b.c)) || {}).c || null;

// accents: saturated colors seen in text, buttons, cards, or named in CSS variables
const accentSeen = new Map();
const seeAccent = (hx, w) => { if (!opaque(hx) || sat(hx) < 0.4 || lum(hx) < 0.02) return; for (const k of accentSeen.keys()) if (dist(k, hx) < 14) { accentSeen.set(k, accentSeen.get(k) + w); return; } accentSeen.set(hx, w); };
texts.forEach((t) => seeAccent(t.c, t.n));
(rip.buttons || []).forEach((b) => { seeAccent(b.bg, b.n * 3); seeAccent(b.border, b.n); });
(rip.cards || []).forEach((c) => seeAccent(c.border, c.n));
varColors.filter((v) => /accent|brand|primary|gold|patina|vermilion|highlight/i.test(v.name)).forEach((v) => seeAccent(v.hex, 2));
const accents = [...accentSeen.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([hx, w]) => ({ hex: hx, weight: w, source: nameFor(hx) }));

// --set "bg/alt=#fdfdfd;accent/1=#fe6901": fix a role by hand after review. Marked "set by hand" in DESIGN.md.
const manual = {};
{
  const si2 = args.indexOf("--set");
  if (si2 >= 0) for (const part of String(args[si2 + 1] || "").split(";").map((s) => s.trim()).filter(Boolean)) {
    const [k, v] = part.split("=");
    if (/^#[0-9a-f]{6}$/i.test(v || "")) manual[k.trim()] = v.toLowerCase();
  }
}
const setBy = (role, current) => manual[role] || current;
const applyManual = () => {
  if (manual["bg/alt"]) alt2 = manual["bg/alt"];
  accents.forEach((a, i) => { if (manual[`accent/${i + 1}`]) { a.hex = manual[`accent/${i + 1}`]; a.source = "set by hand"; } });
  for (const [k, v] of Object.entries(manual)) { const m = /^accent\/(\d+)$/.exec(k); if (m && +m[1] > accents.length) accents.push({ hex: v, weight: 0, source: "set by hand" }); }
};
let alt2 = alt;
applyManual();

// ---------------- type ----------------
const tb = rip.typeByTag || {};
const stripVariant = (f) => (f || "").replace(/\s+(Hero|Display|Variable|VF|Text)$/i, "");
const role = (t, extra = {}) => (t ? { family: t.fam, figmaFamilyGuess: stripVariant(t.fam), size: Math.round(t.size * 100) / 100, weight: +t.weight || 400, lineHeight: +(parseFloat(t.lh) / t.size).toFixed(2) || 1.3, letterSpacing: t.ls, ...extra } : null);
const monoFam = (rip.fonts || []).find((f) => /mono|code|courier/i.test(f.family));
const type = {
  display: role(tb.h1), headline: role(tb.h2), title: role(tb.h3), body: role(tb.p),
  small: role(tb.small || tb.li),
  mono: tb.code ? role(tb.code) : monoFam ? { family: monoFam.family, figmaFamilyGuess: stripVariant(monoFam.family), size: 13, weight: 400, lineHeight: 1.5 } : null,
};
// --fonts "display=Newsreader:300:64;body=Inter:400:18;mono=JetBrains Mono:400:14"
// For styles read from a picture: fonts are chosen by looking, not measured. They are marked "manual".
const fi = args.indexOf("--fonts");
if (fi >= 0) {
  for (const part of String(args[fi + 1] || "").split(";").map((s) => s.trim()).filter(Boolean)) {
    const [k, rest] = part.split("=");
    const [family, weight = "400", size = k === "display" ? "64" : "16"] = (rest || "").split(":");
    if (!["display", "headline", "title", "body", "small", "mono"].includes(k) || !family) continue;
    type[k] = { family, figmaFamilyGuess: family, size: +size, weight: +weight, lineHeight: k === "display" ? 1.05 : k === "body" ? 1.5 : 1.3, letterSpacing: "normal", manual: true };
  }
}
// --stand-in "Inter Tight=Geist": the family is not in Figma. Use a stand in and say so (kept in DESIGN.md).
const sti = args.indexOf("--stand-in");
if (sti >= 0) {
  const map = Object.fromEntries(String(args[sti + 1] || "").split(";").map((s) => s.split("=").map((x) => x.trim())).filter((p) => p.length === 2 && p[0] && p[1]));
  for (const v of Object.values(type)) if (v && map[v.family]) { v.figmaFamilyGuess = map[v.family]; v.standIn = true; }
}
const families = { display: type.display && type.display.family, body: type.body && type.body.family, mono: type.mono && type.mono.family };

// ---------------- spacing, radius, shadow, motion ----------------
const spaceVars = Object.entries(varsByName).filter(([k, v]) => /spac|space/i.test(k) && /^\d+(\.\d+)?px$/.test(v.trim())).map(([k, v]) => ({ name: k, px: parseFloat(v) })).sort((a, b) => a.px - b.px);
const observedSpace = [...new Set([...(rip.spacing || []), ...(rip.gaps || [])].map((s) => Math.round(s.px)))].sort((a, b) => a - b);
const space = spaceVars.length >= 4 ? spaceVars.map((s) => s.px) : [4, 8, 12, 16, 24, 32, 48, 64, 96];
const radVars = Object.entries(varsByName).filter(([k, v]) => /radius/i.test(k) && /^\d+px$/.test(v.trim())).map(([k, v]) => ({ name: k, px: parseFloat(v) })).sort((a, b) => a.px - b.px);
const radObs = (rip.radii || []).filter((r) => r.px < 40).map((r) => r.px);
const radius = {
  sm: (radVars.find((r) => r.px >= 2) || {}).px ?? (radObs.filter((r) => r >= 2).sort((a, b) => a - b)[0] || 4),
  md: (radVars.find((r) => r.px >= 6 && r.px <= 14) || {}).px ?? ((rip.radii || []).filter((r) => r.px >= 5 && r.px <= 14).sort((a, b) => b.n - a.n)[0] || { px: 8 }).px,
  lg: (radVars.find((r) => r.px >= 14 && r.px < 40) || {}).px ?? Math.round(((rip.radii || []).filter((r) => r.px >= 5 && r.px <= 14).sort((a, b) => b.n - a.n)[0] || { px: 8 }).px * 1.75),
  pill: (rip.radii || []).some((r) => r.px >= 40) || radVars.some((r) => r.px >= 100) ? 999 : null,
};
const shadows = (rip.shadows || []).slice(0, 3).map((s) => s.css);
const durations = [...new Set(((rip.motion || {}).durationsMs || []).map((d) => d.ms))].sort((a, b) => a - b).slice(0, 5);
const easings = ((rip.motion || {}).easings || []).map((e) => e.css).filter((e) => e !== "ease").slice(0, 3);

// ---------------- components ----------------
const btn = (rip.buttons || []).map((b) => {
  const hasBg = b.bg !== "none" && opaque(b.bg);
  const dark = hasBg && lum(b.bg) < 0.12;
  const isAccent = hasBg && sat(b.bg) > 0.4;
  const kind = dark || isAccent ? "primary" : b.border !== "none" || (hasBg && contrast(b.bg, page) > 1.05) ? "secondary" : "ghost";
  return { kind, shape: b.radius >= 40 ? "pill" : "rect", bg: b.bg, color: b.color, radius: b.radius, padX: b.padX, padY: b.padY, height: b.h, font: b.fam, size: b.size, weight: +b.weight || 400, border: b.border, shadow: b.shadow, seen: b.n };
});
const cards = (rip.cards || []).map((c) => ({ bg: c.bg, radius: c.radius, border: c.border, borderWidth: c.borderW, shadow: c.shadow, padding: c.pad, size: `${c.w}x${c.h}`, seen: c.n }));

// ---------------- write files ----------------
const dim = (n) => `${n}px`;
const tokens = { color: { bg: { page: { $type: "color", $value: page } }, text: {}, border: {}, accent: {} }, font: { family: {}, size: {}, weight: {} }, space: {}, radius: {} };
if (alt2) tokens.color.bg.alt = { $type: "color", $value: alt2 };
if (inverse) tokens.color.bg.inverse = { $type: "color", $value: inverse };
if (strong) tokens.color.text.strong = { $type: "color", $value: strong.c };
if (body) tokens.color.text.body = { $type: "color", $value: body.c };
if (muted) tokens.color.text.muted = { $type: "color", $value: muted.c };
if (onInverse) tokens.color.text["on-inverse"] = { $type: "color", $value: onInverse.c };
if (lineC) tokens.color.border.line = { $type: "color", $value: lineC };
accents.forEach((a, i) => { tokens.color.accent[String(i + 1)] = { $type: "color", $value: a.hex }; });
for (const [k, v] of Object.entries(families)) if (v) tokens.font.family[k] = { $type: "fontFamily", $value: type[k] ? type[k].figmaFamilyGuess : v };
for (const [k, v] of Object.entries(type)) if (v) { tokens.font.size[k] = { $type: "dimension", $value: dim(v.size) }; tokens.font.weight[k] = { $type: "number", $value: v.weight }; }
space.forEach((s, i) => { tokens.space[String(i + 1)] = { $type: "dimension", $value: dim(s) }; });
for (const [k, v] of Object.entries(radius)) if (v != null) tokens.radius[k] = { $type: "dimension", $value: dim(v) };
for (const k of ["border", "accent"]) if (!Object.keys(tokens.color[k]).length) delete tokens.color[k];
if (!Object.keys(tokens.color.text).length) delete tokens.color.text;

const flat = (o, p = [], out = []) => { for (const [k, v] of Object.entries(o)) { if (v && typeof v === "object" && "$value" in v) out.push([[...p, k].join("-"), v.$value, v.$type]); else if (v && typeof v === "object") flat(v, [...p, k], out); } return out; };
const css = ":root {\n" + flat(tokens).map(([n, v, t]) => `  --${n}: ${t === "fontFamily" ? `"${v}"` : v};`).join("\n") + "\n}\n";

const sourceName = (hx) => (hx && nameFor(hx)) || "";
const row = (...c) => "| " + c.join(" | ") + " |";
const md = [];
md.push(`---\nname: "${styleName}"\nsource: "${rip.url}"\nread: "${rip.readAt}"\nstatus: "needs human review"\nmethod: "figma-master rip-dom.js (computed styles in a real browser) at ${rip.viewport.w}px wide"\n---\n`);
md.push(`# ${styleName}: style read\n`);
md.push(`This file describes the SYSTEM (colors, type, spacing, shapes, motion). It does not hold the site's text, images, logos, or font files. Roles below are guesses from evidence. Check them before use.\n`);
md.push(`## Color\n`);
md.push(row("Role", "Hex", "Source variable or evidence"), row("---", "---", "---"));
md.push(row("bg/page", page, `${sourceName(page)} covers ${Math.round(bgs[0].areaShare * 100)}% of painted area`));
if (alt2) md.push(row("bg/alt", alt2, manual["bg/alt"] ? "set by hand" : sourceName(alt2)));
if (inverse) md.push(row("bg/inverse", inverse, `${sourceName(inverse)} dark surface`));
if (strong) md.push(row("text/strong", strong.c, `${sourceName(strong.c)} contrast ${strong.cr.toFixed(1)}:1`));
if (body) md.push(row("text/body", body.c, `most used text color, contrast ${body.cr.toFixed(1)}:1`));
if (muted) md.push(row("text/muted", muted.c, `contrast ${muted.cr.toFixed(1)}:1`));
if (onInverse) md.push(row("text/on-inverse", onInverse.c, ""));
if (lineC) md.push(row("border/line", lineC, "most common border"));
accents.forEach((a, i) => md.push(row(`accent/${i + 1}`, a.hex, `${a.source || "seen in " + a.weight + " places"}`)));
md.push(`\nAccents are colors with real saturation. Use them for a few marks, not for large areas, unless the source does.\n`);
md.push(`## Type\n`);
md.push(row("Role", "Family", "Size", "Weight", "Line height", "Note"), row("---", "---", "---", "---", "---", "---"));
for (const [k, v] of Object.entries(type)) if (v) md.push(row(k, v.family + (v.family !== v.figmaFamilyGuess ? ` (Figma: ${v.figmaFamilyGuess})` : ""), v.size + "px", v.weight, v.lineHeight, v.standIn ? "STAND IN: the real family is not in Figma" + (v.manual ? "; chosen by looking, not measured" : "") : v.manual ? "chosen by looking at the image, not measured" : k === "display" ? "thin or heavy display weights carry the look" : ""));
md.push(`\nCheck every family exists in Figma with \`listAvailableFontsAsync()\`. A missing family needs a stand in, and you must say so.\n`);
md.push(`## Space, shape, depth, motion\n`);
md.push(`- Space scale (px): ${space.join(", ")}${spaceVars.length >= 4 ? " (from the site's own variables)" : " (standard scale; observed values: " + observedSpace.slice(0, 14).join(", ") + ")"}`);
md.push(`- Radius: ${Object.entries(radius).filter(([, v]) => v != null).map(([k, v]) => k + " " + v + "px").join(", ")}`);
md.push(`- Shadows seen (raw CSS, Figma needs them split into layers):\n${shadows.map((s) => "  - `" + s + "`").join("\n") || "  - none"}`);
md.push(`- Motion: durations ${durations.join(", ")} ms. Easing: ${easings.join("; ") || "default ease"}\n`);
md.push(`## Components seen\n`);
md.push(row("Button", "Shape", "Fill", "Text", "Radius", "Height", "Seen"), row("---", "---", "---", "---", "---", "---", "---"));
btn.forEach((b) => md.push(row(b.kind, b.shape, b.bg, b.color, b.radius + "px", b.height + "px", b.seen)));
md.push(`\n${cards.length ? "Cards seen: " + cards.map((c) => `${c.size}, radius ${c.radius}px, ${c.border !== "none" ? "border " + c.border : "no border"}`).join("; ") : "No cards found."}\n`);
md.push(`## Not read\n`);
(rip.notRead || []).forEach((n) => md.push(`- ${n}`));
md.push(`\n## How to use\n\n1. Review the roles above and fix any wrong guess in \`tokens.json\`.\n2. Sync tokens to Figma with figma-sync, or build a deck or screen from them.\n3. Replace all text, images, logos, and brand marks with your own.\n`);

const provenance = `# Provenance\n\n- Source: ${rip.url}\n- Read on: ${rip.readAt}\n- Method: computed styles read in a real browser (${rip.elementsRead} elements, ${rip.visible} visible), viewport ${rip.viewport.w} px\n- Permission: <fill in: own site, open license, or the user said yes for this URL on this date>\n- Terms checked: <fill in: robots.txt and terms of use read? yes or no>\n- Copied: style values only (colors, type sizes, spacing, radius, shadow, motion timing)\n- NOT copied: text, images, logos, icons, font files, page code\n- Status: needs human review\n- License note: values are facts about a design. The composition, copy, images, and brand marks of the source are not ours to reuse.\n`;

writeFileSync(join(outDir, "tokens.json"), JSON.stringify(tokens, null, 2));
writeFileSync(join(outDir, "tokens.css"), css);
writeFileSync(join(outDir, "DESIGN.md"), md.join("\n"));
writeFileSync(join(outDir, "components.json"), JSON.stringify({ buttons: btn, cards }, null, 2));
writeFileSync(join(outDir, "evidence.json"), JSON.stringify({ roles: { page, alt: alt2, inverse, strong: strong && strong.c, body: body && body.c, muted: muted && muted.c, onInverse: onInverse && onInverse.c, line: lineC, accents }, type, families, space, observedSpace, radius, shadows, durations, easings, sourceVariables: varsByName }, null, 2));
writeFileSync(join(outDir, "provenance.md"), provenance);
console.log(JSON.stringify({ outDir, files: ["tokens.json", "tokens.css", "DESIGN.md", "components.json", "evidence.json", "provenance.md"], page, accents: accents.map((a) => a.hex), families }, null, 2));
