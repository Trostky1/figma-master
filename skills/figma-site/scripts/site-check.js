// figma-master: check a responsive website page set against the website profile and a style kit.
// READ ONLY. Run inside use_figma on the Design file page that holds frames named "<Page> / <Breakpoint> <width>".
// Replace __PROFILE__ with profiles/website.json (the whole object).
// Replace __STYLE__ with { "colors": ["#hex"], "fonts": ["Family"], "skipNames": ["Type sample", "Chip #"] }.
//   skipNames: layer name prefixes left out of the style check (for example palette sample swatches).

const PROFILE = __PROFILE__;
const STYLE = __STYLE__;

const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => { const [hi, lo] = lum(a) >= lum(b) ? [a, b] : [b, a]; return (lum(hi) + 0.05) / (lum(lo) + 0.05); };
const toHex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
const hexRgb = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const dist = (a, b) => Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) * 255;
const solid = (n) => { if (!("fills" in n) || n.fills === figma.mixed || !Array.isArray(n.fills)) return null; const f = n.fills.find((p) => p.type === "SOLID" && p.visible !== false); return f ? { color: f.color, opacity: f.opacity ?? 1, bound: !!(f.boundVariables && f.boundVariables.color) } : null; };
const baseFamily = (f) => f.replace(/\s+(Hero|Display|Variable|VF|Text)$/i, "");
const palette = (STYLE.colors || []).map(hexRgb);
const fontsAllowed = new Set((STYLE.fonts || []).map(baseFamily));
const skip = (n) => (STYLE.skipNames || []).some((p) => { let x = n; while (x) { if (x.name && x.name.startsWith(p)) return true; x = x.parent; } return false; });

const frames = figma.currentPage.children.filter((n) => n.type === "FRAME" && / \/ (Desktop|Tablet|Mobile)\b/i.test(n.name));
const bpCollection = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === (PROFILE.responsive.collection || "Breakpoint"));
const W = Object.fromEntries(PROFILE.canvas.frames.map((f) => [f.name, f]));
const weights = { Blocker: 12, Critical: 8, Warning: 4, Tip: 1 };
const report = [], groups = new Map(), famCount = new Map();
const interactiveRe = /button|cta|nav link|menu|toggle|input|chip|plus|link/i;

for (const frame of frames) {
  const bpName = /(Desktop|Tablet|Mobile)/i.exec(frame.name)[1].replace(/^./, (c) => c.toUpperCase());
  const pageName = frame.name.split(" / ")[0];
  const findings = [];
  const add = (node, rule, severity, detail) => findings.push({ id: node.id, name: node.name, rule, severity, detail });
  const box = frame.absoluteBoundingBox;
  const rel = (n) => { const b = n.absoluteBoundingBox; return b ? { x: b.x - box.x, y: b.y - box.y, w: b.width, h: b.height } : null; };
  const all = frame.findAll((n) => n.visible !== false);
  const touch = PROFILE.targets.touchFrames.includes(bpName);

  // frame setup
  if (Math.abs(frame.width - W[bpName].width) > 2) add(frame, "frame-width", "Warning", `Width ${Math.round(frame.width)}, profile says ${W[bpName].width}.`);
  const mode = bpCollection && frame.explicitVariableModes ? frame.explicitVariableModes[bpCollection.id] : null;
  const modeName = bpCollection && mode ? (bpCollection.modes.find((m) => m.modeId === mode) || {}).name : null;
  if (bpCollection && modeName !== W[bpName].mode) add(frame, "breakpoint-mode", "Warning", `Explicit Breakpoint mode is ${modeName || "not set"}, expected ${W[bpName].mode}. Sizes will not follow the breakpoint.`);
  const tops = frame.children.map((c) => c.name);
  for (const need of PROFILE.sections.required) if (!tops.some((t) => new RegExp(need, "i").test(t))) add(frame, "missing-section", "Warning", `No "${need}" section.`);
  const g = groups.get(pageName) || {}; g[bpName] = { tops, texts: new Set(all.filter((n) => n.type === "TEXT").map((t) => t.characters.trim())) }; groups.set(pageName, g);

  // auto layout, overflow, structure
  for (const n of all) {
    if (n.type === "FRAME" && n.children && n.children.length >= 2 && n.layoutMode === "NONE" && !skip(n)) add(n, "no-auto-layout", "Warning", `${n.children.length} children, no auto layout.`);
    const r = rel(n);
    if (r && n.id !== frame.id && (r.x + r.w > box.width + 1 || r.x < -1) && !skip(n)) add(n, "horizontal-overflow", "Critical", `Runs past the ${bpName} frame edge by ${Math.round(Math.max(r.x + r.w - box.width, -r.x))} px.`);
  }

  // text
  let cta = null;
  for (const t of all.filter((n) => n.type === "TEXT")) {
    const segs = t.getStyledTextSegments(["fontSize", "fontName", "lineHeight"]);
    const size = Math.min(...segs.map((s) => s.fontSize)); const fam = segs[0].fontName.family;
    famCount.set(fam, (famCount.get(fam) || 0) + 1);
    const chars = t.characters.trim();
    const isLabel = t.textCase === "UPPER" && chars.length < 60;
    if (size < PROFILE.type.absoluteFloor) add(t, "text-below-floor", "Critical", `Font size ${size}.`);
    else if (isLabel ? size < PROFILE.type.labelMin : (chars.length > 40 ? size < PROFILE.type.bodyMin : size < PROFILE.type.captionMin)) add(t, "text-small", "Warning", `Font size ${size} is too small for ${isLabel ? "a label" : chars.length > 40 ? "body text" : "short text"} (${isLabel ? PROFILE.type.labelMin : chars.length > 40 ? PROFILE.type.bodyMin : PROFILE.type.captionMin}).`);
    // line length
    if (chars.length >= 80 && t.height > 0) {
      const lh = segs[0].lineHeight && segs[0].lineHeight.unit === "PIXELS" ? segs[0].lineHeight.value : segs[0].lineHeight && segs[0].lineHeight.unit === "PERCENT" ? size * segs[0].lineHeight.value / 100 : size * 1.4;
      const lines = Math.max(1, Math.round(t.height / lh)); const cpl = chars.length / lines;
      if (cpl > PROFILE.type.lineLength.max) add(t, "line-too-long", "Warning", `About ${Math.round(cpl)} characters per line. Keep it under ${PROFILE.type.lineLength.max}.`);
    }
    // contrast
    const fg = solid(t); let bg = null, p = t.parent; while (p && p.id !== frame.parent.id) { const f = solid(p); if (f && f.opacity >= 0.99) { bg = f.color; break; } p = p.parent; }
    if (fg && bg) { const need = size >= PROFILE.contrast.largeTextPx ? PROFILE.contrast.large : PROFILE.contrast.body; const cr = ratio(fg.color, bg); if (cr < need) add(t, "low-contrast", cr < 3 ? "Blocker" : "Critical", `Contrast ${cr.toFixed(2)}:1, needs ${need}:1.`); }
    if (fontsAllowed.size && !fontsAllowed.has(baseFamily(fam)) && !skip(t)) add(t, "off-style-font", "Warning", `Font "${fam}" is not in the style kit.`);
  }

  // targets (instances that look interactive, plus text links)
  for (const n of all) {
    const named = interactiveRe.test(n.name) && !/label|text|sign|rule|dot|row|list|logo|footer note/i.test(n.name.replace(/nav link|footer link/i, ""));
    const isInst = n.type === "INSTANCE" || (n.type === "TEXT" && /link/i.test(n.name)) || (n.type === "FRAME" && /^(Go Button|Chip )/.test(n.name));
    if (!(named && isInst)) continue;
    const r = rel(n); if (!r) continue;
    const m = Math.min(r.w, r.h);
    if (!cta && /button|cta/i.test(n.name)) cta = r.y;
    if (m < PROFILE.targets.pointer) add(n, "tiny-target", "Blocker", `Target ${Math.round(r.w)}x${Math.round(r.h)} is below ${PROFILE.targets.pointer}.`);
    else if (touch && m < PROFILE.targets.touch) add(n, "small-target", "Warning", `Target ${Math.round(r.w)}x${Math.round(r.h)} is below ${PROFILE.targets.touch} on ${bpName}.`);
  }
  if (cta === null) add(frame, "no-cta", "Warning", "No button found.");
  else if (cta > PROFILE.layout.primaryCtaWithinPx) add(frame, "cta-below-fold", "Warning", `First button is at y ${Math.round(cta)}, past ${PROFILE.layout.primaryCtaWithinPx}.`);

  // hardcoded colors and style fidelity
  for (const n of all) {
    if (skip(n)) continue;
    for (const p of [...(("fills" in n && Array.isArray(n.fills)) ? n.fills : [])]) {
      if (p.type !== "SOLID" || p.visible === false) continue;
      if (!(p.boundVariables && p.boundVariables.color)) add(n, "hardcoded-fill", "Warning", `${toHex(p.color)} is not bound to a variable.`);
      if (palette.length && Math.min(...palette.map((x) => dist(x, p.color))) > 14) add(n, "off-style-color", "Warning", `${toHex(p.color)} is not in the style kit.`);
    }
  }

  const counts = { Blocker: 0, Critical: 0, Warning: 0, Tip: 0 }; for (const f of findings) counts[f.severity]++;
  const byRule = {}; for (const f of findings) { byRule[f.rule] = byRule[f.rule] || { n: 0, sev: f.severity, eg: f.name + ": " + f.detail }; byRule[f.rule].n++; }
  report.push({ frame: frame.name, id: frame.id, score: Math.max(0, 100 - Object.entries(counts).reduce((s, [k, v]) => s + weights[k] * v, 0)), counts, byRule });
}

// parity across breakpoints
const parity = [];
for (const [page, g] of groups) {
  for (const need of PROFILE.canvas.frames.map((f) => f.name)) if (!g[need]) parity.push({ rule: "missing-breakpoint", severity: "Warning", detail: `${page} has no ${need} frame.` });
  const names = Object.keys(g);
  if (names.length > 1 && PROFILE.layout.sameSectionOrderAcrossBreakpoints) {
    const base = g[names[0]].tops.join("|");
    for (const n of names.slice(1)) if (g[n].tops.join("|") !== base) parity.push({ rule: "section-order", severity: "Warning", detail: `${page}: ${n} sections differ from ${names[0]}.` });
    const a = g[names[0]].texts, b = g[names[names.length - 1]].texts;
    const only = [...a].filter((t) => !b.has(t)).slice(0, 4);
    if (only.length) parity.push({ rule: "content-differs", severity: "Tip", detail: `${page}: text only on ${names[0]}: ${only.map((t) => '"' + t.slice(0, 24) + '"').join(", ")}.` });
  }
}
if (famCount.size > PROFILE.type.maxFamilies) parity.push({ rule: "too-many-families", severity: "Warning", detail: `${famCount.size} font families: ${[...famCount.keys()].join(", ")}.` });
const avg = report.length ? Math.round(report.reduce((s, r) => s + r.score, 0) / report.length) : 0;
return { frames: frames.length, averageScore: avg, parity, perFrame: report, notObservable: PROFILE.notObservable };
