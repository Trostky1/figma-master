// figma-master: read keyframe motion from a screen. READ-ONLY. Run inside use_figma.
// Replace __ROOT_ID__ with the top level frame id (or any node). Feed the result to motion-to-css.mjs.

const ROOT_ID = "__ROOT_ID__";
const root = await figma.getNodeByIdAsync(ROOT_ID);
if (!root) throw new Error("Root node not found: " + ROOT_ID);

const nodes = [];
const unsupportedKeys = new Set();
const all = [root, ...("findAll" in root ? root.findAll(() => true) : [])];
const r4 = (x) => Math.round(x * 10000) / 10000;
const clean = (kf) => ({
  timelinePosition: r4(kf.timelinePosition),
  value: kf.value && kf.value.type === "VECTOR" ? { type: "VECTOR", value: { x: r4(kf.value.value.x), y: r4(kf.value.value.y) } }
       : kf.value && kf.value.type === "FLOAT" ? { type: "FLOAT", value: r4(kf.value.value) }
       : kf.value,
  easing: kf.easing || null,
});

for (const n of all) {
  const tr = n.manualKeyframeTracks;
  if (!tr || !Object.keys(tr).length) continue;
  const tracks = {};
  for (const [field, track] of Object.entries(tr)) {
    if (track && Array.isArray(track.keyframes)) tracks[field] = { keyframes: track.keyframes.map(clean) };
    else unsupportedKeys.add(field); // fills, strokes, effects are indexed groups
  }
  const tl = n.timelines && n.timelines[0];
  nodes.push({ id: n.id, name: n.name, parent: n.parent ? n.parent.name : null, tracks, timelineDuration: tl ? tl.duration : null });
}

return {
  root: { id: root.id, name: root.name },
  timelineDuration: nodes.length ? nodes[0].timelineDuration : null,
  nodes,
  unsupportedTrackGroups: [...unsupportedKeys],
};
