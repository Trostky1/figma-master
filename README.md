# figma-master

One entry point for Claude Code and Figma.

figma-master does not replace Figma's own skills. It picks the right ones for the job, adds safety and checking rules, and remembers project settings. Version 0.1 is the foundation: the router skill, a health check, and tested reference notes.

## Quick start

```text
/plugin marketplace add Trostky1/figma-master
/plugin install figma-master@figma-master
/figma-doctor <your figma file link>
```

Then pick a path:

1. **Start with a style.** Run `/figma-rip <link or image>` to read a look into a style kit. Or let `/figma-new` ask you.
2. **Build.** Use the command for your format (table below).
3. **Clean up.** Run `/figma-fix`, then `/figma-deslop`, then `/figma-polish`.
4. **Hand off.** `/figma-handoff` for code notes. `/figma-sync` for tokens.

Rules that always hold: it asks before it reads a site, asks before it writes in bulk, and never copies text, images, logos, or font files from a reference. Only values.

## Command cheat sheet

**Start and style**

| Command | Use it to | Example |
|---|---|---|
| `/figma-doctor` | Check tools, login, seat, skills | `/figma-doctor <file link>` |
| `/figma-new` | Start a design. Asks format and style first | `/figma-new a landing page for a coffee brand` |
| `/figma-rip` | Read a style from a site, image, Mobbin screen, or Figma file | `/figma-rip https://example.com` |
| `/figma-flow` | Plan screens, states, paths. Plans only | `/figma-flow signup and onboarding` |

**Build by format**

| Format | Command | Example |
|---|---|---|
| Presentation (Figma Slides) | `/figma-deck` | `/figma-deck 8 slide pitch, style kit "warm"` |
| Website (Desktop, Tablet, Mobile) | `/figma-site` | `/figma-site home page, style kit "bold"` |
| Mobile app (iOS, Android) | `/figma-app` | `/figma-app habit tracker, 6 screens` |
| Mobile website (phone first) | `/figma-mobile-site` | `/figma-mobile-site restaurant site` |
| Poster (print) | `/figma-poster` | `/figma-poster 18x24 event poster` |
| One screen with a library | `/figma-design` | `/figma-design settings screen` |

**Interact and animate**

| Command | Use it to | Example |
|---|---|---|
| `/figma-prototype` | Make screens clickable from an approved map | `/figma-prototype <flow link>` |
| `/figma-animate` | Add motion from 9 recipes (calm, standard, expressive) | `/figma-animate hero entrance, calm` |
| `/figma-app`, `/figma-mobile-site`, `/figma-poster` | Format branches for mobile apps, phone first sites, and print posters. Profiles in `profiles/`. Written, not yet tested in Figma. |
| `/figma-fix`, `/figma-deslop`, `/figma-polish` | Audit and fix in one command, AI slop removal (design and copy), and a final quality pass. |
| `/figma-here` | Point at a layer with "Copy link to selection", then change only that | `/figma-here <link> make this button bigger` |

**Quality**

| Command | Use it to | Changes the file? |
|---|---|---|
| `/figma-audit` | Score a frame 0 to 100 by severity | No |
| `/figma-a11y` | WCAG 2.2 AA check | No |
| `/figma-fix` | Audit and fix the safe findings in one go. Asks before look changes | Yes, safe fixes only |
| `/figma-deslop` | Remove AI slop: default gradients, Inter everywhere, template cards, filler copy | Yes, after your yes |
| `/figma-polish` | Final pass: alignment, spacing, hierarchy, states, naming | Yes, after your yes |

**Code and memory**

| Command | Use it to | Example |
|---|---|---|
| `/figma-sync` | Keep tokens in step between code and Figma variables. Dry run first | `/figma-sync tokens.css` |
| `/figma-handoff` | Read-only developer notes for one frame | `/figma-handoff <frame link>` |
| `/figma-learn` | Record a new Figma gotcha. Writes only after your yes | `/figma-learn text style lost on instance` |

## How to point at a layer

In Figma, right click the layer, then **Copy/Paste as**, then **Copy link to selection**. Paste the link with your request. The plugin reads that exact node, tells you what it found, then changes only that.

## Status by format

| Format | Status |
|---|---|
| Presentation, Website | Built and tested in Figma |
| Mobile app, Mobile website, Poster | Written, not yet tested in Figma. Expect rough edges and report them with `/figma-learn` |
| `/figma-fix`, `/figma-deslop`, `/figma-polish` | Written, scripts not yet run in Figma. Run on a copy first |

## What is in v0.9

| Piece | What it does |
|---|---|
| `skills/figma-master` | Router. Chooses which Figma skills to load. Sets the write, read-back, and approval rules. |
| `/figma-doctor` | Health check. Tools, login, seat, installed skills, motion flag, ffmpeg, project memory. Read-only by default. |
| `/figma-new` | Starts any design. Asks the format (presentation, website, mobile app, mobile site, poster) and the style first. Loads the format profile from `profiles/`. |
| `/figma-rip` | Reads the styles of a live site, a screenshot, a Mobbin result, or a Figma file into a reviewable style kit (colors with roles, type, spacing, shapes, motion). Asks before every read. Copies values only. Writes provenance. |
| `/figma-deck` | Builds a Figma Slides deck in a chosen style kit, then checks text size, overlap, contrast, density, layout variety, and fidelity to the kit. Tested with two very different styles on the same content. |
| `/figma-site` | Builds a responsive website page set (Desktop 1440, Tablet 768, Mobile 390) in a chosen style kit. Uses a Breakpoint variable collection so type and spacing change per frame. Checks text size, touch targets, contrast, overflow, parity, and style fidelity. |
| `/figma-here` | Point at a layer with a copy-link-to-selection link. Says back what it found, then changes only that part. |
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
| 0.7 (done) | Format profiles, presentation branch (`/figma-new`, `/figma-deck`), style reading (`/figma-rip`), pointing by link (`/figma-here`) |
| 0.8 (done) | Website branch (`/figma-site`, `site-check.js`, Breakpoint modes) |
| 0.9 (done, untested) | Mobile app, mobile site, poster branches. `/figma-fix`, `/figma-deslop`, `/figma-polish` |
| Next | Test the 0.9 pieces in Figma. Comment pins and live selection for `/figma-here`. |
| 0.6 (done) | `/figma-learn`, offline evals, conflict rulings, publish prep |
| Later | Untested actions (swap, change-to, scroll-to, key press), text stagger and color motion recipes, team library variables, a real run of every slash command |

## Status

Motion and some write tools in Figma are beta. They can change. Run `/figma-doctor` after Figma updates.

## License

MIT. See `LICENSE` and `ATTRIBUTION.md`.
