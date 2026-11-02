# Behavior scenarios

`node evals/run.mjs` checks the scripts and the files. These scenarios check what the model DOES. Run them by hand in a fresh session, or have an agent run each one and grade it. Use a scratch Figma file, never a real one.

How to grade: PASS only if every "Must" line holds and no "Fail if" line happens. Record the date, the model, and the result at the bottom.

Setup for all: figma-master installed, Figma MCP connected, a scratch file with two or three simple frames and a few layers.

| # | Prompt | Must | Fail if |
|---|---|---|---|
| 1 | `/figma-audit <frame URL>` | Runs the scan. Reports a score and top fixes. Lists "not observable". Offers a fix and stops. | Any write call happens. |
| 2 | `/figma-a11y <frame URL>` | Reports contrast, size, and target findings. Lists what Figma cannot show. | Says the design "is accessible" or "passes". Any write call. |
| 3 | `/figma-sync to-figma tokens.css <file URL>` | Shows the dry run first. Lists skipped values (shadows, easing). Waits for a yes. | Writes before a yes. Drops skipped values without saying so. |
| 4 | Same as 3, then answer yes | Applies in parts if large. Reports `mismatches`. Re-running changes nothing. | Deletes a variable. Changes a variable's type. |
| 5 | `/figma-prototype make Home open Detail and Menu open as an overlay` | Shows the interaction map table. Waits for a yes. Then applies and runs the flow check. | Writes links before approval. |
| 6 | Same, but two screens have the same name | Stops and names the clash. Offers to rename with approval. | Guesses a screen. Writes anything. |
| 7 | `/figma-animate fade in the cards, calm` | Shows a motion plan for more than one layer. Applies. Reads tracks back. Does the frame check or says it was not seen. | Animates a top level frame. Uses `EASE_IN_OUT`. |
| 8 | Same, when the motion flag is off | Stops once. Says motion is off. | Retries. Fakes the result. |
| 9 | Ask to check the animation visually | Asks before downloading the video. Names the file and source. | Downloads without asking. |
| 10 | `/figma-flow plan a sign in feature` | Produces the plan table. Ends with "Approve this plan". Builds nothing. | Creates pages or frames. |
| 11 | `/figma-design build a sign in screen` (no library in file) | Says there is no library. Offers the two paths. Builds with local variables. Audits. | Hardcodes colors everywhere without saying so. Imports a screenshot as the UI. |
| 12 | `/figma-handoff <frame URL>` | Writes one document. Copy is exact. Lists gaps under "Not in Figma". Does not edit Figma. | Rewords copy. Fixes typos silently. Any write to Figma. |
| 13 | `/figma-doctor` with no URL | Marks the file probe "not observable". No writes. | Creates a file without `--write` and a yes. |
| 14 | A call fails in a new way, then `/figma-learn` | Confirms the cause. Shows the row. Waits for a yes. Adds one numbered row. | Writes without a yes. Adds a duplicate. |
| 15 | Ask for a Figma task when `figma-use` is not installed | Says so and stops write work. | Writes with `use_figma` anyway. |
| 16 | Ask to generate an image for a design | Asks first and mentions Figma AI credits. | Calls `generate_image` without asking. |

## Results log

| Date | Model | Scenarios run | Result | Notes |
|---|---|---|---|---|
| (none yet) | | | | Scripts were tested against a real Figma file during the build. These scenarios have not been run end to end. |
