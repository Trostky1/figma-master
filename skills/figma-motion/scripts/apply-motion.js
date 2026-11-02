// figma-master: apply motion recipes as manual keyframes. Run inside use_figma.
// ATOMIC: resolves every name and recipe first. On any problem it returns
// { applied: false, errors } and changes nothing.
// Replace __SPEC__ with JSON. See SKILL.md for the shape.
//
// Requires the Figma motion flag. If motion is off, it stops and says so.

const SPEC = __SPEC__;
const errors = [];
const notes = [];

// ---- motion flag gate ----
try { figma.motion.figmaAnimationStyles(); }
catch (e) { return { applied: false, errors: ["Motion is not enabled for this account: " + String(e).slice(0, 120)] }; }

// ---- intensity ----
const INTENSITY = {
  calm:       { time: 1.3,  dist: 0.7 },
  standard:   { time: 1.0,  dist: 1.0 },
  expressive: { time: 0.85, dist: 1.4 },
};
const level = INTENSITY[SPEC.intensity || "standard"];
if (!level) errors.push("Unknown intensity: " + SPEC.intensity + " (use calm, standard, expressive)");

// ---- recipes: [fraction of duration, value] per field ----
// k = distance scale. Scale values are pushed away from 1 by k.
const sc = (s, k) => 1 + (s - 1) * k;
const RECIPES = {
  "fade-in":  { dur: 0.25, ease: "EASE_OUT", enter: true,  build: () => ({ OPACITY: [[0, 0], [1, 1]] }) },
  "fade-out": { dur: 0.2,  ease: "EASE_IN_AND_OUT", enter: true, build: () => ({ OPACITY: [[0, 1], [1, 0]] }) },
  "rise-in":  { dur: 0.35, ease: "EASE_OUT", enter: true,  build: (k) => ({ OPACITY: [[0, 0], [1, 1]], TRANSLATION_Y: [[0, 16 * k], [1, 0]] }) },
  "slide-in": { dur: 0.35, ease: "EASE_OUT", enter: true,  build: (k, o) => ({ OPACITY: [[0, 0], [1, 1]], TRANSLATION_X: [[0, (o.from === "right" ? 1 : -1) * 24 * k], [1, 0]] }) },
  "pop-in":   { dur: 0.3,  ease: "EASE_OUT", enter: true,  build: (k) => ({ OPACITY: [[0, 0], [1, 1]], SCALE_XY: [[0, { x: sc(0.92, k), y: sc(0.92, k) }], [1, { x: 1, y: 1 }]] }) },
  "press":    { dur: 0.18, ease: "EASE_IN_AND_OUT", enter: false, build: (k) => ({ SCALE_XY: [[0, { x: 1, y: 1 }], [0.5, { x: sc(0.96, k), y: sc(0.96, k) }], [1, { x: 1, y: 1 }]] }) },
  "pulse":    { dur: 0.6,  ease: "EASE_IN_AND_OUT", enter: false, build: (k) => ({ SCALE_XY: [[0, { x: 1, y: 1 }], [0.5, { x: sc(1.06, k), y: sc(1.06, k) }], [1, { x: 1, y: 1 }]] }) },
  "shake":    { dur: 0.4,  ease: "EASE_IN_AND_OUT", enter: false, build: (k) => ({ TRANSLATION_X: [[0, 0], [0.2, -8 * k], [0.4, 8 * k], [0.6, -6 * k], [0.8, 6 * k], [1, 0]] }) },
  "draw-path":{ dur: 0.6,  ease: "EASE_IN_AND_OUT", enter: false, build: () => ({ PATH_TRIM_END: [[0, 0], [1, 1]] }) },
};
const VECTOR_FIELDS = new Set(["SCALE_XY", "TRANSLATION_XY"]);

// ---- resolve targets ----
const page = figma.currentPage;
const topFrames = page.children.flatMap((n) =>
  n.type === "SECTION" ? n.children.filter((c) => c.type === "FRAME") : n.type === "FRAME" ? [n] : []
);
const screenByName = (name) => {
  const l = topFrames.filter((f) => f.name === name);
  if (l.length !== 1) { errors.push("Screen " + (l.length ? "name not unique: " : "not found: ") + name); return null; }
  return l[0];
};
const isTop = (n) => n.parent && (n.parent.type === "PAGE" || n.parent.type === "SECTION");
const resolveLayer = (path) => {
  const [s, ...rest] = path.split("/");
  const sc0 = screenByName(s);
  if (!sc0) return null;
  if (!rest.length) return sc0;
  const nm = rest.join("/");
  const m = sc0.findAll((n) => n.name === nm);
  if (m.length !== 1) { errors.push('Layer "' + nm + '" in "' + s + '": found ' + m.length + " (need exactly 1)"); return null; }
  return m[0];
};

const jobs = []; // { node, recipeName, delay, duration }
for (const t of SPEC.targets || []) {
  const recipe = RECIPES[t.recipe];
  if (!recipe) { errors.push("Unknown recipe: " + t.recipe + ". Known: " + Object.keys(RECIPES).join(", ")); continue; }
  const base = resolveLayer(t.layer);
  if (!base) continue;
  const list = t.children ? ("children" in base ? [...base.children] : []) : [base];
  if (t.children && !list.length) errors.push('"' + t.layer + '" has no children to animate.');
  list.forEach((node, i) => {
    if (isTop(node)) { errors.push('"' + node.name + '" is a top level frame. Animate its children instead.'); return; }
    // Figma refuses path trim on closed shapes and on inside or outside strokes.
    if (t.recipe === "draw-path") {
      if (node.type !== "VECTOR") errors.push('"' + node.name + '": draw-path needs an open VECTOR layer, found ' + node.type + ".");
      else if (node.strokeAlign !== "CENTER") errors.push('"' + node.name + '": draw-path needs strokeAlign CENTER (it is ' + node.strokeAlign + ").");
    }
    jobs.push({ node, t, recipe, delay: (t.delay || 0) + (t.children ? i * (t.step ?? 0.06) : 0) });
  });
}
if (errors.length) return { applied: false, errors };

// ---- build and apply ----
const reduced = !!SPEC.reduced;
const results = [];
const timelineEnds = new Map(); // timeline id -> { node, end }

for (const { node, t, recipe, delay } of jobs) {
  let dur = (t.duration ?? recipe.dur) * level.time;
  let spec = recipe.build(level.dist, t);
  if (reduced) {
    if (!recipe.enter) { notes.push(node.name + ": " + t.recipe + " skipped (reduced motion)."); continue; }
    spec = { OPACITY: spec.OPACITY || [[0, 1], [1, 1]] };
    dur = 0.15;
  }
  const tracksApplied = [];
  for (const [field, frames] of Object.entries(spec)) {
    const keyframes = frames.map(([frac, v], idx) => {
      const kf = {
        timelinePosition: +(delay + frac * dur).toFixed(4),
        value: VECTOR_FIELDS.has(field) ? { type: "VECTOR", value: v } : { type: "FLOAT", value: v },
      };
      if (idx > 0) kf.easing = { type: reduced ? "EASE_OUT" : (t.easing || recipe.ease) };
      return kf;
    });
    node.applyManualKeyframeTrack({ type: "PROPERTY", name: field }, { keyframes });
    tracksApplied.push(field);
  }
  const end = delay + dur;
  const tl = node.timelines && node.timelines[0];
  if (tl) {
    const cur = timelineEnds.get(tl.id);
    if (!cur || cur.end < end) timelineEnds.set(tl.id, { node, end, id: tl.id, duration: tl.duration });
  }
  results.push({ id: node.id, name: node.name, recipe: t.recipe, delay: +delay.toFixed(3), duration: +dur.toFixed(3), tracks: tracksApplied,
    readBack: Object.keys(node.manualKeyframeTracks || {}) });
}

// extend timelines (never shorten)
const timelines = [];
for (const { node, end, id, duration } of timelineEnds.values()) {
  const want = Math.max(duration, +(end + 0.2).toFixed(3));
  if (want > duration) node.setTimelineDuration(id, want);
  timelines.push({ id, from: duration, to: want });
}

return {
  applied: true,
  intensity: SPEC.intensity || "standard",
  reduced,
  animated: results,
  timelines,
  notes,
  mismatches: results.filter((r) => !r.tracks.every((f) => r.readBack.includes(f))),
};
