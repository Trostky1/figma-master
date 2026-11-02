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
| Action `SWAP`, `CHANGE_TO`, `SCROLL_TO`, `ON_KEY_DOWN` | Not tested | |
| Motion flag | On for the tested account | 7 styles: TextStagger, Position, Scale, Rotation, Size, Opacity, Path. |
| Manual keyframes | Works | Default timeline 2 seconds. |
| Animation styles apply and remove | Works | |
| Custom animation styles API | Available | |
| Keyframes on a top-level frame | Accepted | Docs say avoid it. Animate children. |
| Static move adds a keyframe | No | Write tracks yourself. |
| `export_video` | Works | Returns a download URL that expires. |
| `get_motion_context` | Works | Returns motion.dev snippets and timeline groups. |
| ffmpeg | Not bundled | Needed to cut frames from the video. |
| Read rate limits | Not hit | Write tools are exempt. View and Collab seats are very limited. |
