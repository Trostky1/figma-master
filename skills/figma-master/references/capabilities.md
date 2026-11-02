# Tested capabilities

Tested 2026-11-02 on a Full seat, student tier, with the official remote Figma MCP server. Results can differ by plan and by Figma beta changes. Run `/figma-doctor` to recheck.

| Capability | Result | Note |
|---|---|---|
| Create file (`create_new_file`) | Works | Needs `planKey` from `whoami`. |
| Write with `use_figma` | Works | Frames, shapes, variables. |
| Variables with modes (Light, Dark) | Works | `addMode`, `setValueForMode`, bind with `setBoundVariableForPaint`. |
| Variable scopes | Works, one rule | BOOLEAN variables reject `[]`. Use `['ALL_SCOPES']`. |
| Reaction: click, Smart Animate, spring easing | Works | Read back matched. |
| Reaction: timeout, Push, matchLayers | Works | Read back matched. |
| Action `SET_VARIABLE` | Works | Shape in `prototype.md`. |
| Action `CONDITIONAL` with a variable alias | Works | |
| Action `CONDITIONAL` with an expression (EQUALS) | Failed | Signature not found yet. |
| Action `SET_VARIABLE_MODE` | Works | |
| Action `NODE` with `OVERLAY` and `MOVE_IN` | Works | Tested with a menu overlay. |
| Action `BACK`, `CLOSE`, `URL` | Works | |
| Several actions in one reaction (set variable, then branch) | Works | |
| Set flow starting point | Works | Assign `page.flowStartingPoints = [{nodeId, name}]`. There is no `setFlowStartingPointsAsync`. A new file already has a default "Flow 1". |
| Failed script leaves the file unchanged | Observed | A script that throws is rolled back, including nodes it made earlier in the same call. |
| `typeof node.missingProp` | Throws | In the sandbox, reading an unknown property on a node throws. Wrap probes in try/catch. |
| Action `SWAP` between two overlays | Works (2026-11-02) | Written and read back. Not played. |
| Action `CHANGE_TO` on component variants (hover, press, click) | Works | Reactions live on the variants and show on instances. |
| Action `SCROLL_TO` with `SCROLL_ANIMATE` | Works | Frame needs `overflowDirection = "VERTICAL"`. Target is a layer inside it. |
| Triggers `ON_KEY_DOWN` (K is 75, Esc is 27) and `AFTER_TIMEOUT` | Write and read back fine | Not played, so real key behavior is unseen. |
| Overlay position, background, click outside | Read only | Cannot be set in code. |
| `setBoundVariable("visible", booleanVariable)` | Works | Used for a notes panel driven by a prototype variable. |
| `setExplicitVariableModeForCollection` on a frame | Works | One frame shows Light, another Dark, side by side. |
| Text style `fontSize` bound to a variable | Works | Changing the token moved the style (11 to 12). |
| Real video frame check (Motion lab, 3.2 s, 8 frames, 34 KB) | Works | Fade, rise, slide, pop in order. The check mark drew in three steps. |
| Variable collection with Light and Dark, 13 tokens, alias | Works | Created, re-read, matched. Re-running the sync changed nothing (13 unchanged). |
| Scopes `FRAME_FILL`, `SHAPE_FILL`, `TEXT_FILL`, `STROKE_COLOR`, `GAP`, `CORNER_RADIUS`, `FONT_SIZE`, `FONT_WEIGHT`, `FONT_FAMILY` | Accepted | Used by `sync-tokens.js`. |
| `setBoundVariable('cornerRadius', v)` | Works | Binds the four per-corner fields. The reader checks `topLeftRadius`. |
| Code to Figma to code token round trip | Works | CSS, spec, Figma, export, CSS, spec: 0 differences on 13 tokens. |
| Figma keyframes expose the real curve | Yes | `easingFunctionCubicBezier` comes with EASE_OUT (0, 0, 0.58, 1) and EASE_IN_AND_OUT (0.42, 0, 0.58, 1). |
| Library variables (team library) | Not tested | The exporter skips aliases to library variables and lists them. |
| Motion flag | On for the tested account | 7 styles: TextStagger, Position, Scale, Rotation, Size, Opacity, Path. |
| Manual keyframes | Works | Default timeline 2 seconds. |
| Animation styles apply and remove | Works | |
| Custom animation styles API | Available | |
| Keyframes on a top-level frame | Accepted | Docs say avoid it. Animate children. |
| Static move adds a keyframe | No | Write tracks yourself. |
| `SCALE_XY` keyframes with a vector value | Works | `{type:'VECTOR', value:{x,y}}`. |
| Stagger by offsetting keyframe times per layer | Works | Read back and `get_motion_context` both matched. |
| `export_video` | Works | Rendered at once for a small 2 s timeline. Returns a download URL that expires in about a week. |
| `get_motion_context` | Works | Returns motion.dev snippets and timeline groups. Every track has `repeat: Infinity`, and the whole timeline (2 s default) is one loop. Trim for one time entrances. |
| ffmpeg | Not bundled | Needed to cut frames from the video. `extract-frames.mjs` finds it on PATH or in the winget folder. |
| Frame cutter and contact sheet | Works | Tested 2026-11-02 on a real Figma export (19 KB, 2.1 s, 320 px wide, low quality, 10 fps). Six frames showed the stagger order, the settle, and the late press. Export download needs the user's yes. |
| Read rate limits | Not hit | Write tools are exempt. View and Collab seats are very limited. |
