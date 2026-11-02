---
name: figma-master
description: Use for any task that reads or writes Figma through the Figma MCP server. Covers building screens, prototype links and Smart Animate, keyframe motion, variables and tokens, design system work, audits, and Figma to code. Picks the right Figma skills, applies safety and verification rules, and reads project settings from .claude/figma.md. Run /figma-doctor first on a new machine or file.
---

# figma-master

A thin router. It does not replace Figma's own skills. It decides which ones to load, adds safety rules, and makes sure every write is checked.

## Step 0: Preflight

1. Read `.claude/figma.md` in the project, if it exists. It holds the project's fonts, library, motion style, and file URLs. Format: `references/memory-template.md`.
2. If it does not exist and the task writes to Figma, run `/figma-doctor` first (or ask at most 2 questions, then write the file).
3. If Figma tools are deferred, load them in ONE ToolSearch call.
4. Call `create_session` once the file key is known. Reuse its id on every file tool call.

## Step 1: Route the task

Always load `figma-use` before any `use_figma` call. Add the rows that match.

| Task | Load these skills | Notes |
|---|---|---|
| Plan screens and paths before drawing | `figma-flow` (ours) | Plan only. Waits for approval. |
| Build or edit a screen, modal, panel | `figma-design` (ours), which loads `figma-use` and `figma-generate-design` | Find library parts first. No hardcoded colors if variables exist. |
| Review design quality (read-only) | `figma-audit` (ours), `figma-use` | Scores 0 to 100. Never edits. |
| Accessibility check (read-only) | `figma-a11y` (ours), `figma-use` | WCAG 2.2 AA. Lists what Figma cannot show. |
| Build components, variants, tokens | `figma-use`, `figma-generate-library` | Variables before components. |
| Prototype links, Smart Animate, flows | `figma-prototype` (ours), `figma-use` | Needs an approved interaction map. Reference: `references/prototype.md`. |
| Motion inside a screen (fade, rise, stagger, press) | `figma-motion` (ours), `figma-use`, `figma-use-motion` | Recipes, intensity dial, frame check. Stops if the motion flag is off. Notes: `references/motion.md`. |
| Motion to code (CSS) | `figma-motion` (ours) bridge scripts. Or `get_motion_context` for motion.dev. | Plays once. Reduced motion included. |
| Tokens between code and Figma variables | `figma-sync` (ours), `figma-use` | Dry run first. Never deletes. |
| Developer handoff document | `figma-handoff` (ours), `figma-use` | Read-only on Figma. |
| Figma frame to code | `figma-design-to-code` | Use the handoff document as the spec beside it. |
| Code Connect | `figma-code-connect` | |
| FigJam or Slides | `figma-use-figjam` or `figma-use-slides` | |
| Create a new file | `figma-create-new-file` | Needs `planKey` from `whoami`. |
| Health check | `/figma-doctor` | Read-only by default. |

If a skill in the table is not installed, say so and continue with `figma-use` rules only. Do not invent its rules.

Available commands: `/figma-doctor`, `/figma-flow`, `/figma-design`, `/figma-prototype`, `/figma-animate`, `/figma-sync`, `/figma-handoff`, `/figma-audit`, `/figma-a11y`.

Planned for later versions (not available yet): `/figma-learn`.

## Step 2: Rules for every write

1. **Inspect first.** Read the file before you change it. Match its names and structure.
2. **Retry safe scripts.** One script either fully applies or fails early. Check for existing items before you create them.
3. **Return ids.** Every write returns the ids it made or changed, plus counts.
4. **Read back.** After you set a binding, reaction, or keyframe, read it again and compare. A call that does not throw can still leave the file wrong.
5. **Approval ladder for bulk changes.** Scan, preview, approve, change, verify. An approval covers one pass only. It never carries over.
6. **Say what you cannot see.** If a tool cannot read something, write "not observable". Do not guess.
7. **Test on a copy.** Do not run new write patterns on the user's main file. Ask first.
8. **Ask before spending credits.** `generate_image` uses Figma AI credits. Ask and wait for yes.
9. **Keep frames small.** Large selections slow or break tools. Work section by section.
10. **No flattened screenshots as the deliverable.** UI must be real layers.

## Step 3: Verify

- Static: one `get_screenshot` after composing. One more only after a fix.
- Structure: counts, names, and bounds from the write call.
- Motion: `get_screenshot` shows only the resting frame. Follow `references/motion.md` and use `export_video` plus ffmpeg frames.
- Prototype: read `node.reactions` back and compare to what you set.

## Step 4: Learn

When a call fails in a new way, tell the user in one line, and offer to add it to `references/gotchas.md`. Only write it with their yes.

## References (load only when needed)

- `references/capabilities.md` - what was tested to work, with dates.
- `references/prototype.md` - triggers, actions, transitions, exact shapes.
- `references/motion.md` - keyframe rules and the frame check loop.
- `references/gotchas.md` - silent failures and fixes.
- `references/memory-template.md` - the `.claude/figma.md` format.
