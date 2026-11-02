---
name: figma-site
description: Use to build a responsive website page set in Figma Design (Desktop, Tablet, Mobile frames) in a chosen style kit. Sets up a Breakpoint variable collection so type and spacing change per frame, builds components first, then checks text size, touch targets, contrast, overflow, section parity across breakpoints, and fidelity to the style kit. Wraps Figma's figma-use and figma-generate-design skills.
---

# figma-site

Figma Design files. Load `figma-use` and `figma-generate-design` before the first write. Pass `skillNames: "figma-use,figma-generate-design"`. This skill adds the style step, the breakpoint technique, the profile, and the checks.

The profile is `profiles/website.json`. Its numbers are working defaults.

## Process

1. **Style kit (required).** If there is none, run the style step of `figma-new`. Read `DESIGN.md` and `tokens.json`. If a family is not in Figma, use a stand in and say so (the kit records it).
2. **Brief.** Pages, audience, main action, content. Ask at most 3 questions.
3. **File.** Use the user's Design file or `create_new_file` (needs `planKey` from `whoami`). `create_session` once.
4. **Variables.** Make a `Theme` collection from the kit (color roles). Make a `Breakpoint` collection with modes Desktop, Tablet, Mobile. See `references/breakpoint-modes.md` (tested).
5. **Text styles.** Bind `fontSize` to Breakpoint variables. Names by role: display, headline, title, body, small, button, label.
6. **Components first** on their own page: button (style by state), card, FAQ item. Bind fills to Theme variables.
7. **Plan.** List sections in order. The same sections, in the same order, on every breakpoint.
8. **Build.** One frame per breakpoint: `<Page> / Desktop 1440`, `<Page> / Tablet 768`, `<Page> / Mobile 390`. Auto layout everywhere. Append first, then set sizing. Set each frame's explicit Breakpoint mode with `frame.setExplicitVariableModeForCollection`. Build one section per call and return ids.
9. **Check.** Run `scripts/site-check.js`. Fix what it finds. Screenshot Desktop and Mobile.
10. **Report.** Frames, kit used, scores, what was left, and the not observable list.

## Responsive rules

- Desktop 1440, Tablet 768, Mobile 390. Columns 12, 8, 4.
- Same content, same order. Layout may stack (cards go from a row to a column).
- Do not build Mobile by scaling Desktop. Sizes come from the Breakpoint mode.
- Primary button in the first 900 px.
- Touch frames: targets 44 or more. Pointer: 24 or more.

## Checks

`scripts/site-check.js` (read only). Replace `__PROFILE__` with the profile JSON and `__STYLE__` with:

```json
{ "colors": ["#ecebe9", "#1e1d22"], "fonts": ["Geist", "Inter"], "skipNames": ["Type sample", "Chip #"] }
```

`skipNames` skips layers that show other colors on purpose (sample swatches).

| Rule | Severity |
|---|---|
| Target under 24 | Blocker |
| Contrast under 3, or under 4.5 for body | Blocker or Critical |
| Text under 11, or horizontal overflow | Critical |
| Text under the minimum for its role, long lines, no auto layout | Warning |
| Breakpoint mode not set, missing section, missing breakpoint, section order differs | Warning |
| Touch target under 44, button below 900 px | Warning |
| Hardcoded fill, color or font not in the kit, over 3 font families | Warning |
| Content differs between breakpoints | Tip |

Score 100 minus 12, 8, 4, 1 per finding.

## Known behavior (tested 2026-11-02)

- Accent colors often fail as small text. Orange `#fe6901` on cream is about 2.6 to 1. Use the accent for shapes and large type. Use the muted ink for small labels.
- Text nodes have no padding. Raise a small link to the touch size with line height, or wrap it in a frame with padding.
- A text node set to wrap needs a fixed width and `textAutoResize = "HEIGHT"`.

Not observable: real content length, page speed, keyboard order, screen reader output, how it behaves between the three widths, and browser differences. Say so.
