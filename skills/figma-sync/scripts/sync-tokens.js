// figma-master: sync tokens from a spec into Figma variables. Run inside use_figma.
// Replace __SPEC__ with a spec from tokens-to-spec.mjs (one part at a time for big sets).
//
// SPEC.apply false (default) = DRY RUN. Shows what would be created, updated, or left alone.
// SPEC.apply true            = creates and updates. NEVER deletes and never changes a variable's type.
// SPEC.partial true          = this is one part of a larger set: do not report "figmaOnly".
//
// Values: COLOR {r,g,b,a}, FLOAT number, STRING text, ALIAS {alias:"other/name"}.

const SPEC = __SPEC__;
const errors = [];
const EPS = 0.002;

const eqColor = (a, b) =>
  a && b && Math.abs(a.r - b.r) < EPS && Math.abs(a.g - b.g) < EPS && Math.abs(a.b - b.b) < EPS && Math.abs((a.a ?? 1) - (b.a ?? 1)) < EPS;
const same = (type, a, b) => {
  if (a === undefined || b === undefined) return false;
  if (type === "COLOR") return eqColor(a, b);
  if (type === "FLOAT") return Math.abs(a - b) < 0.001;
  return a === b;
};

const scopesFor = (name, type) => {
  if (type === "COLOR") {
    if (/(^|\/)(bg|background|surface|canvas|fill)(\/|$)/.test(name)) return ["FRAME_FILL", "SHAPE_FILL"];
    if (/(^|\/)(text|fg|foreground|content|ink)(\/|$)/.test(name)) return ["TEXT_FILL"];
    if (/(border|stroke|outline|divider)/.test(name)) return ["STROKE_COLOR"];
    return ["ALL_SCOPES"];
  }
  if (type === "FLOAT") {
    if (/font\/size|text\/size/.test(name)) return ["FONT_SIZE"];
    if (/line\/height|leading/.test(name)) return ["LINE_HEIGHT"];
    if (/letter|tracking/.test(name)) return ["LETTER_SPACING"];
    if (/weight/.test(name)) return ["FONT_WEIGHT"];
    if (/(^|\/)(space|spacing|gap|padding|margin)(\/|$)/.test(name)) return ["GAP"];
    if (/radius|rounded/.test(name)) return ["CORNER_RADIUS"];
    if (/opacity/.test(name)) return ["OPACITY"];
    return ["ALL_SCOPES"];
  }
  if (type === "STRING") return /family/.test(name) ? ["FONT_FAMILY"] : ["ALL_SCOPES"];
  return ["ALL_SCOPES"];
};

// ---- read current state ----
const collections = await figma.variables.getLocalVariableCollectionsAsync();
let col = collections.find((c) => c.name === SPEC.collection) || null;
const allVars = await figma.variables.getLocalVariablesAsync();
const existing = new Map(
  allVars.filter((v) => col && v.variableCollectionId === col.id).map((v) => [v.name, v])
);
const modeIdByName = new Map(col ? col.modes.map((m) => [m.name, m.modeId]) : []);
const missingModes = SPEC.modes.filter((m) => !modeIdByName.has(m));

// ---- plan ----
const plan = { create: [], update: [], unchanged: 0, typeConflicts: [] };
const resolveValue = (v, type) => {
  // alias values are compared by target name
  if (type === "ALIAS") return { alias: v.alias };
  return v;
};
for (const t of SPEC.tokens) {
  const v = existing.get(t.name);
  if (!v) { plan.create.push(t.name); continue; }
  const wantType = t.type === "ALIAS" ? v.resolvedType : t.type;
  if (v.resolvedType !== wantType) { plan.typeConflicts.push({ name: t.name, figma: v.resolvedType, spec: t.type }); continue; }
  const changes = [];
  for (const mode of SPEC.modes) {
    const modeId = modeIdByName.get(mode);
    if (!modeId) continue;
    const cur = v.valuesByMode[modeId];
    const want = t.values[mode];
    if (t.type === "ALIAS") {
      const target = allVars.find((x) => x.id === (cur && cur.id));
      const curName = target ? target.name : null;
      if (curName !== want.alias) changes.push({ mode, from: curName ? { alias: curName } : cur, to: { alias: want.alias } });
    } else if (cur && cur.type === "VARIABLE_ALIAS") {
      changes.push({ mode, from: "alias", to: want });
    } else if (!same(t.type, cur, want)) {
      changes.push({ mode, from: cur, to: want });
    }
  }
  if (changes.length) plan.update.push({ name: t.name, changes });
  else plan.unchanged++;
}
const specNames = new Set(SPEC.tokens.map((t) => t.name));
const figmaOnly = SPEC.partial ? "not checked (partial spec)" : [...existing.keys()].filter((n) => !specNames.has(n));

// alias targets must exist in the spec or in Figma
const knownNames = new Set([...existing.keys(), ...specNames, ...allVars.map((v) => v.name)]);
for (const t of SPEC.tokens) {
  if (t.type !== "ALIAS") continue;
  for (const m of SPEC.modes) {
    const target = t.values[m].alias;
    const msg = `Alias target not found: ${t.name} -> ${target}`;
    if (!knownNames.has(target) && !errors.includes(msg)) errors.push(msg);
  }
}

const dry = {
  collection: SPEC.collection,
  collectionExists: !!col,
  missingModes,
  create: plan.create,
  update: plan.update,
  unchanged: plan.unchanged,
  typeConflicts: plan.typeConflicts,
  figmaOnly,
  errors,
};
if (!SPEC.apply) return { applied: false, dryRun: true, ...dry };
if (errors.length) return { applied: false, dryRun: false, ...dry };

// ---- apply ----
const notes = [];
if (!col) {
  col = figma.variables.createVariableCollection(SPEC.collection);
  col.renameMode(col.modes[0].modeId, SPEC.modes[0]);
}
for (const m of SPEC.modes) {
  if (!col.modes.find((x) => x.name === m)) col.addMode(m);
}
const modeId = (name) => col.modes.find((m) => m.name === name).modeId;
const byName = new Map(allVars.filter((v) => v.variableCollectionId === col.id).map((v) => [v.name, v]));

const colorVal = (c) => ({ r: c.r, g: c.g, b: c.b, a: c.a ?? 1 });
const created = [], updated = [];

// pass 1: non alias
for (const t of SPEC.tokens) {
  if (t.type === "ALIAS") continue;
  let v = byName.get(t.name);
  if (v && v.resolvedType !== t.type) continue; // type conflict: left alone
  if (!v) {
    v = figma.variables.createVariable(t.name, col, t.type);
    const want = scopesFor(t.name, t.type);
    try { v.scopes = want; }
    catch (e) { notes.push(`${t.name}: scope ${want.join(",")} rejected, used ALL_SCOPES`); v.scopes = ["ALL_SCOPES"]; }
    byName.set(t.name, v);
    created.push(t.name);
  } else if (plan.update.find((u) => u.name === t.name)) updated.push(t.name);
  for (const m of SPEC.modes) {
    const val = t.values[m];
    v.setValueForMode(modeId(m), t.type === "COLOR" ? colorVal(val) : val);
  }
}
// pass 2: aliases (targets now exist)
for (const t of SPEC.tokens) {
  if (t.type !== "ALIAS") continue;
  let v = byName.get(t.name);
  if (!v) {
    const first = byName.get(t.values[SPEC.modes[0]].alias) || allVars.find((x) => x.name === t.values[SPEC.modes[0]].alias);
    v = figma.variables.createVariable(t.name, col, first.resolvedType);
    byName.set(t.name, v);
    created.push(t.name);
  } else if (plan.update.find((u) => u.name === t.name)) updated.push(t.name);
  for (const m of SPEC.modes) {
    const target = byName.get(t.values[m].alias) || allVars.find((x) => x.name === t.values[m].alias);
    v.setValueForMode(modeId(m), figma.variables.createVariableAlias(target));
  }
}

// ---- verify by reading back ----
const mismatches = [];
const fresh = await figma.variables.getLocalVariablesAsync();
const freshByName = new Map(fresh.filter((v) => v.variableCollectionId === col.id).map((v) => [v.name, v]));
for (const t of SPEC.tokens) {
  const v = freshByName.get(t.name);
  if (!v) { mismatches.push({ name: t.name, problem: "missing after apply" }); continue; }
  if (plan.typeConflicts.find((c) => c.name === t.name)) continue;
  for (const m of SPEC.modes) {
    const cur = v.valuesByMode[modeId(m)];
    if (t.type === "ALIAS") {
      const target = fresh.find((x) => x.id === (cur && cur.id));
      if (!target || target.name !== t.values[m].alias) mismatches.push({ name: t.name, mode: m, problem: "alias differs" });
    } else if (!same(t.type, cur, t.values[m])) mismatches.push({ name: t.name, mode: m, problem: "value differs", got: cur });
  }
}

return {
  applied: true,
  collection: col.name,
  modes: col.modes.map((m) => m.name),
  created, updated,
  unchanged: plan.unchanged,
  typeConflicts: plan.typeConflicts,
  figmaOnly,
  notes,
  mismatches,
  variableCount: freshByName.size,
};
