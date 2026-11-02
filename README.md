# figma-master

One entry point for Claude Code and Figma.

figma-master does not replace Figma's own skills. It picks the right ones for the job, adds safety and checking rules, and remembers project settings. Version 0.1 is the foundation: the router skill, a health check, and tested reference notes.

## What is in v0.6

| Piece | What it does |
|---|---|
| `skills/figma-master` | Router. Chooses which Figma skills to load. Sets the write, read-back, and approval rules. |
| `/figma-doctor` | Health check. Tools, login, seat, installed skills, motion flag, ffmpeg, project memory. Read-only by default. |
| `/figma-flow` | Plans screens, states, and paths before drawing. Plans only. Waits for approval. |
| `/figma-design` | Builds a screen with the project's library and variables. Verifies, then audits. Wraps Figma's own design skills. |
| `/figma-prototype` | Makes screens clickable from an approved interaction map. Name based, all or nothing apply script and a flow checker (broken links, unreachable screens, dead ends, Smart Animate name matches). |
| `/figma-animate` | Adds motion inside a screen from 9 tested recipes (fade, rise, slide, pop, press, pulse, shake, draw, stagger). Calm, standard, or expressive dial. Reduced motion option. Checks the result as a contact sheet of video frames (needs ffmpeg). Hands motion to code. |
| `/figma-sync` | Keeps design tokens in step between code (CSS or DTCG JSON) and Figma variables. Light and dark modes, aliases, scopes. Dry run first. Never deletes. Also exports Figma back to CSS. Tested round trip with 0 differences. |
| `/figma-handoff` | Read-only developer handoff document for one frame: layout, tokens used, text, components, interactions, motion as plain CSS (plays once, reduced motion included), assets, and what Figma cannot show. |
| `/figma-learn` | Records a new Figma failure or surprise in the gotcha list. Confirms it first, drafts one row, writes only after you say yes, refuses duplicates. |
| `/figma-audit` | Read-only design review. Scores 0 to 100 by severity. Tested scan script (`skills/figma-audit/scripts/scan.js`). |
| `/figma-a11y` | Read-only WCAG 2.2 AA check: contrast, text size, targets, states, motion. Lists what Figma cannot show. |
| `references/capabilities.md` | What was tested to work, with dates. |
| `references/prototype.md` | Triggers, actions, transitions, easing, tested shapes. |
| `references/motion.md` | Keyframe rules, defaults, and a frame check loop with ffmpeg. |
| `references/gotchas.md` | Silent failures and fixes. |
| `references/memory-template.md` | The `.claude/figma.md` project settings file. |

## Needs

- Claude Code with the official Figma MCP server connected (the Figma plugin sets this up).
- Figma's skills: `figma-use` is required. Others are used when present.
- A Full or Dev seat for real work. View and Collab seats get very few read calls.
- Optional: ffmpeg, to check animation frames.

## Install

From the marketplace file in this repo (after it is on GitHub):

```text
/plugin marketplace add Trostky1/figma-master
/plugin install figma-master@figma-master
```

Or clone it and point Claude Code at the folder:

```bash
git clone https://github.com/Trostky1/figma-master
claude plugin validate ./figma-master
```

## Safety

- Scripts that only read are named `scan`, `check`, `read`, `export`, `handoff`. An offline check fails the build if one of them writes.
- Scripts that write are `apply-reactions`, `apply-motion`, and `sync-tokens`. Each one resolves every name first and changes nothing if one is wrong. `sync-tokens` is a dry run unless told otherwise and never deletes.
- Nothing in this repo makes network calls or stores tokens. Downloads (an exported video) need your yes each time.
- Run new write patterns on a scratch copy of your file first.

## Tests

```bash
npm test
```

No dependencies. It checks the plugin files and runs every Node script against fixtures, including a CSS to Figma spec to CSS round trip. It skips the video test if ffmpeg is not installed. Behavior scenarios for the model itself are in `evals/scenarios.md`.

## First run

```text
/figma-doctor https://www.figma.com/design/<file-key>/<name>
```

Add `--write` to also run a write test in a new scratch file. It asks first.

## Roadmap

| Version | Adds |
|---|---|
| 0.2 (done) | `/figma-design`, `/figma-flow`, `/figma-audit`, `/figma-a11y` |
| 0.3 (done) | `/figma-prototype` for flows, triggers, variables, and logic |
| 0.4 (done) | Motion recipes, `/figma-animate`, and the frame check loop |
| 0.5 (done) | `/figma-sync`, code to motion bridge, `/figma-handoff` |
| 0.6 (done) | `/figma-learn`, offline evals, conflict rulings, publish prep |
| Later | Untested actions (swap, change-to, scroll-to, key press), text stagger and color motion recipes, team library variables, a real run of every slash command |

## Status

Motion and some write tools in Figma are beta. They can change. Run `/figma-doctor` after Figma updates.

## License

MIT. See `LICENSE` and `ATTRIBUTION.md`.
