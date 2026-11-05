# Changelog

## 0.9.1
- Fix: `apply-reactions.js` and `apply-motion.js` could not find layers when the screen name contains " / " (the profile pattern `<Screen> / Mobile 393`). They split the path on the first "/". They now match the longest screen name that prefixes the path. Names without " / " behave as before. Found while wiring a 190 link prototype (Rove OS) with screens named `<Screen> / Rove 360`.
- Docs: `figma-prototype` and `figma-motion` SKILL.md say the screen name may contain " / ". Gotcha 32 added.
- Note: `AFTER_TIMEOUT` timeouts are milliseconds (already in `references/prototype.md`). The Plugin API typings do not state the unit.

## 0.9.0
- `/figma-app`, `/figma-mobile-site`, `/figma-poster` with profiles (`mobile-app.json`, `mobile-site.json`, `poster.json`). Written, not tested in Figma.
- `/figma-deslop` with `slop-scan.js`: finds AI slop in design and copy, swaps each sign for a choice from the style kit.
- `/figma-polish`: final quality pass checklist.
- `/figma-fix`: audit and fix in one command, with `apply-safe-fixes.js`.
- README quick start and command cheat sheet.

## 0.8.0
- `/figma-site`: responsive website page sets (Desktop, Tablet, Mobile) from a style kit.
- `profiles/website.json` and `site-check.js` (text size, targets, contrast, overflow, section parity, style fidelity).
- Breakpoint variable modes technique, tested in a real file (`references/breakpoint-modes.md`).
- `rip-image.mjs --sample` (exact pixel colors) and `rip-to-style.mjs --set` and `--stand-in`.
- Tested: a 3 frame home page. First check found accent text at 2.4 to 1 contrast and links under 24 px. Fixed. Second check clean for contrast.

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
