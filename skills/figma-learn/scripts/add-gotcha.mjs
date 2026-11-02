#!/usr/bin/env node
// figma-master: add one row to references/gotchas.md. Only run this after the user says yes.
// Usage: node add-gotcha.mjs --problem "<what went wrong>" --fix "<what to do>" [--file <gotchas.md>] [--dry]
// Exit codes: 0 added (or dry run ok), 2 bad input, 3 duplicate, 4 table not found.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
const problem = get("--problem");
const fix = get("--fix");
const dry = args.includes("--dry");
const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(get("--file") || join(here, "..", "..", "figma-master", "references", "gotchas.md"));

const clean = (s) => String(s ?? "").replace(/\r?\n+/g, " ").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
if (!problem || !fix || clean(problem).length < 15 || clean(fix).length < 8) {
  console.error("Need --problem (15+ chars) and --fix (8+ chars).");
  process.exit(2);
}

const text = readFileSync(file, "utf8");
const lines = text.split(/\r?\n/);
const rowRe = /^\|\s*(\d+)\s*\|(.*)\|(.*)\|\s*$/;
let last = -1, lastNum = 0;
lines.forEach((l, i) => { const m = rowRe.exec(l); if (m) { last = i; lastNum = Math.max(lastNum, +m[1]); } });
if (last < 0) { console.error("Gotcha table not found in " + file); process.exit(4); }

// duplicate check: same text, or the first 40 letters match an existing problem
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const want = norm(clean(problem));
for (const l of lines) {
  const m = rowRe.exec(l);
  if (!m) continue;
  const have = norm(m[2]);
  if (have === want || (want.length >= 40 && have.startsWith(want.slice(0, 40))) || (have.length >= 40 && want.startsWith(have.slice(0, 40)))) {
    console.error(`Duplicate of gotcha #${m[1]}.`);
    process.exit(3);
  }
}

const n = lastNum + 1;
const row = `| ${n} | ${clean(problem)} | ${clean(fix)} |`;
if (!dry) {
  lines.splice(last + 1, 0, row);
  writeFileSync(file, lines.join("\n"));
}
console.log(JSON.stringify({ added: n, row, dry, file }));
