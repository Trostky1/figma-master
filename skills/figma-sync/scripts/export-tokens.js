// figma-master: export one variable collection as a token spec. READ-ONLY. Run inside use_figma.
// Replace __COLLECTION__ with the collection name. Output has the same shape that
// tokens-to-spec.mjs makes, so tokens-to-css.mjs can write CSS from it.
// Colors are rounded to 4 decimals.

const COLLECTION = "__COLLECTION__";
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const col = collections.find((c) => c.name === COLLECTION);
if (!col) return { error: "Collection not found: " + COLLECTION, available: collections.map((c) => c.name) };

const vars = await figma.variables.getLocalVariablesAsync();
const mine = vars.filter((v) => v.variableCollectionId === col.id);
const byId = new Map(vars.map((v) => [v.id, v]));
const r4 = (x) => Math.round(x * 10000) / 10000;

const tokens = [];
const skipped = [];
for (const v of mine) {
  const values = {};
  let aliasOnly = true;
  for (const m of col.modes) {
    const cur = v.valuesByMode[m.modeId];
    if (cur && cur.type === "VARIABLE_ALIAS") {
      const target = byId.get(cur.id);
      if (!target) { skipped.push({ name: v.name, reason: "alias target is not local (library variable)" }); continue; }
      values[m.name] = { alias: target.name };
    } else {
      aliasOnly = false;
      values[m.name] = v.resolvedType === "COLOR" ? { r: r4(cur.r), g: r4(cur.g), b: r4(cur.b), a: r4(cur.a ?? 1) } : cur;
    }
  }
  if (Object.keys(values).length !== col.modes.length) continue;
  tokens.push({ name: v.name, type: aliasOnly ? "ALIAS" : v.resolvedType, resolvedType: v.resolvedType, values });
}

return { collection: col.name, modes: col.modes.map((m) => m.name), count: tokens.length, tokens, skipped };
