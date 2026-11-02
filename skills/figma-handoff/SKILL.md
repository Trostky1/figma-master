---
name: figma-handoff
description: Use to turn a finished Figma frame into a developer handoff - layout, tokens used, text styles, components, states, interactions, motion as CSS, assets to export, and what Figma cannot show. Reads the frame with a read-only script, adds Figma's own design context, and writes one handoff document. Does not change the Figma file.
---

# figma-handoff

Read-only on Figma. Writes one document in the project. For turning a frame into running code, use Figma's `figma-design-to-code` skill, and use this skill's document as the spec beside it.

Load `figma-use` before any `use_figma` call (read-only calls too).

## Process

1. **Scope.** One frame per handoff. Get the node id from the URL. If the user gave a page, ask which frame.
2. **Settings.** Read `.claude/figma.md` for the tokens file, library, and where docs live.
3. **Session.** `create_session` once.
4. **Read.** Run `scripts/handoff-read.js` through `use_figma` (replace `__ROOT_ID__`). It returns the tree, tokens, text styles, fonts, components, interactions, and animated layers. If `truncated` is true, hand off smaller frames.
5. **Official context.** Call `get_design_context` for the same node. Use it for layout and component hints. If the result and the script disagree, say so and trust the script for values, and the official tool for structure.
6. **Screenshot.** One `get_screenshot` for the document header.
7. **Motion.** If `animated` is not empty, run `../figma-motion/scripts/read-motion.js` and `../figma-motion/scripts/motion-to-css.mjs` and include the CSS.
8. **Tokens check.** If the project has a tokens file, compare the `tokens` list with it. Mark tokens that exist in Figma but not in code. Mention `figma-sync`.
9. **Write** the document (format below). Default path: `docs/handoff/<frame-slug>.md`. Ask if the project has a different place.
10. **Report** the path and the open issues. Do not change the Figma file.

## Document format

```markdown
# <Frame name>
Figma: <file URL>?node-id=<id>    Size: <w> x <h>    Date: <date>

## Summary
<two lines: what the screen is for, what the user does here>

## Layout
<outline of the structure, top to bottom, with auto layout direction, gap, padding, alignment.
 Use token names, not raw numbers, when a token is bound.>

## Tokens used
| Token | Used for | Count | In code? |

## Typography
| Style or font | Size | Where |
Text without a style is marked "no style".

## Components
| Component | Variant | Count |

## Content
<real copy, in order, character for character. Flag typos. Do not fix them.>

## Interactions
| Layer | Trigger | Action | Goes to | Transition |

## Motion
<CSS from motion-to-css.mjs, plus the stagger order in words. Plays once. Reduced motion included.>

## Assets
| Layer | Export as |
Vector layers: SVG. Image fills: PNG or the original file.

## States
<states that are drawn: hover, focus, disabled, loading, empty, error. And which are missing.>

## Not in Figma (needs a decision)
<the notObservable list, plus anything missing: responsive behavior, real data lengths, error text.>

## Open issues
<hardcoded values, unnamed layers, mismatches with the token file>
```

## Rules

- Copy is exact. No rewording, no fixing typos. Flag them.
- Use token names when they exist. List raw values only where no token is bound, and mark them.
- Do not guess behavior Figma cannot show. Put it under "Not in Figma".
- Conditional logic in prototypes appears as `CONDITIONAL` only. Read `node.reactions` on that layer if the developer needs the branches.
- Keep the document under about 300 lines. For a big screen, split by section.

## Output

```
Handoff: <frame>  ->  <path>
Tokens <n> (<n> not in code)   Components <n>   Interactions <n>   Animated <n>
Open issues: <n>
```
