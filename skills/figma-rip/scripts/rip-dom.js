// figma-master: read a live page's real styles. Run INSIDE the page (built-in browser javascript_tool,
// Playwright evaluate, or Chrome). READ ONLY. It changes nothing on the page.
// It returns one JSON object. Save it, then run rip-to-style.mjs on it.
//
// Only read pages you are allowed to read (your own, or the user said yes for this exact URL).
// This reads style values only. It does not copy text, images, logos, or font files.

(() => {
  const MAX_EL = 4000;
  // ---- color normalizer: any CSS color (rgb, hsl, oklch, color-mix) -> sRGB [r,g,b,a] ----
  const cv = document.createElement("canvas"); cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const rgba = (css) => {
    if (!css) return null;
    try {
      cx.clearRect(0, 0, 1, 1); cx.fillStyle = "#000"; cx.fillStyle = css; cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], +(d[3] / 255).toFixed(3)];
    } catch (e) { return null; }
  };
  const hex = (c) => "#" + c.slice(0, 3).map((x) => x.toString(16).padStart(2, "0")).join("");
  const key = (c) => (c[3] < 1 ? hex(c) + Math.round(c[3] * 100).toString(16).padStart(2, "0") : hex(c));

  const bump = (map, k, w = 1, extra) => {
    const e = map.get(k) || { n: 0, w: 0, ...(extra || {}) };
    e.n += 1; e.w += w; map.set(k, e);
  };
  const top = (map, n) => [...map.entries()].sort((a, b) => b[1].w - a[1].w).slice(0, n);

  const textColors = new Map(), bgColors = new Map(), borderColors = new Map();
  const radii = new Map(), shadows = new Map(), spacing = new Map(), gaps = new Map();
  const motionDur = new Map(), motionEase = new Map();
  const fontFam = new Map(), sizes = new Map();
  const groups = {}; // per tag typography
  const GROUP_TAGS = ["h1", "h2", "h3", "h4", "p", "li", "a", "button", "label", "code", "small"];
  const buttons = new Map(), cards = new Map(), inputs = new Map();

  const vw = innerWidth, docH = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
  const els = [...document.querySelectorAll("body *")].slice(0, MAX_EL);
  let visible = 0;

  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? Math.round(n * 100) / 100 : null; };
  const sig = (o) => JSON.stringify(o);

  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) continue;
    visible++;
    const area = Math.min(r.width * r.height, vw * 4000);
    const tag = el.tagName.toLowerCase();

    // backgrounds
    const bg = rgba(cs.backgroundColor);
    if (bg && bg[3] > 0.05) bump(bgColors, key(bg), area);
    // borders
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (px(cs["border" + side + "Width"]) > 0 && cs["border" + side + "Style"] !== "none") {
        const bc = rgba(cs["border" + side + "Color"]); if (bc && bc[3] > 0.05) { bump(borderColors, key(bc), 1); break; }
      }
    }
    // radius
    const rad = px(cs.borderTopLeftRadius); if (rad > 0 && rad < 600) bump(radii, rad, area);
    // shadow
    if (cs.boxShadow && cs.boxShadow !== "none") bump(shadows, cs.boxShadow.slice(0, 160), 1);
    // spacing
    for (const p of ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"]) { const v = px(cs[p]); if (v > 0 && v <= 200) bump(spacing, v, 1); }
    for (const p of ["rowGap", "columnGap"]) { const v = px(cs[p]); if (v > 0 && v <= 200) bump(gaps, v, 1); }
    // motion
    if (cs.transitionDuration && cs.transitionDuration !== "0s") {
      cs.transitionDuration.split(",").forEach((d) => { const s = parseFloat(d) * (d.includes("ms") ? 0.001 : 1); if (s > 0) bump(motionDur, Math.round(s * 1000), 1); });
      cs.transitionTimingFunction.split(/,(?![^(]*\))/).forEach((t) => bump(motionEase, t.trim(), 1));
    }

    // text
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (hasText) {
      const len = [...el.childNodes].filter((n) => n.nodeType === 3).reduce((s, n) => s + n.textContent.trim().length, 0);
      const tc = rgba(cs.color); if (tc) bump(textColors, key(tc), len);
      const fam = cs.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      bump(fontFam, fam, len);
      const fs = px(cs.fontSize); if (fs) bump(sizes, fs + "|" + fam + "|" + cs.fontWeight, len);
      if (GROUP_TAGS.includes(tag)) {
        const g = groups[tag] || (groups[tag] = new Map());
        bump(g, sig({ fam, size: fs, weight: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, tt: cs.textTransform, color: key(tc || [0, 0, 0, 1]) }), len);
      }
    }

    // buttons
    const isBtn = tag === "button" || el.getAttribute("role") === "button" || /(^|\s|-)(btn|button|cta)(\s|-|$)/i.test(el.className && el.className.toString());
    if (isBtn && r.width > 40 && r.width < 500 && r.height > 20 && r.height < 120) {
      const tc = rgba(cs.color);
      bump(buttons, sig({ bg: bg && bg[3] > 0.05 ? key(bg) : "none", color: tc ? key(tc) : null, radius: rad || 0, padX: px(cs.paddingLeft), padY: px(cs.paddingTop), fam: cs.fontFamily.split(",")[0].replace(/["']/g, ""), size: px(cs.fontSize), weight: cs.fontWeight, border: px(cs.borderTopWidth) > 0 ? key(rgba(cs.borderTopColor) || [0, 0, 0, 1]) : "none", shadow: cs.boxShadow !== "none" ? cs.boxShadow.slice(0, 80) : "none" }), 1, { h: Math.round(r.height) });
    }
    // inputs
    if (tag === "input" || tag === "textarea" || tag === "select") {
      const tc = rgba(cs.color);
      bump(inputs, sig({ bg: bg && bg[3] > 0.05 ? key(bg) : "none", color: tc ? key(tc) : null, radius: rad || 0, border: px(cs.borderTopWidth) > 0 ? key(rgba(cs.borderTopColor) || [0, 0, 0, 1]) : "none", padX: px(cs.paddingLeft), padY: px(cs.paddingTop), size: px(cs.fontSize) }), 1, { h: Math.round(r.height) });
    }
    // cards: a box with its own surface (bg, border or shadow), real size, and children
    const hasBorder = px(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none";
    const hasShadow = cs.boxShadow !== "none";
    if (r.width > 180 && r.width < vw * 0.9 && r.height > 80 && r.height < 900 && el.children.length >= 1 && (hasBorder || hasShadow || (bg && bg[3] > 0.9)) && (rad > 0 || hasShadow)) {
      bump(cards, sig({ bg: bg && bg[3] > 0.05 ? key(bg) : "none", radius: rad || 0, border: hasBorder ? key(rgba(cs.borderTopColor) || [0, 0, 0, 1]) : "none", borderW: hasBorder ? px(cs.borderTopWidth) : 0, shadow: hasShadow ? cs.boxShadow.slice(0, 100) : "none", pad: px(cs.paddingTop) }), 1, { w: Math.round(r.width), h: Math.round(r.height) });
    }
  }

  // ---- sections: direct children of main, or body, with their own background ----
  const root = document.querySelector("main") || document.body;
  const sections = [...root.children].filter((e) => { const r = e.getBoundingClientRect(); return r.height > 120; }).slice(0, 24).map((e) => {
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); const b = rgba(cs.backgroundColor);
    return { tag: e.tagName.toLowerCase(), h: Math.round(r.height), bg: b && b[3] > 0.05 ? key(b) : "none", padY: px(cs.paddingTop) };
  });

  // ---- CSS variables on :root ----
  const vars = {};
  try {
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
      for (const rule of rules || []) {
        if (rule.selectorText === ":root" && rule.style) for (const p of rule.style) if (p.startsWith("--") && Object.keys(vars).length < 160) vars[p] = getComputedStyle(document.documentElement).getPropertyValue(p).trim().slice(0, 120);
      }
    }
  } catch (e) {}

  // ---- fonts the page loaded ----
  const fontsLoaded = [];
  try { document.fonts.forEach((f) => { if (fontsLoaded.length < 40) fontsLoaded.push({ family: f.family.replace(/["']/g, ""), weight: f.weight, style: f.style, status: f.status }); }); } catch (e) {}

  // ---- heading font guess ----
  const pickGroup = (m) => { if (!m) return null; const t = top(m, 1)[0]; return t ? { ...JSON.parse(t[0]), count: t[1].n } : null; };
  const typeGroups = {}; for (const t of GROUP_TAGS) typeGroups[t] = pickGroup(groups[t]);

  const out = {
    tool: "figma-master rip-dom.js v1",
    url: location.href, title: document.title, readAt: new Date().toISOString(),
    viewport: { w: innerWidth, h: innerHeight, docH }, elementsRead: els.length, visible,
    colorScheme: getComputedStyle(document.documentElement).colorScheme,
    prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
    textColors: top(textColors, 16).map(([c, v]) => ({ c, n: v.n, w: Math.round(v.w) })),
    bgColors: top(bgColors, 16).map(([c, v]) => ({ c, n: v.n, areaShare: +(v.w / ([...bgColors.values()].reduce((s, x) => s + x.w, 0) || 1)).toFixed(3) })),
    borderColors: top(borderColors, 8).map(([c, v]) => ({ c, n: v.n })),
    fonts: top(fontFam, 8).map(([f, v]) => ({ family: f, chars: v.w })),
    typeScale: top(sizes, 24).map(([k, v]) => { const [size, fam, weight] = k.split("|"); return { size: +size, family: fam, weight, chars: v.w }; }),
    typeByTag: typeGroups,
    radii: top(radii, 10).map(([r, v]) => ({ px: r, n: v.n })),
    shadows: top(shadows, 8).map(([s, v]) => ({ css: s, n: v.n })),
    spacing: top(spacing, 16).map(([s, v]) => ({ px: s, n: v.n })),
    gaps: top(gaps, 10).map(([s, v]) => ({ px: s, n: v.n })),
    motion: { durationsMs: top(motionDur, 6).map(([d, v]) => ({ ms: d, n: v.n })), easings: top(motionEase, 6).map(([e, v]) => ({ css: e, n: v.n })) },
    buttons: top(buttons, 6).map(([s, v]) => ({ ...JSON.parse(s), n: v.n, h: v.h })),
    inputs: top(inputs, 4).map(([s, v]) => ({ ...JSON.parse(s), n: v.n, h: v.h })),
    cards: top(cards, 6).map(([s, v]) => ({ ...JSON.parse(s), n: v.n, w: v.w, h: v.h })),
    sections, cssVariables: vars, fontsLoaded,
    notRead: ["text content", "images", "logos and icons", "font files", "page behavior and scripts", "states that need a pointer path", "dark mode (read it again with the page in dark mode)"],
  };
  return JSON.stringify(out);
})()
