// figma-master audit scan. READ-ONLY. Run inside use_figma.
// Replace __ROOT_ID__ with the node id to scan (a frame, section, or page child).
// Returns findings and counts. It never changes the file.

const ROOT_ID = "__ROOT_ID__";
const root = await figma.getNodeByIdAsync(ROOT_ID);
if (!root) throw new Error("Root node not found: " + ROOT_ID);

const findings = [];
const add = (node, rule, severity, detail) =>
  findings.push({ id: node.id, name: node.name, rule, severity, detail });

// --- helpers ---
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
const ratio = (a, b) => {
  const [hi, lo] = lum(a) >= lum(b) ? [a, b] : [b, a];
  return (lum(hi) + 0.05) / (lum(lo) + 0.05);
};
const solidFill = (n) => {
  if (!("fills" in n) || n.fills === figma.mixed || !Array.isArray(n.fills)) return null;
  const f = n.fills.find((p) => p.type === "SOLID" && p.visible !== false);
  return f ? { color: f.color, opacity: f.opacity ?? 1, paint: f } : null;
};
const isBound = (paint) => !!(paint && paint.boundVariables && paint.boundVariables.color);
const backdrop = (n) => {
  let p = n.parent;
  while (p && p.type !== "PAGE" && p.type !== "DOCUMENT") {
    const f = solidFill(p);
    if (f && f.opacity >= 0.99) return f.color;
    p = p.parent;
  }
  return null; // not observable
};
const defaultName = /^(Frame|Rectangle|Ellipse|Group|Line|Vector|Polygon|Star|Text|Component|Instance|Section)\s?\d*$/;

let nodes = 0, textNodes = 0, notObservable = 0;
const all = [root, ...root.findAll(() => true)];

for (const n of all) {
  if (n.visible === false) continue;
  nodes++;

  // 1. Hardcoded colors
  if ("fills" in n && Array.isArray(n.fills) && n.type !== "TEXT") {
    const f = solidFill(n);
    if (f && !isBound(f.paint) && !n.fillStyleId) {
      add(n, "hardcoded-fill", "Warning", "Solid fill is not bound to a variable or style.");
    }
  }
  if ("strokes" in n && Array.isArray(n.strokes) && n.strokes.length) {
    const s = n.strokes.find((p) => p.type === "SOLID");
    if (s && !isBound(s) && !n.strokeStyleId) {
      add(n, "hardcoded-stroke", "Tip", "Stroke color is not bound to a variable or style.");
    }
  }

  // 2. Layer names
  if (n !== root && defaultName.test(n.name)) {
    add(n, "default-name", "Tip", "Layer still has a default name.");
  }

  // 3. Auto layout on containers with 2+ children
  if (n.type === "FRAME" && n.children && n.children.length >= 2 && n.layoutMode === "NONE") {
    add(n, "no-auto-layout", "Warning", "Frame has " + n.children.length + " children but no auto layout.");
  }

  // 4. Spacing not bound
  if (n.type === "FRAME" && n.layoutMode && n.layoutMode !== "NONE") {
    const bv = n.boundVariables || {};
    if (n.itemSpacing > 0 && !bv.itemSpacing) {
      add(n, "unbound-gap", "Tip", "Gap " + n.itemSpacing + " is not bound to a variable.");
    }
  }

  // 5. Text checks
  if (n.type === "TEXT") {
    textNodes++;
    const size = n.fontSize === figma.mixed ? null : n.fontSize;
    if (!n.textStyleId && !(n.boundVariables && n.boundVariables.fontSize)) {
      add(n, "no-text-style", "Warning", "Text has no text style.");
    }
    if (size !== null && size < 12) {
      add(n, "tiny-text", "Critical", "Font size " + size + " is below 12.");
    }
    // contrast
    const fg = solidFill(n);
    const bg = backdrop(n);
    if (fg && bg) {
      const weight = n.fontWeight === figma.mixed ? 400 : n.fontWeight;
      const large = size !== null && (size >= 24 || (size >= 18.66 && weight >= 700));
      const need = large ? 3 : 4.5;
      const r = ratio(fg.color, bg);
      if (r < need) {
        add(n, "low-contrast", r < 3 ? "Blocker" : "Critical",
          "Contrast " + r.toFixed(2) + ":1, needs " + need + ":1" +
          (fg.opacity < 1 ? " (text opacity ignored, real ratio is lower)" : ""));
      }
    } else if (fg) {
      notObservable++;
    }
  }

  // 6. Touch targets on interactive nodes
  const interactive = "reactions" in n && n.reactions && n.reactions.length > 0;
  if (interactive && n !== root) {
    const w = n.width, h = n.height;
    if (w < 24 || h < 24) {
      add(n, "tiny-target", "Blocker", "Target " + Math.round(w) + "x" + Math.round(h) + " is below 24x24.");
    } else if (w < 44 || h < 44) {
      add(n, "small-target", "Warning", "Target " + Math.round(w) + "x" + Math.round(h) + " is below 44x44.");
    }
  }
}

const weights = { Blocker: 12, Critical: 8, Warning: 4, Tip: 1 };
const counts = { Blocker: 0, Critical: 0, Warning: 0, Tip: 0 };
for (const f of findings) counts[f.severity]++;
const deduction = Object.entries(counts).reduce((s, [k, v]) => s + weights[k] * v, 0);

return {
  root: { id: root.id, name: root.name },
  scanned: { nodes, textNodes },
  notObservable: { contrastNoBackdrop: notObservable },
  counts,
  score: Math.max(0, 100 - deduction),
  findings
};
