// figma-master: check a Figma Slides deck against the presentation profile and a style kit.
// READ ONLY. Run inside use_figma on the Slides file.
// Replace __PROFILE__ with profiles/presentation.json (the whole object).
// Replace __STYLE__ with { "colors": ["#hex", ...], "fonts": ["Family", ...] } from the style kit.
// Pass { "colors": [], "fonts": [] } to skip the style check.

const PROFILE = __PROFILE__;
const STYLE = __STYLE__;

// ---------- helpers ----------
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => { const [hi, lo] = lum(a) >= lum(b) ? [a, b] : [b, a]; return (lum(hi) + 0.05) / (lum(lo) + 0.05); };
const toHex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
const hexRgb = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const dist = (a, b) => Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2) * 255;
const solid = (n) => {
  if (!("fills" in n) || n.fills === figma.mixed || !Array.isArray(n.fills)) return null;
  const f = n.fills.find((p) => p.type === "SOLID" && p.visible !== false);
  return f ? { color: f.color, opacity: f.opacity ?? 1 } : null;
};
const baseFamily = (f) => f.replace(/\s+(Hero|Display|Variable|VF|Text)$/i, "");
const paletteRgb = (STYLE.colors || []).map(hexRgb);
const fontsAllowed = new Set((STYLE.fonts || []).map(baseFamily));

// ---------- collect slides in grid order ----------
let slides = [];
try { slides = figma.getSlideGrid().flat(); } catch (e) {}
if (!slides.length) slides = figma.currentPage.findAllWithCriteria({ types: ["SLIDE"] });
let rowNames = [];
try {
  const grid = figma.currentPage.children.find((c) => c.type === "SLIDE_GRID");
  rowNames = grid ? grid.children.map((r) => r.name) : [];
  // STYLE.rows (or STYLE.row) limits the check to some sections, so two decks in one file are checked against their own kits
  const wantRows = STYLE.rows || (STYLE.row ? [STYLE.row] : null);
  if (wantRows && grid) slides = grid.children.filter((r) => wantRows.includes(r.name)).flatMap((r) => r.children.filter((s) => s.type === "SLIDE"));
} catch (e) {}

const weights = { Blocker: 12, Critical: 8, Warning: 4, Tip: 1 };
const report = [];
const deckFamilies = new Map();
const fingerprints = [];
const offPaletteDeck = new Map();

for (const slide of slides) {
  const findings = [];
  const add = (node, rule, severity, detail) => findings.push({ id: node.id, name: node.name, rule, severity, detail });
  const box = slide.absoluteBoundingBox;
  const rel = (n) => { const b = n.absoluteBoundingBox; return b ? { x: b.x - box.x, y: b.y - box.y, w: b.width, h: b.height } : null; };
  const slideFill = solid(slide);
  const backdrop = (n) => { let p = n.parent; while (p && p.id !== slide.id) { const f = solid(p); if (f && f.opacity >= 0.99) return f.color; p = p.parent; } return slideFill ? slideFill.color : null; };

  const texts = slide.findAllWithCriteria({ types: ["TEXT"] }).filter((t) => t.visible !== false);
  const all = slide.findAll((n) => n.visible !== false);
  let words = 0, maxSize = 0, minSize = 9999;
  const tboxes = [];

  for (const t of texts) {
    const segs = t.getStyledTextSegments(["fontSize", "fontName"]);
    const size = Math.min(...segs.map((s) => s.fontSize)), sizeMax = Math.max(...segs.map((s) => s.fontSize));
    const fam = segs[0].fontName.family;
    deckFamilies.set(fam, (deckFamilies.get(fam) || 0) + 1);
    const chars = t.characters.trim();
    const w = chars.split(/\s+/).filter(Boolean).length; words += w;
    maxSize = Math.max(maxSize, sizeMax); minSize = Math.min(minSize, size);
    const st = t.textStyleId && t.textStyleId !== figma.mixed ? await figma.getStyleByIdAsync(t.textStyleId) : null;
    const isLabel = /label|code/i.test(st ? st.name : "") || (t.textCase === "UPPER" && chars.length < 60);

    if (size < PROFILE.type.absoluteFloor) add(t, "text-below-floor", "Critical", `Font size ${size} is below ${PROFILE.type.absoluteFloor}.`);
    else if (!isLabel && size < PROFILE.type.captionMin) add(t, "text-small", "Warning", `Font size ${size} is below the caption minimum ${PROFILE.type.captionMin}.`);
    else if (!isLabel && chars.length > 120 && size < PROFILE.type.bodyMin) add(t, "long-text-small", "Warning", `${chars.length} characters at ${size}. Long text needs ${PROFILE.type.bodyMin} or more, or fewer words.`);
    else if (isLabel && size < PROFILE.type.labelMin) add(t, "label-small", "Warning", `Label at ${size} is below ${PROFILE.type.labelMin}.`);

    const r = rel(t);
    if (r) {
      tboxes.push({ t, r, size: sizeMax });
      const out = r.x < -2 || r.y < -2 || r.x + r.w > box.width + 2 || r.y + r.h > box.height + 2;
      if (out) add(t, "text-out-of-bounds", sizeMax >= PROFILE.bleedAllowedTextPx ? "Tip" : "Critical", sizeMax >= PROFILE.bleedAllowedTextPx ? "Large display text bleeds off the slide. Fine if on purpose." : "Text runs outside the slide.");
    }

    const fg = solid(t), bg = backdrop(t);
    if (fg && bg) {
      const large = sizeMax >= PROFILE.contrast.largeTextPx;
      const need = large ? PROFILE.contrast.large : PROFILE.contrast.body;
      const cr = ratio(fg.color, bg);
      if (cr < need) add(t, "low-contrast", cr < 3 ? "Blocker" : "Critical", `Contrast ${cr.toFixed(2)}:1, needs ${need}:1.`);
    }
    if (STYLE.fonts && STYLE.fonts.length && !fontsAllowed.has(baseFamily(fam))) add(t, "off-style-font", "Warning", `Font "${fam}" is not in the style kit.`);
  }

  // overlap between text boxes
  for (let i = 0; i < tboxes.length; i++) for (let j = i + 1; j < tboxes.length; j++) {
    const a = tboxes[i].r, b = tboxes[j].r;
    const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
    if (ox > 4 && oy > 4) { const small = Math.min(a.w * a.h, b.w * b.h); if ((ox * oy) / small > 0.15) add(tboxes[j].t, "text-overlap", "Warning", `Overlaps "${tboxes[i].t.name}".`); }
  }

  // density and hierarchy
  if (words > PROFILE.density.wordsPerSlide) add(slide, "too-many-words", "Warning", `${words} words. The limit is ${PROFILE.density.wordsPerSlide}.`);
  if (texts.length >= 3 && maxSize / Math.max(minSize, 1) < PROFILE.layout.hierarchyRatioMin) add(slide, "flat-hierarchy", "Warning", `Largest text is only ${(maxSize / minSize).toFixed(1)}x the smallest.`);

  // non text element
  const nonText = all.filter((n) => ["RECTANGLE", "ELLIPSE", "LINE", "VECTOR", "POLYGON", "STAR"].includes(n.type) || (n.type === "FRAME" && n.id !== slide.id && ((n.fills && n.fills.length) || (n.strokes && n.strokes.length))));
  if (nonText.length < PROFILE.layout.nonTextElementPerSlide) add(slide, "text-only-slide", "Warning", "No shape, line, or filled block on this slide.");

  // style fidelity: colors
  if (paletteRgb.length) {
    const seen = new Map();
    for (const n of [slide, ...all]) {
      for (const p of [...(("fills" in n && Array.isArray(n.fills)) ? n.fills : []), ...(("strokes" in n && Array.isArray(n.strokes)) ? n.strokes : [])]) {
        if (p.type !== "SOLID" || p.visible === false) continue;
        const c = p.color; const near = Math.min(...paletteRgb.map((x) => dist(x, c)));
        if (near > 14) { const h = toHex(c); seen.set(h, n.name); }
      }
    }
    for (const [h, nm] of seen) { offPaletteDeck.set(h, (offPaletteDeck.get(h) || 0) + 1); add(slide, "off-style-color", "Warning", `${h} (on "${nm}") is not in the style kit.`); }
  }

  // layout fingerprint: where the biggest text sits, and the background tone
  const big = tboxes.sort((a, b) => b.size - a.size)[0];
  const cell = big ? `${Math.min(2, Math.floor(((big.r.x + big.r.w / 2) / box.width) * 3))}${Math.min(2, Math.floor(((big.r.y + big.r.h / 2) / box.height) * 3))}` : "--";
  const dark = slideFill ? lum(slideFill.color) < 0.2 : false;
  fingerprints.push(`${cell}|${dark ? "d" : "l"}|${nonText.length > 3 ? "m" : "s"}`);

  const counts = { Blocker: 0, Critical: 0, Warning: 0, Tip: 0 };
  for (const f of findings) counts[f.severity]++;
  const score = Math.max(0, 100 - Object.entries(counts).reduce((s, [k, v]) => s + weights[k] * v, 0));
  const byRule = {};
  for (const f of findings) { byRule[f.rule] = byRule[f.rule] || { n: 0, sev: f.severity, eg: f.name + ": " + f.detail }; byRule[f.rule].n++; }
  report.push({ slide: slide.name, id: slide.id, score, counts, words, texts: texts.length, byRule });
}

// deck level
const deck = [];
if (deckFamilies.size > PROFILE.type.maxFamilies) deck.push({ rule: "too-many-families", severity: "Warning", detail: `${deckFamilies.size} font families: ${[...deckFamilies.keys()].join(", ")}.` });
if (slides.length >= PROFILE.layout.sectionsWhenSlidesAtLeast && rowNames.length <= 1) deck.push({ rule: "no-sections", severity: "Warning", detail: `${slides.length} slides in ${rowNames.length} section.` });
let run = 1;
for (let i = 1; i < fingerprints.length; i++) {
  run = fingerprints[i] === fingerprints[i - 1] ? run + 1 : 1;
  if (run > PROFILE.layout.maxConsecutiveSameLayout) deck.push({ rule: "repeated-layout", severity: "Warning", detail: `Slides ending at ${slides[i].name} repeat the same layout ${run} times.` });
}
const avg = report.length ? Math.round(report.reduce((s, r) => s + r.score, 0) / report.length) : 0;
return {
  slides: slides.length, rows: rowNames, averageScore: avg,
  families: [...deckFamilies.entries()].map(([f, n]) => `${f} x${n}`),
  offPalette: [...offPaletteDeck.entries()].map(([h, n]) => `${h} x${n}`),
  deck, perSlide: report,
  notObservable: PROFILE.notObservable,
};
