---
name: figma-flow
description: Use before drawing screens in Figma. Turns a product idea or feature into a flow plan - screens, states, entry and exit points, and Figma page structure - and gets approval before anything is built. Optionally draws the flow as a FigJam diagram. Plans only; does not build screens.
---

# figma-flow

Plan first. Draw second. This skill makes the plan and stops. `figma-design` builds from it.

## Process

1. **Read context.** Read `.claude/figma.md` if present. Read any brief, PRD, or code the user points to. Look at the target Figma file's pages (read-only) so the plan matches what exists.
2. **Ask at most 2 questions.** Only if the answer would change the plan: who the user is and what they want to finish, and which platform (web, iOS, Android). If the brief already says, ask nothing.
3. **Write the plan** in the format below.
4. **Wait for approval.** Do not build. Do not create pages.
5. **Optional diagram.** If the user asks, draw the flow in FigJam with `generate_diagram`. Load `figma-generate-diagram` first.

## Plan format

```
Flow: <name>
Goal: <one sentence: what the user finishes>
Platform: <web | iOS | Android>

Screens
| # | Screen | Purpose | Entry from | Exits to |
| 1 | ...    | ...     | ...        | ...      |

States to design (per screen)
- <screen>: default, loading, empty, error, success, <others that apply>

Happy path: 1 > 2 > 5
Edge paths: <back, cancel, error retry, permission denied, offline>

Figma pages
- <Page name> : <what lives here>

Open questions
- <only real ones>
```

## Rules

- Every screen has at least default, loading, and error considered. Say "not needed" with a reason if you skip one.
- Every screen has at least one way in and one way out. A screen with no exit is a flaw. Flag it.
- Name screens by purpose (`Sign in`, `Reset password sent`), not by number.
- Keep it to what the brief asks. Do not add screens for features nobody asked for. List them under "Open questions" if they seem needed.
- Plans over 12 screens: split into flows and plan one at a time.

## Prototype notes

If the user wants a clickable prototype, add a section "Interactions": for each tap target, the trigger, the destination, and the transition (Smart Animate, Dissolve, Push). Use the names in `../figma-master/references/prototype.md`. Building the links is a later step.

## Stop line

End with: "Approve this plan, or tell me what to change." Do not continue until they answer.
