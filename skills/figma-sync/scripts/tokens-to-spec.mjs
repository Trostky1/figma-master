#!/usr/bin/env node
// figma-master: read design tokens from code and write a sync spec (JSON).
// Usage: node tokens-to-spec.mjs <tokens.css | tokens.json> [--collection Tokens]
// Reads: CSS custom properties (:root, dark blocks, prefers-color-scheme: dark)
//        or DTCG style JSON ({ "$value", "$type" }).
// Name rule: --color-gray-900  <->  color/gray/900   (dashes become slashes).
// Prints JSON to stdout: { collection, modes, tokens, skipped }.
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith("--") && !["--collection", "--chunk"].includes(args[i - 1]));
const ci = args.indexOf("--collection");
const collection = ci >= 0 ? args[ci + 1] : "Tokens";
if (!file) { console.error("Usage: node tokens-to-spec.mjs <tokens.css|tokens.json> [--collection Name]"); process.exit(2); }
const text = readFileSync(file, "utf8");

const skipped = [];
const byName = new Map(); // name -> { name, type, values: {Light, Dark} }

// ---------- value parsing ----------
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const hexToRgba = (h) => {
  let s = h.replace("#", "");
  if (s.length === 3 || s.length === 4) s = [...s].map((c) => c + c).join("");
  if (![6, 8].includes(s.length) || /[^0-9a-f]/i.test(s)) return null;
  const n = (i) => parseInt(s.slice(i, i + 2), 16) / 255;
  return { r: n(0), g: n(2), b: n(4), a: s.length === 8 ? n(6) : 1 };
};
const hslToRgb = (h, s, l) => {
  h = ((h % 360) + 360) % 360 / 360;
  const f = (n) => { const k = (n + h * 12) % 12; const a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1))); };
  return { r: f(0), g: f(8), b: f(4) };
};
const num = (s) => parseFloat(s);
const parseColor = (v) => {
  v = v.trim();
  if (v.startsWith("#")) return hexToRgba(v);
  let m = /^rgba?\(\s*([^)]+)\)$/i.exec(v);
  if (m) {
    const p = m[1].split(/[\s,\/]+/).filter(Boolean);
    if (p.length < 3) return null;
    const ch = (x) => (x.endsWith("%") ? clamp01(num(x) / 100) : clamp01(num(x) / 255));
    const a = p[3] === undefined ? 1 : p[3].endsWith("%") ? clamp01(num(p[3]) / 100) : clamp01(num(p[3]));
    return { r: ch(p[0]), g: ch(p[1]), b: ch(p[2]), a };
  }
  m = /^hsla?\(\s*([^)]+)\)$/i.exec(v);
  if (m) {
    const p = m[1].split(/[\s,\/]+/).filter(Boolean);
    if (p.length < 3) return null;
    const a = p[3] === undefined ? 1 : p[3].endsWith("%") ? clamp01(num(p[3]) / 100) : clamp01(num(p[3]));
    return { ...hslToRgb(num(p[0]), num(p[1]) / 100, num(p[2]) / 100), a };
  }
  return null;
};
const parseNumber = (v) => {
  v = v.trim();
  let m = /^(-?\d*\.?\d+)(px)?$/i.exec(v);
  if (m) return num(m[1]);
  m = /^(-?\d*\.?\d+)rem$/i.exec(v);
  if (m) return num(m[1]) * 16;
  return null;
};
const toToken = (name, raw) => {
  const v = String(raw).trim();
  const alias = /^var\(\s*--([\w-]+)\s*(?:,[^)]*)?\)$/.exec(v);
  if (alias) return { type: "ALIAS", value: { alias: alias[1].replace(/-/g, "/") } };
  const c = parseColor(v);
  if (c) return { type: "COLOR", value: c };
  const n = parseNumber(v);
  if (n !== null) return { type: "FLOAT", value: n };
  if (/font-?family|^font\//i.test(name) || /^["'].*["']$/.test(v) || /^[A-Za-z][\w -]*(,\s*[\w "'-]+)*$/.test(v) && /family/i.test(name)) {
    return { type: "STRING", value: v.replace(/["']/g, "").replace(/\s*,\s*/g, ", ") };
  }
  return null;
};
const add = (name, mode, raw) => {
  const t = toToken(name, raw);
  if (!t) { skipped.push({ name, reason: "unsupported value: " + String(raw).slice(0, 40) }); return; }
  let e = byName.get(name);
  if (!e) { e = { name, type: t.type, values: {} }; byName.set(name, e); }
  if (e.type !== t.type && !(e.type === "ALIAS" || t.type === "ALIAS")) {
    skipped.push({ name, reason: `type differs between modes (${e.type} vs ${t.type})` });
    return;
  }
  if (t.type !== "ALIAS" && e.type === "ALIAS") e.type = t.type;
  e.values[mode] = t.value;
};

// ---------- CSS ----------
const findBlocks = (src) => {
  // returns [{ prelude, body }] at the top level of src, balanced braces
  const out = []; let i = 0;
  while (i < src.length) {
    const open = src.indexOf("{", i);
    if (open < 0) break;
    const prelude = src.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, "").trim();
    let depth = 1, j = open + 1;
    while (j < src.length && depth) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; }
    out.push({ prelude, body: src.slice(open + 1, j - 1) });
    i = j;
  }
  return out;
};
const readDecls = (body, mode) => {
  const re = /--([\w-]+)\s*:\s*([^;{}]+);?/g; let m;
  let count = 0;
  while ((m = re.exec(body))) { add(m[1].replace(/-/g, "/"), mode, m[2]); count++; }
  return count;
};
const parseCss = (src) => {
  src = src.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const b of findBlocks(src)) {
    if (/^@media/i.test(b.prelude)) {
      const dark = /prefers-color-scheme\s*:\s*dark/i.test(b.prelude);
      if (!dark) continue;
      for (const inner of findBlocks(b.body)) readDecls(inner.body, "Dark");
      continue;
    }
    if (b.prelude.startsWith("@")) continue;
    const isDark = /dark/i.test(b.prelude);
    const isRoot = /(^|,)\s*(:root|html|body)\b/.test(b.prelude) || b.prelude === "*";
    if (isDark) readDecls(b.body, "Dark");
    else if (isRoot) readDecls(b.body, "Light");
    else if (/--[\w-]+\s*:/.test(b.body)) skipped.push({ name: b.prelude.slice(0, 40), reason: "component scoped custom properties ignored" });
  }
};

// ---------- DTCG JSON ----------
const parseJson = (src) => {
  const walk = (obj, path, inheritedType) => {
    if (obj && typeof obj === "object" && "$value" in obj) {
      const name = path.join("/").toLowerCase();
      const t = obj.$type || inheritedType;
      const v = obj.$value;
      const ref = typeof v === "string" ? /^\{([\w.-]+)\}$/.exec(v) : null;
      if (ref) { add2(name, { type: "ALIAS", value: { alias: ref[1].replace(/\./g, "/").toLowerCase() } }); return; }
      if (t === "color") add(name, "Light", v);
      else if (t === "dimension" || t === "number") add(name, "Light", String(v));
      else if (t === "fontFamily") add(name, "Light", Array.isArray(v) ? v[0] : v);
      else add(name, "Light", v);
      return;
    }
    if (obj && typeof obj === "object") for (const [k, v] of Object.entries(obj)) if (!k.startsWith("$")) walk(v, [...path, k], obj.$type || inheritedType);
  };
  const add2 = (name, t) => { byName.set(name, { name, type: t.type, values: { Light: t.value } }); };
  walk(JSON.parse(src), [], undefined);
};

if (/\.json$/i.test(file)) parseJson(text); else parseCss(text);

const modeSet = new Set(["Light"]);
for (const t of byName.values()) for (const m of Object.keys(t.values)) modeSet.add(m);
const modes = ["Light", ...[...modeSet].filter((m) => m !== "Light")];
const tokens = [...byName.values()].map((t) => {
  // every mode needs a value: fall back to Light
  const values = {};
  for (const m of modes) values[m] = t.values[m] ?? t.values.Light;
  return { name: t.name, type: t.type, values };
}).filter((t) => t.values.Light !== undefined);

// The use_figma code limit is 50,000 characters, so big sets must go in parts.
// --chunk N  prints an array of specs, N tokens each, compact, aliases last.
// --compact  prints one spec without indentation.
const chunkAt = args.indexOf("--chunk");
if (chunkAt >= 0) {
  const n = Math.max(1, parseInt(args[chunkAt + 1], 10) || 50);
  const ordered = [...tokens.filter((t) => t.type !== "ALIAS"), ...tokens.filter((t) => t.type === "ALIAS")];
  const parts = [];
  for (let i = 0; i < ordered.length; i += n) parts.push(ordered.slice(i, i + n));
  const out = parts.map((p, i) => ({ collection, modes, partial: parts.length > 1, part: i + 1, of: parts.length, tokens: p }));
  console.log(JSON.stringify({ parts: out, skipped }));
} else if (args.includes("--compact")) {
  console.log(JSON.stringify({ collection, modes, tokens, skipped }));
} else {
  console.log(JSON.stringify({ collection, modes, tokens, skipped }, null, 2));
}
