#!/usr/bin/env node
// figma-master: write CSS custom properties (or DTCG JSON) from a token spec or a Figma export.
// Usage: node tokens-to-css.mjs <export.json> [--dtcg] [--dark-selector '[data-theme="dark"]']
// Input: output of export-tokens.js or tokens-to-spec.mjs ({ modes, tokens }).
// Name rule: color/gray/900 -> --color-gray-900. First mode goes in :root.
// Other modes go in a selector (default [data-theme="dark"] for a mode named Dark).
// Numbers get px, except names that look unitless (weight, opacity, line height, ratio, scale, z, count).
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const file = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--dark-selector");
if (!file) { console.error("Usage: node tokens-to-css.mjs <export.json> [--dtcg] [--dark-selector SELECTOR]"); process.exit(2); }
const si = args.indexOf("--dark-selector");
const darkSelector = si >= 0 ? args[si + 1] : '[data-theme="dark"]';
const dtcg = args.includes("--dtcg");

let data = JSON.parse(readFileSync(file, "utf8"));
if (data.parts) data = { ...data.parts[0], tokens: data.parts.flatMap((p) => p.tokens) };
const { modes, tokens } = data;
if (!modes || !tokens) { console.error("Input needs { modes, tokens }."); process.exit(3); }

const hex2 = (x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, "0");
const colorCss = (c) => {
  const a = c.a ?? 1;
  const h = "#" + hex2(c.r) + hex2(c.g) + hex2(c.b);
  return a >= 0.999 ? h : h + hex2(a);
};
const UNITLESS = /(weight|opacity|line\/height|leading|ratio|scale|(^|\/)z(\/|$)|count|flex)/;
const cssName = (n) => "--" + n.replace(/\//g, "-");
const valueCss = (t, v) => {
  if (v && v.alias) return `var(${cssName(v.alias)})`;
  const type = t.resolvedType || t.type;
  if (type === "COLOR") return colorCss(v);
  if (type === "FLOAT") return UNITLESS.test(t.name) || v === 0 ? String(v) : `${v}px`;
  if (type === "STRING") return /family/.test(t.name) ? v : JSON.stringify(v);
  return String(v);
};

if (dtcg) {
  const root = {};
  for (const t of tokens) {
    const parts = t.name.split("/");
    let o = root;
    for (const p of parts.slice(0, -1)) o = o[p] ??= {};
    const v = t.values[modes[0]];
    const type = t.resolvedType || t.type;
    o[parts.at(-1)] = v && v.alias
      ? { $value: `{${v.alias.replace(/\//g, ".")}}` }
      : { $type: type === "COLOR" ? "color" : type === "FLOAT" ? (UNITLESS.test(t.name) ? "number" : "dimension") : "fontFamily",
          $value: type === "COLOR" ? colorCss(v) : type === "FLOAT" && !UNITLESS.test(t.name) ? `${v}px` : v };
  }
  console.log(JSON.stringify(root, null, 2));
  process.exit(0);
}

const out = [];
const block = (selector, mode, onlyChanged) => {
  const lines = [];
  for (const t of tokens) {
    const v = t.values[mode];
    if (v === undefined) continue;
    if (onlyChanged && JSON.stringify(v) === JSON.stringify(t.values[modes[0]])) continue;
    lines.push(`  ${cssName(t.name)}: ${valueCss(t, v)};`);
  }
  if (lines.length) out.push(`${selector} {\n${lines.join("\n")}\n}`);
};
block(":root", modes[0], false);
for (const m of modes.slice(1)) block(/^dark$/i.test(m) ? darkSelector : `[data-theme="${m.toLowerCase()}"]`, m, true);
console.log(out.join("\n\n"));
