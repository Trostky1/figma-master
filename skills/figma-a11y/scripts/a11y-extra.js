// figma-master accessibility extras. READ-ONLY. Run inside use_figma.
// Replace __ROOT_ID__ with a node id, or use "PAGE" to scan the current page.
// Checks things scan.js does not: prototype motion and component state coverage.

const ROOT_ID = "__ROOT_ID__";
const scope = ROOT_ID === "PAGE" ? figma.currentPage : await figma.getNodeByIdAsync(ROOT_ID);
if (!scope) throw new Error("Root node not found: " + ROOT_ID);

const findings = [];
const add = (node, rule, severity, detail) =>
  findings.push({ id: node.id, name: node.name, rule, severity, detail });

const all = "findAll" in scope ? [scope, ...scope.findAll(() => true)] : [scope];
const MOVING = new Set(["SMART_ANIMATE", "PUSH", "SLIDE_IN", "SLIDE_OUT", "MOVE_IN", "MOVE_OUT", "SCROLL_ANIMATE"]);
let reactionNodes = 0, motionTransitions = 0, componentSets = 0;

for (const n of all) {
  // 1. Prototype motion
  if ("reactions" in n && n.reactions && n.reactions.length) {
    reactionNodes++;
    for (const r of n.reactions) {
      const trig = r.trigger && r.trigger.type;
      const acts = r.actions || (r.action ? [r.action] : []);
      if (trig === "AFTER_TIMEOUT") {
        add(n, "auto-advance", "Warning",
          "Screen changes by itself after " + r.trigger.timeout + " ms. Users need a way to pause or extend it (WCAG 2.2.1).");
      }
      for (const a of acts) {
        const t = a && a.transition;
        if (!t) continue;
        if (MOVING.has(t.type) || t.matchLayers) {
          motionTransitions++;
          add(n, "motion-needs-reduced-version", "Tip",
            t.type + " transition. Provide a reduced motion version (fade only) for users who ask for less motion.");
        }
        if (typeof t.duration === "number" && t.duration > 0.5) {
          add(n, "long-transition", "Tip", "Transition lasts " + t.duration + " s. Over 0.5 s feels slow for UI.");
        }
      }
    }
  }

  // 2. State coverage on component sets
  if (n.type === "COMPONENT_SET") {
    componentSets++;
    const defs = n.componentPropertyDefinitions || {};
    const stateKey = Object.keys(defs).find((k) => /state|status/i.test(k) && defs[k].type === "VARIANT");
    const looksInteractive = /button|input|field|link|toggle|checkbox|radio|tab|switch|chip|select/i.test(n.name);
    if (looksInteractive) {
      if (!stateKey) {
        add(n, "no-state-property", "Warning", "Interactive component has no State variant property.");
      } else {
        const opts = (defs[stateKey].variantOptions || []).map((o) => String(o).toLowerCase());
        const needs = ["hover", "focus", "disabled"];
        const missing = needs.filter((s) => !opts.some((o) => o.includes(s)));
        if (missing.length) {
          add(n, "missing-states", "Warning", "State options lack: " + missing.join(", ") + ".");
        }
      }
    }
  }
}

const weights = { Blocker: 12, Critical: 8, Warning: 4, Tip: 1 };
const counts = { Blocker: 0, Critical: 0, Warning: 0, Tip: 0 };
for (const f of findings) counts[f.severity]++;

return {
  scope: { id: scope.id, name: scope.name },
  scanned: { nodes: all.length, reactionNodes, motionTransitions, componentSets },
  counts,
  findings,
  notObservable: [
    "Focus order and keyboard paths (Figma has no focus model).",
    "Screen reader labels and roles.",
    "Color blind appearance (needs a render check).",
    "Whether color alone carries meaning (needs human review)."
  ]
};
