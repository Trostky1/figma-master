// figma-master: apply a list of SAFE fixes to named nodes. WRITES to the file.
// Replace __SPEC__ with JSON: { "fixes": [ ... ] }. Fix types:
//   { "type": "rename",      "id": "1:2", "name": "Hero Title" }
//   { "type": "bind-fill",   "id": "1:2", "variableId": "VariableID:1:2", "fillIndex": 0 }
//   { "type": "bind-stroke", "id": "1:2", "variableId": "VariableID:1:2", "strokeIndex": 0 }
//   { "type": "text-style",  "id": "1:2", "styleId": "S:abc," }
//   { "type": "min-text",    "id": "1:2", "size": 16 }
//   { "type": "line-height-target", "id": "1:2", "height": 44 }
// Each fix is tried alone. A failed fix does not stop the others. Returns what changed and what failed.

const SPEC = __SPEC__;
const applied = [], failed = [];
for (const fx of SPEC.fixes || []) {
  try {
    const n = await figma.getNodeByIdAsync(fx.id);
    if (!n) throw new Error("node not found");
    if (fx.type === "rename") {
      n.name = fx.name;
    } else if (fx.type === "bind-fill" || fx.type === "bind-stroke") {
      const v = await figma.variables.getVariableByIdAsync(fx.variableId);
      if (!v) throw new Error("variable not found");
      const isFill = fx.type === "bind-fill";
      const key = isFill ? "fills" : "strokes";
      const idx = (isFill ? fx.fillIndex : fx.strokeIndex) || 0;
      const paints = [...n[key]];
      if (!paints[idx] || paints[idx].type !== "SOLID") throw new Error("paint is not solid");
      paints[idx] = figma.variables.setBoundVariableForPaint(paints[idx], "color", v);
      n[key] = paints;
    } else if (fx.type === "text-style") {
      if (n.type !== "TEXT") throw new Error("not a text node");
      for (const s of n.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(s.fontName);
      await n.setTextStyleIdAsync(fx.styleId);
    } else if (fx.type === "min-text") {
      if (n.type !== "TEXT") throw new Error("not a text node");
      const segs = n.getStyledTextSegments(["fontName", "fontSize"]);
      for (const s of segs) await figma.loadFontAsync(s.fontName);
      if (Math.min(...segs.map((s) => s.fontSize)) < fx.size) n.fontSize = fx.size;
    } else if (fx.type === "line-height-target") {
      if (n.type !== "TEXT") throw new Error("not a text node");
      for (const s of n.getStyledTextSegments(["fontName"])) await figma.loadFontAsync(s.fontName);
      n.lineHeight = { unit: "PIXELS", value: fx.height };
    } else throw new Error("unknown fix type " + fx.type);
    applied.push({ id: fx.id, type: fx.type });
  } catch (e) {
    failed.push({ id: fx.id, type: fx.type, error: String(e && e.message ? e.message : e) });
  }
}
return { applied: applied.length, failed: failed.length, appliedList: applied, failedList: failed };
