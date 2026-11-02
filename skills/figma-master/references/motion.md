# Motion reference

Load `figma-use-motion` too. It holds the full keyframe shapes. This file adds the checks and defaults.

For real work, use the `figma-motion` skill. It has tested recipes, an apply script, and a frame cutter (`extract-frames.mjs`). This file is the short background.

## Gate

Motion can be off for an account. The first motion call then throws "is not a supported API". Stop. Tell the user motion is off. Do not retry.

Quick probe (read-only):

```js
try { return { on: true, styles: figma.motion.figmaAnimationStyles().map(s => s.styleId) }; }
catch (e) { return { on: false, error: String(e) }; }
```

## Write rules

- Animate children, not top-level frames.
- Write tracks with `applyManualKeyframeTrack(field, track)`. Changing `x` or rotation by hand does not make a keyframe.
- Transform fields add to the node's resting value. Scale multiplies it. `0` and `1` are neutral.
- The first keyframe holds back to time 0. The last holds to the end. You do not need an extra start keyframe.
- Timelines are in seconds. Extend with `setTimelineDuration`. Do not shorten unless asked.
- Use `EASE_IN_AND_OUT`, not `EASE_IN_OUT`.
- Return the changed node ids. Read `manualKeyframeTracks` back.

## Defaults (when the user gives no style)

- Small UI change: 0.15 to 0.25 s.
- Large move or page change: 0.3 to 0.5 s.
- Enter with ease out. Leave with ease in.
- Stagger related items 0.04 to 0.08 s apart.
- No loops and no big bounce unless asked.
- If the project asks for reduced motion, make a second version with fades only.

## Frame check loop

`get_screenshot` shows the resting frame only. To check motion:

1. List the key moments first. Usually 4 to 6.
2. `export_video` on the top-level frame that owns the timeline. Use `fps` 5 to 10, `quality: "low"`, and `constraint: {type:'WIDTH', value:320}`. Raise width to 768 or more only for fine detail.
3. If the result says `processing`, call again with the `jobId` after 10 to 15 seconds.
4. Ask the user before you download the file. Save it in a scratch folder.
5. Cut frames: `ffmpeg -ss <seconds> -i anim.mp4 -frames:v 1 frame_<seconds>.png`
6. Look at every frame. Fix everything you find in one pass. Then render again.

No ffmpeg? Skip the video. Check the keyframes by reading them back, and say the motion was not seen.

## Motion to code

`get_motion_context(nodeId, recursive: true)` returns motion.dev snippets and groups of nodes that share a timeline. Use it before you write code for an animation.
