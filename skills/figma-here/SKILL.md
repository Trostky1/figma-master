---
name: figma-here
description: Use when the user wants to point at a specific layer, component, or area in a Figma file and have it changed from chat. Takes a copy-link-to-selection link, finds the exact node, says back what it found (name, place, size, what it uses), and changes only that part after a yes. Also the fallback steps when there is no link.
---

# figma-here

The remote Figma tools do not see what the user has selected. Tested 2026-11-02: `figma.currentPage.selection` is empty inside `use_figma` and the viewport is a default. The official server has no "get selection" tool, and the read tools need a node id. So the user brings the pointer: **copy link to selection**.

## How the user points (option A, default)

In Figma: select the layer, then Copy link to selection (Edit menu, or right click, or `Ctrl+L` on Windows and `Cmd+L` on Mac). Paste the link in chat with what they want. The link carries `node-id`.

Other ways, if they cannot do that:

| Way | When |
|---|---|
| Describe it ("the hero card on Home") | Quick. Needs the match and confirm step below. |
| A comment pinned to the layer | Needs a token and extra tools. Not set up. |
| Console MCP selection tool | Needs a plugin and a token. Not set up. |
| Screen view | Last resort. Slow. |

## Process

1. **Parse the link.**

   ```bash
   node skills/figma-here/scripts/parse-figma-link.mjs "<url>"
   ```

   It returns `fileKey`, `nodeId` (with a colon), `kind` (design, slides, figjam), and warnings. A branch link uses the branch key as the file key. No `node-id` means the whole file: ask for a link to the selection.
2. **Session.** `create_session` for that file key, once.
3. **Look.** Run one read only `use_figma` call on the node id. Return: name, type, size, page, the parent path, child names, bound token names, whether it has motion or prototype links, and for text, the text. Take one `get_screenshot` of the node.
4. **Say it back.** One short paragraph and the screenshot:

   > I think you mean **Hero Compare** (frame, 480 by 340) on Home, inside Hero, on the Screens page. It has 7 children, uses 6 tokens, and has page load motion. Is that right?

   Wait for a yes. If it is wrong, ask them to paste a new link.
5. **Scope.** Only this node and its children may change. If the fix needs a change outside it (a shared component, a variable), say so and ask.
6. **Propose.** One line: what will change and what will not.
7. **Apply.** Follow `figma-master` write rules. For a component or variable, say how many other places it will change. Return ids.
8. **Show.** Read back what changed. One screenshot. Name the change so it can be found in Figma's version history.
9. **Remember.** If the user used a nickname ("the hero"), offer to save it in `.claude/figma.md` under `Aliases`.

## When the match is a description, not a link

1. Read a layer index of the page with one read only call (names, types, text, size, parent path, no more than 300 items).
2. Match their words to names and text. Show the top 3 with a screenshot each. Ask which one. Never pick for them.

## Rules

- Never change anything before the user says the restated node is right.
- Never widen the scope on your own.
- A link inside an instance (`I12:3;45:6`) points inside a component copy. Read the instance first, then explain what an edit would do to the main component.
- If the file key in the link differs from the file in use, say so and use the link's file.
- Edits go through the same safety rules as the rest of figma-master: inspect, read back, one screenshot.

## Not covered yet

Live selection tracking, comment pins, and Dev Mode selection. They need a plugin or a token and are listed in `docs/branches-research.md`.
