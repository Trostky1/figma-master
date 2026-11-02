---
name: figma-polish
description: Use for a final quality pass on a finished Figma design: alignment, spacing rhythm, hierarchy, type, color use, consistency across screens, component states, and layer hygiene. Finds the small things that make a design feel unfinished, fixes them inside the style kit, and does not change content or direction. Use before handoff or sharing.
---

# figma-polish

Polish is the last 10 percent. It does not redesign. It makes what exists tight, consistent, and finished.

Load `figma-use` before any `use_figma` call. Read the style kit if there is one.

## Process

1. **Scope.** A frame, a page set, or a component. Get ids.
2. **Measure.** Run `figma-audit` (`scan.js`) for the numbers. For a website set also run `site-check.js` from figma-site. For a deck run `deck-check.js` from figma-deck.
3. **Look.** One screenshot per frame at a size you can read. Walk the checklist below.
4. **List fixes** in three groups: **Safe** (no visible change in meaning), **Visible** (small look change), **Ask** (changes content or direction). Show the list.
5. **Apply Safe and Visible** after a yes. Use `apply-safe-fixes.js` from figma-fix where it fits, `use_figma` for the rest. Never touch the Ask group.
6. **Re-check.** Same scans and one screenshot. Report before and after.

## Checklist

**Alignment and spacing**
- Every edge aligns to the grid or to a neighbor. Nothing is off by 1 to 3 px.
- Spacing uses a scale (4, 8, 12, 16, 24, 32, 48, 64). No odd values like 13 or 22.
- Related things are closer than unrelated things. Gaps show grouping.
- Padding inside cards is even. Optical alignment for round and large type.

**Hierarchy**
- One thing is clearly first. Two levels of emphasis per area at most.
- Size ratios between levels are 1.25 or more. Headings are not just bold body.
- Buttons: one primary per view.

**Type**
- Text styles are used, not local overrides.
- Line height fits the size (1.4 to 1.6 body, 1.0 to 1.2 display). Tracking is set for caps and large display.
- No orphan words on the last line of headings. No line over 80 characters.
- Numbers line up in tables (tabular figures if the font has them).

**Color**
- Every fill and stroke is bound to a variable.
- Accent used sparingly. Contrast 4.5 for text, 3 for large text and icons.
- Greys come from the kit, not random values.

**Components and states**
- Buttons, inputs, and rows show default, hover, focus, pressed, disabled where they apply.
- Instances are not detached. Overrides are intentional.
- Icons share one stroke weight and size grid.

**Consistency**
- Same thing looks the same on every screen. Same radius, same shadow, same icon size.
- Same copy tone. Same capitalization rule on labels.

**Hygiene**
- Layer names say what the layer is. No `Frame 12`.
- No hidden leftovers, empty frames, or off canvas strays.
- Auto layout on containers. Fixed sizes only where needed.
- Frames named by the profile's pattern.

## Rules

- Stay inside the style kit. Polish is not a new look.
- Do not change copy. Flag typos. Do not fix them silently.
- Do not add features or sections.
- Prefer fewer changes that matter over many that do not.

Not observable: real devices, motion feel, fonts on other machines, how it reads to a first time visitor.
