# Changelog

## 0.7.0
- Format profiles (`profiles/`), starting with `presentation.json`.
- `/figma-new`: asks the format and the style first. Claude's default look is not a style.
- `/figma-rip`: page read (`rip-dom.js`), image read (`rip-image.mjs`), and `rip-to-style.mjs` that writes a style kit (DTCG tokens, `DESIGN.md`, components, evidence, provenance). Ask before every read. Values only.
- `/figma-deck`: Figma Slides decks from a style kit, with `deck-check.js` (text size, overlap, contrast, density, layout variety, style fidelity per section).
- `/figma-here`: pointing by copy-link-to-selection. `parse-figma-link.mjs`. Tested that the remote sandbox does not see the live selection.
- `docs/branches-research.md`: research on branches, ripping styles, and selection.
- Tested: the same content in two different styles (a page read, and a Mobbin image plus chosen fonts). Checking deck A against kit B scored 46 on purpose.

## 0.6.1
- Ran every skill on a real mock app (see `examples/figma-skill-tests/`).
- `apply-reactions.js`: `toLayer` for scroll targets and component variants, component sets count as screens, stops on links to their own screen, reports per layer write failures.
- `apply-motion.js`: `draw-path` checks for an open vector with a centered stroke before it writes.
- Prototype skill: tested and documented swap, change to, scroll to, and key presses.
- Gotchas 26 to 31 and nine capability rows recorded from the run (overlay settings are read only, scroll enum, own screen links, path trim, variant clones, variant reactions on instances).

## 0.6.0
- Added `/figma-learn` and `add-gotcha.mjs`.
- Added offline checks (`npm test`): file structure, script behavior, round trips.
- Added `evals/scenarios.md` (16 behavior scenarios) and `CONFLICTS.md` (12 rulings).
- Added a marketplace file for install by name.

## 0.5.0
- Added `/figma-sync` (CSS or DTCG tokens and Figma variables, dry run first, never deletes).
- Added the motion to CSS bridge (`read-motion.js`, `motion-to-css.mjs`).
- Added `/figma-handoff` (developer document from a frame).

## 0.4.0
- Added `/figma-animate`: 9 motion recipes, intensity dial, reduced motion, frame check with ffmpeg.

## 0.3.0
- Added `/figma-prototype`: name based apply script, flow checker, defaults table.

## 0.2.0
- Added `/figma-flow`, `/figma-design`, `/figma-audit`, `/figma-a11y`.

## 0.1.0
- Router skill, `/figma-doctor`, reference notes, README, license, attribution.
