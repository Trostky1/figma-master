// figma-master: apply prototype links from a spec. Run inside use_figma.
// ATOMIC: it resolves every name first. If anything is missing or ambiguous it
// returns { applied: false, errors } and changes nothing.
// Replace __SPEC__ with a JSON object. See SKILL.md for the shape.
//
// Supported action types: NODE, BACK, CLOSE, URL, SET_VARIABLE (BOOLEAN, FLOAT, STRING),
// SET_VARIABLE_MODE, CONDITIONAL (variable alias conditions on BOOLEAN variables).

const SPEC = __SPEC__;
const errors = [];
const page = figma.currentPage;

// Top level screens: frames on the page, or inside sections.
const topFrames = page.children.flatMap((n) =>
  n.type === "SECTION" ? n.children.filter((c) => c.type === "FRAME") : n.type === "FRAME" ? [n] : []
);
const byName = new Map();
for (const f of topFrames) {
  if (!byName.has(f.name)) byName.set(f.name, []);
  byName.get(f.name).push(f);
}
const screen = (name) => {
  const l = byName.get(name);
  if (!l) { errors.push("Screen not found: " + name); return null; }
  if (l.length > 1) { errors.push("Screen name not unique: " + name); return null; }
  return l[0];
};
const layer = (path) => {
  const [s, ...rest] = path.split("/");
  const sc = screen(s);
  if (!sc) return null;
  if (!rest.length) return sc;
  const nm = rest.join("/");
  const m = sc.findAll((n) => n.name === nm);
  if (m.length !== 1) { errors.push('Layer "' + nm + '" in "' + s + '": found ' + m.length + " (need exactly 1)"); return null; }
  return m[0];
};

const vars = await figma.variables.getLocalVariablesAsync();
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const variable = (name) => {
  const m = vars.filter((v) => v.name === name);
  if (m.length !== 1) { errors.push('Variable "' + name + '": found ' + m.length + " (need exactly 1)"); return null; }
  return m[0];
};

const resolveAction = (a) => {
  switch (a.type) {
    case "NODE": {
      const d = screen(a.to);
      if (!d) return null;
      const { to, ...rest } = a;
      return { ...rest, destinationId: d.id, navigation: a.navigation || "NAVIGATE", transition: a.transition || null };
    }
    case "SET_VARIABLE": {
      const v = variable(a.variable);
      if (!v) return null;
      if (!["BOOLEAN", "FLOAT", "STRING"].includes(v.resolvedType)) {
        errors.push('SET_VARIABLE supports BOOLEAN, FLOAT, STRING. "' + a.variable + '" is ' + v.resolvedType + ".");
        return null;
      }
      return { type: "SET_VARIABLE", variableId: v.id, variableValue: { type: v.resolvedType, resolvedType: v.resolvedType, value: a.value } };
    }
    case "SET_VARIABLE_MODE": {
      const c = collections.find((x) => x.name === a.collection);
      if (!c) { errors.push('Collection not found: "' + a.collection + '"'); return null; }
      const m = c.modes.find((x) => x.name === a.mode);
      if (!m) { errors.push('Mode "' + a.mode + '" not in collection "' + a.collection + '"'); return null; }
      return { type: "SET_VARIABLE_MODE", variableCollectionId: c.id, variableModeId: m.modeId };
    }
    case "CONDITIONAL": {
      const blocks = (a.blocks || []).map((b) => {
        const v = variable(b.ifVariable);
        const acts = (b.actions || []).map(resolveAction);
        if (!v) return null;
        if (v.resolvedType !== "BOOLEAN") { errors.push('CONDITIONAL needs a BOOLEAN variable. "' + b.ifVariable + '" is ' + v.resolvedType + "."); return null; }
        return {
          condition: { type: "VARIABLE_ALIAS", resolvedType: "BOOLEAN", value: { type: "VARIABLE_ALIAS", id: v.id } },
          actions: acts,
        };
      });
      return { type: "CONDITIONAL", conditionalBlocks: blocks };
    }
    case "BACK":
    case "CLOSE":
    case "URL":
      return a;
    default:
      errors.push("Unsupported action type: " + a.type);
      return null;
  }
};

// Resolve everything first.
const plan = new Map();
for (const link of SPEC.links || []) {
  const node = layer(link.from);
  const actions = (link.actions || []).map(resolveAction);
  if (!node) continue;
  if (!link.trigger || !link.trigger.type) { errors.push("Missing trigger on " + link.from); continue; }
  if (!plan.has(node.id)) plan.set(node.id, { node, reactions: [] });
  plan.get(node.id).reactions.push({ trigger: link.trigger, actions });
}
let startingPoints = null;
if (SPEC.startingPoints) {
  startingPoints = SPEC.startingPoints.map((sp) => {
    const s = screen(sp.screen);
    return s ? { nodeId: s.id, name: sp.name || sp.screen } : null;
  });
}
if (errors.length) return { applied: false, errors };

// Apply.
const results = [];
for (const { node, reactions } of plan.values()) {
  const existing = SPEC.mode === "append" ? node.reactions : [];
  await node.setReactionsAsync([...existing, ...reactions]);
  results.push({ id: node.id, name: node.name, reactionCount: node.reactions.length, expected: existing.length + reactions.length });
}
let sp = "not requested";
if (startingPoints) {
  try { page.flowStartingPoints = startingPoints; sp = { ok: true, now: page.flowStartingPoints }; }
  catch (e) { sp = { ok: false, error: String(e).slice(0, 160) }; }
}
return { applied: true, nodes: results, startingPoints: sp, mismatches: results.filter((r) => r.reactionCount !== r.expected) };
