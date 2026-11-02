---
name: figma-deck
description: Use to build or restyle a Figma Slides deck in a chosen style kit (read from a site, a picture, a brand, or a Figma file) instead of a default look. Writes the kit into the Slides theme, plans every slide first, builds in batches with append first helpers, then checks text size, overlap, contrast, density, layout variety, and fidelity to the kit. Wraps Figma's figma-use-slides skill.
---

# figma-deck

Figma Slides only for now. Load `figma-use` and `figma-use-slides` before the first write. Pass `skillNames: "figma-use,figma-use-slides"`. This skill adds the style step, the profile, and the checks. Figma's skill holds the Slides API rules (read its gotchas). Do not repeat them here.

The profile is `profiles/presentation.json`. Its numbers are working defaults.

## Process

1. **Style kit (required).** If the user has not given one, run the style step of `figma-new`. A kit is a folder from `figma-rip`. Read `DESIGN.md` and `tokens.json`. If a role looks wrong, ask.
2. **Brief.** Audience, goal, length, content (finished text, notes, or only a topic). Ask at most 3 questions.
3. **File.** Use the user's Slides file, or `create_new_file` with `editorType: "slides"` (needs `planKey` from `whoami`). `create_session` once.
4. **Theme from the kit.** See "Translate the style" below. Do this once, before any slide.
5. **Plan (Phase 1).** For every slide: purpose, layout in words, background. Declare constants (font roles, color roles, the signature motif from the kit). Check variety: if the plan reads "two column, two column, grid", change it. Show the plan. Wait for a yes unless the user said to go ahead.
6. **Build (Phase 2).** 3 to 5 slides per `use_figma` call. Append first, then set size and position (Figma's rule; it is not optional). Use real text styles and bound variables. Return ids.
7. **Check.** Run `scripts/deck-check.js` (below). Fix what it finds. One screenshot of 1 or 2 slides after the first batch, and one at the end.
8. **Report.** Slides, sections, style kit used, check scores, what was left, and the not observable list.

## Translate the style (not copy it)

A web style uses screen pixels. A slide is 1920 by 1080. Translate by role:

| From the kit | To the deck |
|---|---|
| Font families | Same. Check they exist with `listAvailableFontsAsync`. |
| Weights, line height, tracking, text case | Same |
| Sizes | **From the profile**, by role: display, header, subheader, body, caption, label. Keep the kit's ratios (a thin condensed display face wants more size, a wide serif less). |
| Colors | Theme variables, named by role |
| Radius, hairlines, shadows | Same shape language. Keep it simple: 1 to 3 treatments |
| Buttons, tags, key caps, pills | Recurring motif: use one as the deck's signature, big enough to register |
| Motion timing | Slide transitions: kit's durations and easing, capped by the profile |

Never change the kit's identity to meet a minimum. Raise the size, keep the face. If the kit cannot meet a contrast limit with its own colors (for example white on its orange button), keep the color for shapes and large type, and use a readable ink color on it. Say what you changed and why.

### Write the theme

Slides files start with a collection `local slide colors` (8 variables) and 5 text styles (Title, Header, Subheader, Body, Caption, all Inter). Overwrite them. Reference code: `references/theme-from-style.md` (tested).

To put a second style in the same file, add variables with a prefix (`b-page`) and text styles with a prefix (`B Title`), put the slides in their own section, and check each section against its own kit.

## Layout rules (from Figma's slide guidance, as used here)

- One idea per slide. More slides, not denser ones.
- Vary the structure and where content anchors. Use the full canvas. Let shapes and display type bleed off an edge on purpose.
- At least one non text element per slide. One recurring signature motif.
- Pacing: dark and light, dense and open. Bookends can be dark.
- Body text left aligned. Center only titles, quotes, and single statements.
- No line under every heading. No identical layout with swapped colors.

## Checks

`scripts/deck-check.js` (read only). Replace `__PROFILE__` with the profile JSON and `__STYLE__` with:

```json
{ "rows": ["Open", "How"], "colors": ["#fdfdfd", "#070707"], "fonts": ["Alumni Sans", "Albert Sans"] }
```

`rows` limits the check to some sections. Use one check per style kit.

| Rule | Severity |
|---|---|
| Text under the absolute floor (18) | Critical |
| Text under the caption minimum, or long text under the body minimum | Warning |
| Text leaving the slide (large display type may bleed: Tip) | Critical |
| Low contrast (4.5, or 3 for text of 40 px and up) | Blocker or Critical |
| Text overlap | Warning |
| Too many words, flat hierarchy, no shape on the slide | Warning |
| Font or color not in the style kit | Warning |
| Three layouts in a row, too many font families, many slides with no sections | Warning |

Score 100 minus 12, 8, 4, 1 per finding. The report shows `offPalette` and `families`. A deck checked against the wrong kit scores low on purpose: that is how drift to a default look is caught.

Not observable: speaker notes, how it looks projected, slide transitions, and fonts on another machine. Say so.

## Known behavior (tested 2026-11-02)

- A new Slides file has 1920 by 1080 slides, one color collection, and 5 text styles.
- `createSlideRow()` then `createSlide(rowIndex, columnIndex)` makes sections. Name a section with `grid.children[i].name`.
- Slides made first may be renumbered by Figma. Do not rely on slide names for lookups. Use ids.
- `overflow` and effect shadows work on slide children (key caps, glow dots).
