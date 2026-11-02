---
description: Check that Claude Code and Figma are ready. Read-only by default. Prints PASS, WARN, FAIL, or NOT OBSERVABLE for each check.
argument-hint: "[figma file URL] [--write]"
---

Run a health check for the Figma connection. Report in short plain lines.

Arguments: `$ARGUMENTS`

## Rules

- Read-only unless the user passed `--write` AND says yes when asked.
- Never change the user's real files. The `--write` test uses a new scratch file.
- Never print tokens or secrets.
- If a check cannot run, mark it NOT OBSERVABLE. Do not guess.

## Checks

Run these in order. Batch independent checks in one message.

1. **Tools.** If Figma MCP tools are deferred, load them in one ToolSearch call. Check these exist: `whoami`, `use_figma`, `get_screenshot`, `get_metadata`, `get_design_context`, `get_motion_context`, `export_video`, `create_new_file`, `create_session`, `send_code_to_figma`. FAIL if `use_figma` or `whoami` is missing. WARN for any other missing tool.
2. **Login and seat.** Call `whoami`. Show plan name, tier, and seat. PASS for a Full or Dev seat. WARN for View or Collab seats: read tools allow only about 6 calls per month.
3. **Skills.** List which of these are installed: `figma-use`, `figma-generate-design`, `figma-generate-library`, `figma-use-motion`, `figma-implement-motion`, `figma-code-connect`, `figma-design-to-code`, `figma-create-new-file`. FAIL if `figma-use` is missing. WARN for others.
4. **File probe (needs a file URL).** If the user gave a Figma URL, extract the file key. Call `create_session`. Then run ONE read-only `use_figma` script that returns:
   - `figma.editorType`
   - page count and names
   - motion flag: `try { figma.motion.figmaAnimationStyles().length } catch (e) { 'OFF: ' + e.message }`
   - API probes with `typeof`: `figma.variables`, `figma.motion`, and `setReactionsAsync` on the first page's first child, if any
   - local variable collection count
   Report motion flag ON or OFF. OFF is a WARN: motion work is not possible, but all other work is.
   If no URL was given, mark this check NOT OBSERVABLE and say how to run it.
5. **ffmpeg.** Run `ffmpeg -version`. On Windows, if not on PATH, also look under `%LOCALAPPDATA%\Microsoft\WinGet\Packages` for `ffmpeg.exe`. PASS if found. WARN if missing: motion can be built, but not checked frame by frame. Offer the install command for the user's system. Do not install without a yes.
6. **Console MCP (optional).** Check whether any tool name contains `figma_console` or `figma-console`. Report as optional. Not a failure either way.
7. **Project memory.** Check for `.claude/figma.md`. If missing, say so. Offer to create it. Ask at most 2 questions: (a) the product font family, (b) the Figma library or file URL. Write the file from `skills/figma-master/references/memory-template.md`. Leave unknown fields as `unknown`.
8. **Write test (only with `--write` and a yes).** Create a scratch design file with `create_new_file`, named `figma-master doctor scratch`. Use `whoami` for the `planKey`. In it, run one `use_figma` script that makes a frame and a rectangle, then reads them back. Return the ids. PASS if the read-back matches. Tell the user the file is in their drafts and may be deleted.

## Output

Print one table: check, result, one-line note. Then:

- A short list of what to fix, most important first.
- One line: "Ready" if there are no FAIL results. Otherwise "Not ready" and the first fix.

Keep it under 25 lines.
