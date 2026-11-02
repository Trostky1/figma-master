# Audit report: figma skill tests
Date: 2026-11-02    Scanned by `figma-audit` (`scan.js`) and `figma-a11y` (`a11y-extra.js`). Read only.

## Scores

| Screen | First pass | After fixes |
|---|---|---|
| Splash | 88 | 96 |
| Home | 0 | 96 |
| Skill detail | 4 | 100 |
| Commands | 0 | 100 |
| Settings | 40 | 100 |
| Palette | 72 | 100 |
| Palette Docs | 84 | 100 |

The first pass was bad on purpose to learn from: it came from my own first draft, not a staged failure.

## What the first pass found (top fixes)

| # | Rule | Count | Root cause | Fix |
|---|---|---|---|---|
| 1 | tiny-text (Critical) | 38 | One token: `font/size/xs` was 11 | Changed the token to 12 in `tokens.css`. `figma-sync` showed a one line drift, applied it, and the text style followed. |
| 2 | tiny-target (Blocker) | 10 | Nav links were 19 px tall | 44 px minimum height on nav links and the footer link |
| 3 | small-target (Warning) | 23 | Buttons and pills were 41 and 36 px tall | `minHeight` 44 on Button and Pill components, 44 px rows in the palette |
| 4 | no-auto-layout (Warning) | 2 | Hero compare mock, splash loader | Accepted. Both are decorative and use absolute positions. |

Colors were never a problem. Lowest text contrast in the file is 4.51:1 (needs 4.5:1).

## Accessibility notes (figma-a11y)

| Check | Result |
|---|---|
| Contrast | No failures. Lowest 4.51:1. |
| Text size | No text under 12 after the fix. |
| Targets | All interactive layers are 44 x 44 or larger after the fix. |
| Auto advance | Splash moves on by itself after 1500 ms. Accepted for a splash. Needs a way to skip if shipped. |
| Moving transitions | 34 moving transitions (Smart Animate, Push, Move in). A reduced motion version would use Dissolve. |
| States | Button has Default, Hover, Pressed, Focus, Disabled (Focus and Disabled added after the first check). Pill has no hover, focus, or disabled. Not fixed. |

## What Figma cannot show (not observable)
- Keyboard order and focus paths.
- Screen reader names and roles.
- How the design looks to color blind users.
- Whether color alone carries meaning.

No verdict is given that the design is accessible.
