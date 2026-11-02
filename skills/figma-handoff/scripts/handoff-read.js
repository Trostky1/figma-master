// figma-master: collect what a developer needs from one frame. READ-ONLY. Run inside use_figma.
// Replace __ROOT_ID__ with a frame id. Output is JSON: tree, tokens used, text styles, fonts,
// components, interactions, and animated layers. It never changes the file.
// Limits: 400 nodes, depth 8. If cut off, `truncated` is true. Run again on a smaller frame.

const ROOT_ID = "__ROOT_ID__";
const MAX_NODES = 400, MAX_DEPTH = 8;
const root = await figma.getNodeByIdAsync(ROOT_ID);
if (!root) throw new Error("Root node not found: " + ROOT_ID);

const r2 = (x) => Math.round(x * 100) / 100;
const hex = (c) => "#" + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");

// variable id -> name (local first, then try library ones)
const localVars = await figma.variables.getLocalVariablesAsync();
const varName = new Map(localVars.map((v) => [v.id, v.name]));
const nameOf = async (id) => {
  if (varName.has(id)) return varName.get(id);
  try { const v = await figma.variables.getVariableByIdAsync(id); varName.set(id, v ? v.name : id); }
  catch (e) { varName.set(id, id); }
  return varName.get(id);
};

const tokenUse = new Map();      // variable name -> { count, props:Set }
const textStyles = new Map();    // style name -> count
const fonts = new Map();         // "Family Style size" -> count
const components = new Map();    // component name -> count
const interactions = [];
const animated = [];
const notObservable = new Set();
let count = 0, truncated = false;

const noteToken = (name, prop) => {
  const t = tokenUse.get(name) || { count: 0, props: new Set() };
  t.count++; t.props.add(prop); tokenUse.set(name, t);
};
const paintDesc = async (paints, prop, boundList) => {
  if (!Array.isArray(paints) || !paints.length) return null;
  const p = paints.find((x) => x.visible !== false);
  if (!p) return null;
  if (p.type === "SOLID") {
    const bound = p.boundVariables && p.boundVariables.color;
    if (bound) { const nm = await nameOf(bound.id); noteToken(nm, prop); return { token: nm }; }
    return { color: hex(p.color), opacity: p.opacity ?? 1 };
  }
  if (p.type === "IMAGE") return { image: true };
  if (p.type.startsWith("GRADIENT")) return { gradient: p.type };
  return { type: p.type };
};

const walk = async (n, depth) => {
  if (count >= MAX_NODES || depth > MAX_DEPTH) { truncated = true; return null; }
  count++;
  const o = { name: n.name, type: n.type, w: r2(n.width), h: r2(n.height) };
  if (n.id !== root.id) { o.x = r2(n.x); o.y = r2(n.y); }

  if ("layoutMode" in n && n.layoutMode !== "NONE") {
    o.layout = { dir: n.layoutMode, gap: n.itemSpacing, pad: [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft], main: n.primaryAxisAlignItems, cross: n.counterAxisAlignItems };
    const bv = n.boundVariables || {};
    for (const k of ["itemSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) {
      if (bv[k]) noteToken(await nameOf(bv[k].id), k);
    }
  } else if ("children" in n && n.children.length > 1 && n.type === "FRAME") {
    o.layoutNote = "absolute positions";
  }
  if ("cornerRadius" in n && n.cornerRadius && n.cornerRadius !== figma.mixed) {
    o.radius = n.cornerRadius;
    const bv = n.boundVariables || {};
    const key = ["cornerRadius", "topLeftRadius"].find((k) => bv[k]);
    if (key) noteToken(await nameOf(bv[key].id), "cornerRadius");
  }
  if ("fills" in n && n.type !== "TEXT") { const f = await paintDesc(n.fills, "fill"); if (f) o.fill = f; }
  if ("strokes" in n && n.strokes && n.strokes.length) { const s = await paintDesc(n.strokes, "stroke"); if (s) o.stroke = s; }
  if ("effects" in n && n.effects && n.effects.length) o.effects = n.effects.map((e) => e.type);
  if (n.opacity !== undefined && n.opacity < 1) o.opacity = r2(n.opacity);

  if (n.type === "TEXT") {
    const fn = n.fontName === figma.mixed ? null : n.fontName;
    const size = n.fontSize === figma.mixed ? "mixed" : n.fontSize;
    o.text = n.characters.length > 80 ? n.characters.slice(0, 80) + "..." : n.characters;
    if (fn) o.font = `${fn.family} ${fn.style}`;
    o.size = size;
    if (n.textStyleId) {
      const st = await figma.getStyleByIdAsync(n.textStyleId);
      if (st) { o.textStyle = st.name; textStyles.set(st.name, (textStyles.get(st.name) || 0) + 1); }
    } else notObservable.add("Text without a style: values are listed, but no style name to use in code.");
    if (fn) { const k = `${fn.family} ${fn.style} ${size}`; fonts.set(k, (fonts.get(k) || 0) + 1); }
    const f = await paintDesc(n.fills, "textFill"); if (f) o.fill = f;
  }

  if (n.type === "INSTANCE") {
    let mc = null;
    try { mc = await n.getMainComponentAsync(); } catch (e) {}
    if (mc) {
      const nm = mc.parent && mc.parent.type === "COMPONENT_SET" ? mc.parent.name : mc.name;
      o.component = nm; components.set(nm, (components.get(nm) || 0) + 1);
      if (n.variantProperties) o.variant = n.variantProperties;
    } else notObservable.add("Some instances have a main component that could not be read (library not available).");
  }

  if ("reactions" in n && n.reactions && n.reactions.length) {
    for (const r of n.reactions) {
      const acts = r.actions || (r.action ? [r.action] : []);
      interactions.push({
        layer: n.name, id: n.id, trigger: r.trigger && r.trigger.type,
        actions: acts.map((a) => ({ type: a.type, to: a.destinationId || undefined, nav: a.navigation, transition: a.transition && a.transition.type, duration: a.transition && a.transition.duration })),
      });
    }
  }
  if (n.manualKeyframeTracks && Object.keys(n.manualKeyframeTracks).length) {
    animated.push({ layer: n.name, id: n.id, tracks: Object.keys(n.manualKeyframeTracks) });
  }
  if (n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION" || (o.fill && o.fill.image)) {
    o.export = n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION" ? "svg" : "png";
  }

  if ("children" in n && n.children.length && n.type !== "INSTANCE") {
    o.children = [];
    for (const c of n.children) {
      if (c.visible === false) continue;
      const w = await walk(c, depth + 1);
      if (w) o.children.push(w);
    }
  }
  return o;
};

const tree = await walk(root, 0);
const tokens = [...tokenUse.entries()].map(([name, t]) => ({ name, count: t.count, props: [...t.props] }));
return {
  root: { id: root.id, name: root.name, w: r2(root.width), h: r2(root.height) },
  nodesRead: count, truncated,
  tokens,
  textStyles: [...textStyles.entries()].map(([name, n]) => ({ name, n })),
  fonts: [...fonts.entries()].map(([k, n]) => ({ font: k, n })),
  components: [...components.entries()].map(([name, n]) => ({ name, n })),
  interactions,
  animated,
  notObservable: [...notObservable, "How it behaves at other screen widths (Figma shows one size).", "Real data lengths, loading, and error states unless they are drawn."],
  tree,
};
