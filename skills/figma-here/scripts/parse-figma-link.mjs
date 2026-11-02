#!/usr/bin/env node
// figma-master: turn a Figma link (copy link to selection) into the ids the Figma tools need.
// Usage: node parse-figma-link.mjs "<url>"
// Prints JSON: { ok, kind, fileKey, nodeId, nodeIdUrl, branchKey, fileName, hasNode, warnings }
// nodeId uses a colon (7:6). The URL form uses a dash (7-6). Branch links use the branch key as the file key.
const raw = (process.argv[2] || "").trim();
const out = { ok: false, input: raw, warnings: [] };
const done = (code) => { console.log(JSON.stringify(out, null, 2)); process.exit(code); };
if (!raw) { out.error = "No link given."; done(2); }

let u;
try { u = new URL(raw.startsWith("http") ? raw : "https://" + raw); } catch { out.error = "Not a valid URL."; done(2); }
if (!/(^|\.)figma\.com$/i.test(u.hostname)) { out.error = "Not a figma.com link."; done(3); }

const parts = u.pathname.split("/").filter(Boolean).map(decodeURIComponent);
const kinds = { design: "design", file: "design", board: "figjam", slides: "slides", deck: "slides", make: "make", proto: "prototype", buzz: "buzz" };
const kind = kinds[parts[0]];
if (!kind) { out.error = `Unknown Figma link type "${parts[0] || ""}".`; done(4); }
out.kind = kind;
out.fileKey = parts[1] || null;
if (!out.fileKey) { out.error = "No file key in the link."; done(4); }

// branch links: /design/<fileKey>/branch/<branchKey>/<name>
if (parts[2] === "branch" && parts[3]) { out.branchKey = parts[3]; out.fileKey = parts[3]; out.fileName = parts[4] || null; out.warnings.push("Branch link: use the branch key as the file key."); }
else out.fileName = parts[2] || null;

const nid = u.searchParams.get("node-id") || u.searchParams.get("starting-point-node-id");
out.hasNode = !!nid;
if (nid) {
  // 7-6 or 7%3A6 or 7:6; component sets can be I7:6;8:9 (instance paths)
  const clean = nid.replace(/-/g, ":");
  out.nodeId = clean;
  out.nodeIdUrl = nid.replace(/:/g, "-");
  if (/;/.test(clean)) out.warnings.push("This id points inside an instance. Read the instance, then find the layer by name.");
} else {
  out.warnings.push("No node-id in the link. It points at the whole file or page. Ask the user to select the layer and copy the link to the selection.");
}
if (u.searchParams.get("m") === "dev") out.warnings.push("Dev Mode link. It still has a node id.");
out.ok = true;
done(0);
