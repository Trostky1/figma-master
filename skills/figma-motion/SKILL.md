---
name: figma-motion
description: Use to add animation inside Figma screens - fades, rises, slides, pops, presses, shakes, staggered lists - from tested recipes, with a calm, standard, or expressive dial and a reduced motion version. Applies manual keyframes with an all or nothing script, then checks the motion by exporting a video and reading key frames as one contact sheet. Also hands motion to code through get_motion_context.
---

# figma-motion

For motion INSIDE a screen (keyframes on layers). Motion BETWEEN screens (Smart Animate, Push) belongs to `figma-prototype`.

Load `figma-use` and `figma-use-motion` before any `use_figma` call. Pass `skillNames: "figma-use,figma-use-motion"`.

## Process

1. **Settings.** Read `.claude/figma.md` for the motion style (calm, standard, expressive) and default easing. If missing, use `standard`.
2. **Gate.** The script stops with a clear message if motion is off. Do not retry. Tell the user.
3. **Inspect** (read-only). List the target screen's layers. Names must be clear and unique inside the screen. Animate children, never the top level frame.
4. **Motion plan.** Write a short table and wait for a yes on anything bigger than one layer:

   | Layer | Recipe | Starts at (s) | Notes |
   |---|---|---|---|

   Say the intensity. Say if you will also make a reduced motion version.
5. **Apply.** Run `scripts/apply-motion.js` with the spec. It changes nothing if a name or recipe is wrong.
6. **Read back.** The script returns each layer's tracks. Check `mismatches` is empty.
7. **See it.** Run the frame check below. Do not skip it for anything with staggers or several layers. For one simple fade, reading the keyframes back is enough, and say so.
8. **Report.** Use the format below.

## Spec shape (for apply-motion.js)

```json
{
  "intensity": "calm",
  "reduced": false,
  "targets": [
    { "layer": "Home", "recipe": "rise-in", "children": true, "step": 0.08 },
    { "layer": "Home/Buy button", "recipe": "press", "delay": 1.0 },
    { "layer": "Home/Menu button", "recipe": "slide-in", "from": "right" }
  ]
}
```

- `layer` is `Screen name/Layer name`. Exactly one match, or the script stops.
- `children: true` animates each direct child of `layer`, offset by `step` seconds (default 0.06). This is the stagger.
- `delay`, `duration`, `easing` are optional per target. Easing must be a public name: `EASE_OUT`, `EASE_IN_AND_OUT`, `GENTLE`, `QUICK`. Never `EASE_IN_OUT`.
- `reduced: true` swaps entering recipes for a short fade (0.15 s) and skips the rest.
- Replace `__SPEC__` in the script. Keep the rest unchanged.
- The script extends the timeline to fit. It never shortens it.

Recipes and numbers: `references/recipes.md`.

## Frame check

`get_screenshot` shows only the resting frame. To see motion:

1. **List the moments** you need to see: start, each stagger step, the settle. 4 to 6.
2. **Export.** `export_video` on the top level frame that owns the timeline. `fps` 10, `quality: "low"`, `constraint: {type: "WIDTH", value: 320}`. Raise width to 768 only if text detail matters. If it says `processing`, call again with the `jobId` after 10 to 15 seconds.
3. **Ask before downloading.** Say the file name, that it comes from Figma's export link, and that it is small (low quality, a few seconds). Wait for a yes.
4. **Cut frames.** Download into a scratch folder, not the project. Then:

   ```bash
   node skills/figma-motion/scripts/extract-frames.mjs <video.mp4> <outDir> auto:6 3
   ```

   Or give times: `0,0.2,0.5,1.2`. It prints JSON and makes `sheet.png`, one image with every frame in order (left to right, top to bottom).
5. **Look at the sheet.** Check: order of arrival, the stagger gaps, overshoot, anything that pops or jumps, anything that never appears.
6. **Fix in one pass.** Batch every fix, then export again. Stop after two rounds unless something is clearly wrong.
7. **Delete the video** when done, unless the user wants it.

No ffmpeg? Say so. Run `/figma-doctor`. Offer the install command. Without it, read the keyframes back and say the motion was not seen.

## Defaults and taste

- Small UI change 0.15 to 0.25 s. Large move or page change 0.3 to 0.5 s.
- Things that arrive use `EASE_OUT`. Things that move across use `EASE_IN_AND_OUT`.
- Stagger 0.04 to 0.08 s. Keep a whole stagger under about 0.6 s.
- Do not animate everything. Pick the one thing the eye should follow.
- No loops. No big bounce. Nothing that distracts from reading.
- If the user asks for "more", change the intensity dial before you change the numbers by hand.

## Reduced motion

Run the script twice: once normal, once with `reduced: true` on a copy of the screen, or describe the difference in the report if the user does not want a copy. Do not mix the two on the same layers: the second run replaces the same tracks.

## Motion to code

When the user wants it in code, use the bridge. It writes plain CSS (no library) that plays once:

1. Run `scripts/read-motion.js` through `use_figma` (replace `__ROOT_ID__` with the screen id). It reads every animated layer.
2. Save the result as JSON in a scratch folder.
3. Run `node skills/figma-motion/scripts/motion-to-css.mjs <motion.json>` (add `--loop` to repeat).
4. Give the user the CSS and the class list at the top. Each class goes on the matching element. The stagger is built in through `animation-delay`.

What the bridge does:
- Uses Figma's own easing curves (EASE_OUT is `cubic-bezier(0, 0, 0.58, 1)`, as Figma reports it).
- Starts each layer at its own first keyframe (`animation-delay`) and lasts until its last one.
- Writes a reduced motion block: entering layers fade in over 0.15 s, other motion stops.
- Flips rotation (Figma counter clockwise is positive, CSS is the opposite).
- Warns when a layer's tracks use different keyframe times (values between are interpolated).

What it does not do: fills, strokes, effects, size, corner radius, path trim, and spring physics (springs are approximated with a curve and it warns). Those tracks are listed in a comment at the top of the CSS.

For a motion.dev snippet instead, `get_motion_context(nodeId, recursive: true)` returns one. It loops forever and uses the whole timeline (2 s by default) as one cycle. For one time entrances, remove the repeat and trim the duration.

## Report format

```
Motion: <screen>  <file URL>?node-id=<id>
Applied: <n> layers, intensity <level>, timeline <seconds>
Seen: <yes with sheet | no, keyframes read back only>
Fixed: <list or none>
Reduced motion: <made | not made>
For code: <motion.dev snippet offered | not asked>
```
