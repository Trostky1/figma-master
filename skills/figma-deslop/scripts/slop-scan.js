// figma-master: scan a frame for AI slop (generic default looks and generic copy). READ ONLY.
// Replace __ROOT_ID__ with the node id (for example "3:2"). Run inside use_figma.
// Slop = a choice made by habit, not by the brief or the style kit. The scan finds the signs. A person decides.

const ROOT_ID = "__ROOT_ID__";
const root = await figma.getNodeByIdAsync(ROOT_ID);
if (!root || !("findAll" in root)) return { error: "Node not found or has no children: " + ROOT_ID };

const nodes = root.findAll((n) => n.visible !== false);
const texts = nodes.filter((n) => n.type === "TEXT");
const findings = [];
const add = (node, rule, severity, detail) => findings.push({ id: node.id, name: node.name, rule, severity, detail });

// ---- copy slop
const PHRASES = [
  "unleash", "unlock the power", "elevate your", "seamless", "revolutionize", "revolutionary", "game-changer", "game changer",
  "cutting-edge", "cutting edge", "next-level", "next level", "supercharge", "empower", "streamline", "leverage", "robust", "holistic",
  "fast-paced", "take it to the next level", "all-in-one", "one-stop", "effortless", "delve", "tapestry",
  "transform your", "reimagine", "future of", "built for the modern", "the ultimate", "your journey", "say goodbye to"
];
const PLACEHOLDER = /lorem ipsum|dolor sit|^heading$|^subheading$|^title$|^button$|^label$|^text$|^description$|your text here|placeholder|^subtitle$/i;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
for (const t of texts) {
  const s = t.characters.trim(); const low = s.toLowerCase();
  if (PLACEHOLDER.test(s)) add(t, "placeholder-text", "Critical", `"${s.slice(0, 30)}" is placeholder text.`);
  const hit = PHRASES.find((p) => low.includes(p));
  if (hit) add(t, "slop-phrase", "Warning", `Stock phrase "${hit}".`);
  if (/[—–]/.test(s)) add(t, "dash-in-copy", "Tip", "Dash in copy. Many AI drafts overuse them. Check the style rule.");
  if (EMOJI.test(s) && s.length <= 4) add(t, "emoji-as-icon", "Warning", `Emoji "${s}" used as an icon.`);
  if (/!$/.test(s) && s.length < 60 && !/^(hi|hey|wow)/i.test(s)) add(t, "exclamation", "Tip", "Headline ends with an exclamation mark.");
}

// ---- color slop
const hue = (c) => { const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b), d = mx - mn; if (!d) return -1; let h = mx === c.r ? ((c.g - c.b) / d) % 6 : mx === c.g ? (c.b - c.r) / d + 2 : (c.r - c.g) / d + 4; h *= 60; return h < 0 ? h + 360 : h; };
const sat = (c) => { const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b); return mx ? (mx - mn) / mx : 0; };
for (const n of nodes) {
  if (!("fills" in n) || !Array.isArray(n.fills)) continue;
  for (const f of n.fills) {
    if (f.visible === false || !f.type.startsWith("GRADIENT")) continue;
    const stops = f.gradientStops || [];
    const purple = stops.filter((s) => { const h = hue(s.color); return sat(s.color) > 0.35 && h >= 235 && h <= 300; });
    if (purple.length >= 2) add(n, "purple-gradient", "Warning", "Blue to purple gradient. The most common default.");
    else if (stops.length >= 2) add(n, "gradient-fill", "Tip", "Gradient fill. Is it from the style kit?");
    if (n.type === "TEXT") add(n, "gradient-text", "Warning", "Gradient text.");
  }
}

// ---- type slop
const fams = new Map();
for (const t of texts) { const f = t.fontName === figma.mixed ? "mixed" : t.fontName.family; fams.set(f, (fams.get(f) || 0) + 1); }
if (texts.length >= 8 && fams.size === 1 && [...fams.keys()][0] === "Inter") add(root, "default-font-only", "Warning", "Every text layer is Inter. Pick a face from the style kit.");
const centered = texts.filter((t) => t.textAlignHorizontal === "CENTER" && t.characters.length > 60);
if (centered.length >= 3) add(root, "centered-paragraphs", "Warning", `${centered.length} long paragraphs are centered. Left align body text.`);

// ---- shape slop
const radii = new Map(); let rounded = 0;
for (const n of nodes) if ((n.type === "FRAME" || n.type === "RECTANGLE" || n.type === "COMPONENT" || n.type === "INSTANCE") && typeof n.cornerRadius === "number" && n.cornerRadius > 0) { rounded++; radii.set(n.cornerRadius, (radii.get(n.cornerRadius) || 0) + 1); }
if (rounded >= 8) { const [r, c] = [...radii.entries()].sort((a, b) => b[1] - a[1])[0]; if (c / rounded > 0.8 && r >= 16) add(root, "same-big-radius", "Tip", `${c} of ${rounded} shapes use radius ${r}. Vary the shape language on purpose.`); }
const shadows = new Map();
for (const n of nodes) if ("effects" in n) for (const e of n.effects) if (e.visible !== false && e.type === "DROP_SHADOW") { const k = `${e.offset.x},${e.offset.y},${e.radius},${Math.round(e.color.a * 100)}`; shadows.set(k, (shadows.get(k) || 0) + 1); }
for (const [k, c] of shadows) if (c >= 6) add(root, "shadow-everywhere", "Tip", `The same drop shadow (${k}) is on ${c} layers.`);
const blurs = nodes.filter((n) => "effects" in n && n.effects.some((e) => e.visible !== false && e.type === "BACKGROUND_BLUR"));
if (blurs.length >= 3) add(root, "glass-everywhere", "Tip", `${blurs.length} layers use background blur.`);

// ---- layout slop
for (const n of nodes) {
  if (!("children" in n) || n.children.length !== 3 || n.layoutMode !== "HORIZONTAL") continue;
  const kids = n.children.filter((c) => c.visible !== false);
  if (kids.length !== 3) continue;
  const w0 = kids[0].width, h0 = kids[0].height;
  if (kids.every((k) => Math.abs(k.width - w0) < 2 && Math.abs(k.height - h0) < 2 && (k.type === "INSTANCE" || k.type === "FRAME"))) add(n, "three-identical-cards", "Tip", "Three identical cards in a row. Is three the real number?");
}
const iconCircles = nodes.filter((n) => n.type === "FRAME" && Math.abs(n.width - n.height) < 1 && n.width <= 64 && n.cornerRadius >= n.width / 2 - 1 && n.children && n.children.length === 1);
if (iconCircles.length >= 4) add(root, "icon-in-circle", "Tip", `${iconCircles.length} small icon-in-circle badges. A common template.`);

// ---- naming
const named = nodes.filter((n) => /^(Frame|Rectangle|Ellipse|Group|Vector|Line|Text) \d+$/.test(n.name));
if (named.length > 5) add(root, "default-names", "Tip", `${named.length} layers still have default names.`);

const weights = { Critical: 8, Warning: 4, Tip: 1 };
const counts = { Critical: 0, Warning: 0, Tip: 0 };
for (const f of findings) counts[f.severity]++;
const score = Math.max(0, 100 - Object.entries(counts).reduce((s, [k, v]) => s + weights[k] * v, 0));
const byRule = {};
for (const f of findings) { const r = (byRule[f.rule] = byRule[f.rule] || { count: 0, severity: f.severity, examples: [] }); r.count++; if (r.examples.length < 3) r.examples.push({ id: f.id, name: f.name, detail: f.detail }); }
return { root: { id: root.id, name: root.name }, layers: nodes.length, texts: texts.length, fonts: Object.fromEntries(fams), slopScore: score, counts, byRule, note: "Higher score = less slop. These are signs only. A style kit may choose any of them on purpose." };
