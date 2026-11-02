# Gotchas

Each item was met in real use. Add new ones only with the user's yes.

| # | Problem | Fix |
|---|---|---|
| 1 | `scopes = []` on a BOOLEAN variable throws "Invalid scope for this variable type". | Use `['ALL_SCOPES']`. |
| 2 | A setup script fails halfway and leaves half-made variables. A later retry then makes duplicates. | Look up the collection first. Create only what is missing. |
| 3 | Test 2 used an id that test 1 failed to make. It gave a confusing validation error. | Check each id exists before you use it. |
| 4 | `setReactionsAsync` error text is very long and lists every action type. | Look for the line that names your field, such as "Required value missing at ... variableId". |
| 5 | `CONDITIONAL` with an EQUALS expression throws "Invalid expression function or arguments". | Use a variable alias condition for boolean toggles. |
| 6 | Changing `x` or rotation does not create a keyframe. | Write the track with `applyManualKeyframeTrack`. |
| 7 | `get_screenshot` never shows motion. | Use the frame check loop in `motion.md`. |
| 8 | Video links expire. | Read `availableUntil`. Download only with the user's yes. |
| 9 | Page context resets to the first page on every `use_figma` call. | Switch pages with `setCurrentPageAsync` once per call. |
| 10 | A text write fails if the font is not loaded. | Load the font first. Check the style name with `listAvailableFontsAsync`. |
| 11 | The motion API is beta and gated by a flag. | Probe first (`motion.md`). |
| 12 | `typeof node.someMissingProp` throws instead of returning "undefined". | Wrap probes in try/catch. |
| 13 | A thrown error rolls back the whole script, including nodes made earlier in it. A "missing" result after an error is not a bug. | Re-run the full script after the fix. |
| 14 | `setReactionsAsync` replaces ALL reactions on a node. | Read `node.reactions` first and pass `[...existing, ...new]` to keep them. |
| 15 | Smart Animate between frames with no shared layer names acts like a dissolve. | Give the same layer the same name in both frames. |
| 16 | New files already have a flow starting point named "Flow 1". | Overwrite `page.flowStartingPoints` to set your own. |
| 17 | Asking ffmpeg for a frame at the very end of a video writes nothing and still exits quietly. | Stay about 0.15 s before the end. `extract-frames.mjs` does this and retries once. |
| 18 | Timeline default is 2 s. Short animations then play with a long still tail in a loop. | Check `timelines`. The motion script only extends it. Shorten by hand only if the user asks. |
| 19 | Exported motion code loops forever (`repeat: Infinity`). | Remove the repeat for one time entrances. |
| 20 | Two recipes on one layer that write the same field replace each other. | Use different recipes per layer, or give the later one a different field. |
