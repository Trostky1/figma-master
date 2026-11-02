---
name: figma-design
description: Use to build or change a screen, modal, or multi-section view in Figma from a brief, a flow plan, or code. Runs a fixed process - read project settings, check the plan, find library parts, build with variables and auto layout, verify with a screenshot, then run an audit. Wraps Figma's own figma-use and figma-generate-design skills and adds checks.
---

# figma-design

A process wrapper. The building rules live in Figma's `figma-use` and `figma-generate-design` skills. Load both before the first write. This skill adds the steps around them.

## Process

1. **Settings.** Read `.claude/figma.md`. Note font, library, variables prefix, motion style. If it is missing and this is a new project, run the short setup from `figma-master` (2 questions at most).
2. **Plan check.** If a `figma-flow` plan exists, build from it. If the task is more than one screen and there is no plan, run `figma-flow` first and wait for approval. For a single screen or a small change, a one-line brief is enough.
3. **Screen brief.** Write 4 lines before you draw. Wait for a yes only if the task is large or unclear.
   - Purpose of the screen.
   - Main action.
   - Content blocks, top to bottom.
   - States to show.
4. **Session.** `create_session` once the file key is known. Reuse the id.
5. **Discover.** Follow the discovery steps in `figma-generate-design`: Code Connect, `get_libraries`, `search_design_system`, existing screens. Use library components, variables, and styles. Do not draw a button if the library has one.
6. **Fonts.** Use the font from the settings or the source. Do not default to Inter. Check style names with `listAvailableFontsAsync`.
7. **Build.** Create one wrapper frame. Build sections inside it with auto layout. Bind colors and spacing to variables. Name every layer by role. Return ids from every call.
8. **Read back.** Check the structure with counts, names, and bounds. Check that font family matches the settings.
9. **Look.** One `get_screenshot` of the wrapper. Fix visible problems with targeted edits. One more screenshot after fixes. No more.
10. **Audit.** Run `figma-audit` on the wrapper (read-only). Fix Blockers and Criticals you caused. Show the user the rest.
11. **Report.** Say what was built, where (file URL and node id), the audit score, and anything left.

## Hard rules

- UI must be real layers. Never import a screenshot of the finished UI as the deliverable.
- No raw hex or pixel values when a variable exists.
- No default layer names in the result.
- Real text for real content. No "Lorem ipsum" unless the user asks for placeholders. Label placeholders clearly.
- Do not change frames outside the wrapper.
- Test new patterns on a copy if the file is the user's main file. Ask first.
- Ask before using `generate_image` (Figma AI credits).

## When there is no library

Say so. Offer two paths: (a) create local variables and a few components first with `figma-generate-library`, or (b) build the screen with local variables only. Do not hide the gap by hardcoding values everywhere.

## When code is the source

Read the code first. List the components used and their default props. Match defaults, not only the explicit props. Use the real copy from the code, character for character. Flag typos. Do not fix them without asking.

## Output

End with a short report:

```
Built: <name> - <file URL>?node-id=<id>
Audit: <score>/100  (Blockers <n>, Critical <n>)
Left to do: <list or "nothing">
```
