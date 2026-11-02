# Motion recipes

All values below are before the intensity dial. The script holds the source of truth. Times are seconds.

| Recipe | Duration | Easing | What changes | Use for |
|---|---|---|---|---|
| `fade-in` | 0.25 | `EASE_OUT` | Opacity 0 to 1 | Anything that appears |
| `fade-out` | 0.20 | `EASE_IN_AND_OUT` | Opacity 1 to 0 | Anything that leaves |
| `rise-in` | 0.35 | `EASE_OUT` | Opacity 0 to 1, up 16 px | Cards, list rows, sections |
| `slide-in` | 0.35 | `EASE_OUT` | Opacity 0 to 1, across 24 px (`from: "left"` or `"right"`) | Panels, side items |
| `pop-in` | 0.30 | `EASE_OUT` | Opacity 0 to 1, scale 0.92 to 1 | Dialogs, badges, toasts |
| `press` | 0.18 | `EASE_IN_AND_OUT` | Scale 1, 0.96, 1 | Button feedback |
| `pulse` | 0.60 | `EASE_IN_AND_OUT` | Scale 1, 1.06, 1 | One time attention |
| `shake` | 0.40 | `EASE_IN_AND_OUT` | Across 0, -8, 8, -6, 6, 0 px | Error on a field |
| `draw-path` | 0.60 | `EASE_IN_AND_OUT` | Path trim end 0 to 1 | Lines, checkmarks, underlines (vector layers) |

## Intensity dial

| Level | Time multiplier | Distance and scale multiplier | Feel |
|---|---|---|---|
| `calm` | 1.3 | 0.7 | Slower, smaller. Quiet products. |
| `standard` | 1.0 | 1.0 | Default. |
| `expressive` | 0.85 | 1.4 | Quicker, bigger. Playful products. |

Example: `rise-in` at `calm` lasts 0.455 s and rises 11.2 px. Confirmed against `get_motion_context` output.

## Reduced motion

Entering recipes (`fade-in`, `fade-out`, `rise-in`, `slide-in`, `pop-in`) become a 0.15 s fade. `press`, `pulse`, `shake`, and `draw-path` are skipped.

## Rules from the Figma API

- Transform values add to the layer's resting position. Scale values multiply it.
- The first keyframe holds back to time 0. The last holds to the end.
- Scale uses `SCALE_XY` with a vector value `{x, y}`. Tested.
- Keyframes cannot go on a top level frame in the docs. The script blocks it.
- Changing x or rotation by hand does not make a keyframe. Always write tracks.

## Adding a recipe

Add a row to `RECIPES` in `scripts/apply-motion.js`: `dur`, `ease`, `enter` (true if it should fall back to a fade under reduced motion), and `build(k, options)` that returns `{ FIELD: [[fraction, value], ...] }`. Then add it to the table above. Test it on a copy and check the frames.

## Ideas not built yet

Color change over time, skeleton shimmer, count up numbers, text stagger (uses Figma's `TextStagger` style), blur in. Each needs its own test first.
