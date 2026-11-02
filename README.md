# figma-master

One entry point for Claude Code and Figma.

figma-master does not replace Figma's own skills. It picks the right ones for the job, adds safety and checking rules, and remembers project settings. Version 0.1 is the foundation: the router skill, a health check, and tested reference notes.

## What is in v0.3

| Piece | What it does |
|---|---|
| `skills/figma-master` | Router. Chooses which Figma skills to load. Sets the write, read-back, and approval rules. |
| `/figma-doctor` | Health check. Tools, login, seat, installed skills, motion flag, ffmpeg, project memory. Read-only by default. |
| `/figma-flow` | Plans screens, states, and paths before drawing. Plans only. Waits for approval. |
| `/figma-design` | Builds a screen with the project's library and variables. Verifies, then audits. Wraps Figma's own design skills. |
| `/figma-prototype` | Makes screens clickable from an approved interaction map. Name based, all or nothing apply script and a flow checker (broken links, unreachable screens, dead ends, Smart Animate name matches). |
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

Clone the repo, then add it as a local plugin or copy `skills/figma-master` and `commands/figma-doctor.md` into your `.claude` folder.

```bash
git clone https://github.com/<your-name>/figma-master
```

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
| 0.4 | Motion recipes, `/figma-animate`, and the frame check loop |
| 0.5 | `/figma-sync`, code to motion bridge, `/figma-handoff` |
| 0.6 | `/figma-learn`, evals, publish |

## Status

Motion and some write tools in Figma are beta. They can change. Run `/figma-doctor` after Figma updates.

## License

MIT. See `LICENSE` and `ATTRIBUTION.md`.
