// figma-master: check a prototype flow. READ-ONLY. Run inside use_figma.
// Looks at all top level frames on the current page (and frames inside sections).
// Reports broken links, unreachable screens, dead ends, missing starting point,
// Smart Animate pairs with no shared layer names, and hover triggers.

const screens = figma.currentPage.children.flatMap((n) =>
  n.type === "SECTION" ? n.children.filter((c) => c.type === "FRAME") : n.type === "FRAME" ? [n] : []
);
const byId = new Map(screens.map((s) => [s.id, s]));
const findings = [];
const add = (node, rule, severity, detail) =>
  findings.push({ id: node.id, name: node.name, rule, severity, detail });

// Which screen owns a node?
const owner = (node) => {
  let p = node;
  while (p && !byId.has(p.id)) p = p.parent;
  return p || null;
};

// Collect every NODE action under an action list (looks inside CONDITIONAL).
const flatten = (actions) =>
  (actions || []).flatMap((a) =>
    a && a.type === "CONDITIONAL" ? flatten((a.conditionalBlocks || []).flatMap((b) => b.actions || [])) : a ? [a] : []
  );

const edges = []; // { from: screenId, to: id, node, action }
const outgoing = new Map(screens.map((s) => [s.id, 0]));
let reactionCount = 0, backOrClose = new Set();

for (const s of screens) {
  for (const n of [s, ...s.findAll(() => true)]) {
    if (!("reactions" in n) || !n.reactions || !n.reactions.length) continue;
    for (const r of n.reactions) {
      reactionCount++;
      const trig = r.trigger && r.trigger.type;
      if (trig === "ON_HOVER" || trig === "MOUSE_ENTER" || trig === "MOUSE_LEAVE") {
        add(n, "hover-trigger", "Tip", trig + " does not exist on touch screens. Give touch users another path.");
      }
      for (const a of flatten(r.actions || (r.action ? [r.action] : []))) {
        if (a.type === "BACK" || a.type === "CLOSE") { backOrClose.add(s.id); outgoing.set(s.id, outgoing.get(s.id) + 1); continue; }
        if (a.type !== "NODE") continue;
        if (!a.destinationId) { add(n, "empty-destination", "Critical", "Navigation action has no destination."); continue; }
        const dest = byId.get(a.destinationId);
        if (!dest) {
          add(n, "broken-link", "Critical", "Destination " + a.destinationId + " is not a top level screen on this page.");
          continue;
        }
        edges.push({ from: s.id, to: dest.id, node: n, action: a });
        outgoing.set(s.id, outgoing.get(s.id) + 1);

        // Smart Animate needs shared layer names.
        const t = a.transition;
        if (t && (t.type === "SMART_ANIMATE" || t.matchLayers)) {
          const names = (x) => new Set(x.findAll(() => true).map((c) => c.name));
          const src = names(s), dst = names(dest);
          const shared = [...src].filter((nm) => dst.has(nm));
          if (!shared.length) {
            add(n, "smart-animate-no-match", "Warning",
              "Smart Animate from " + s.name + " to " + dest.name + " but no layer names match. It will look like a dissolve.");
          }
        }
        if (a.navigation === "OVERLAY" && a.destinationId === s.id) {
          add(n, "overlay-self", "Warning", "Overlay opens its own screen.");
        }
      }
    }
  }
}

// Starting points
const starts = figma.currentPage.flowStartingPoints || [];
if (!starts.length) {
  add(figma.currentPage, "no-starting-point", "Warning", "Page has no flow starting point. Presenting will start somewhere random.");
}
const startIds = starts.map((s) => s.nodeId).filter((id) => byId.has(id));
const roots = startIds.length ? startIds : screens.length ? [screens[0].id] : [];

// Reachability (breadth first over NODE edges)
const seen = new Set(roots);
const queue = [...roots];
while (queue.length) {
  const cur = queue.shift();
  for (const e of edges) if (e.from === cur && !seen.has(e.to)) { seen.add(e.to); queue.push(e.to); }
}
for (const s of screens) {
  if (!seen.has(s.id)) add(s, "unreachable", "Warning", "No path from the starting point reaches this screen.");
}

// Dead ends: reachable screens with no way out
for (const s of screens) {
  if (seen.has(s.id) && outgoing.get(s.id) === 0 && screens.length > 1) {
    add(s, "dead-end", "Warning", "Screen has no link out, no Back, and no Close.");
  }
}

const weights = { Blocker: 12, Critical: 8, Warning: 4, Tip: 1 };
const counts = { Blocker: 0, Critical: 0, Warning: 0, Tip: 0 };
for (const f of findings) counts[f.severity]++;

return {
  screens: screens.map((s) => ({ id: s.id, name: s.name })),
  startingPoints: starts,
  reactionCount,
  edges: edges.map((e) => ({ from: byId.get(e.from).name, to: byId.get(e.to).name, via: e.node.name, nav: e.action.navigation, transition: e.action.transition && e.action.transition.type })),
  reachable: screens.filter((s) => seen.has(s.id)).map((s) => s.name),
  counts,
  findings,
  notObservable: ["Whether a link feels right when played.", "Interactive component (CHANGE_TO) internals.", "Timing as felt on a real device."]
};
