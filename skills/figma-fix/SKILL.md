---
name: figma-fix
description: Use to audit a Figma frame and fix what can be fixed safely in one command. Runs the audit scan (plus the format check that fits), groups findings, applies safe fixes (bind colors to variables, apply text styles, raise tiny text, enlarge small targets, rename default layers), asks before anything that changes the look, then re-scans and reports the score change.
---

# figma-fix

Audit plus fix in one command. `figma-audit` only reports. This skill reports, fixes the safe part, asks about the rest, and proves the result.

Load `figma-use` before any `use_figma` call. Pass `skillNames: "figma-use"`.

## Process

1. **Scope.** Node id from the URL (`node-id=1-2` means `1:2`). If none, list top frames and ask. One frame at a time for big files.
2. **Before.** Run `scan.js` from figma-audit. For a website set also run `site-check.js` from figma-site. For a deck also run `deck-check.js` from figma-deck. Record the score and the counts.
3. **Sort every finding** into one of three groups:

| Group | Examples | Action |
|---|---|---|
| **Auto** | `default-name`, `hardcoded-fill` where one variable matches within a few RGB units, `no-text-style` where one style matches size and weight, `tiny-text` and `text-small` below the profile minimum, `tiny-target` and `small-target` on text links | Fix now |
| **Ask** | `low-contrast` (needs a color choice), `no-auto-layout` (moves layers), `off-style-color`, `off-style-font`, `horizontal-overflow`, parity gaps, anything that changes layout or look more than a little | Show the proposed fix. Wait for a yes. |
| **Report only** | Missing sections or states, weak hierarchy, copy | Say so. Do not fix. |

4. **Build the fix list.** Find variables with `figma.variables.getLocalVariablesAsync()` and styles with `figma.getLocalTextStylesAsync()` in a read call. Match by value. If more than one matches or none does, move the finding to **Ask**.
5. **Apply Auto fixes.** Use `scripts/apply-safe-fixes.js` (replace `__SPEC__`). It tries each fix alone and reports failures. Show what changed.
6. **Ask about the rest.** Present the **Ask** group as a short numbered list with the exact change. Apply only the ones the user approves, with `use_figma`.
7. **After.** Re-run the same scans. Take one `get_screenshot`.
8. **Report** (format below).

## Fix rules

- Never change copy, content, or the kit's identity.
- Contrast fixes: keep the accent for shapes and large type. Move small text to the muted or ink role from the kit. Tell the user.
- Small targets: raise the hit area (line height on a text link, padding on a frame). Do not change the look more than needed.
- If a fix fails, leave the node alone and list it.
- Do not run on a whole file in one call. Do not delete layers.

## Report

```
Before: 62   After: 91
Fixed automatically: 14 (names 6, fills 5, text sizes 2, targets 1)
Fixed after your yes: 3
Left for you: 2 (contrast on the hero button, a missing error state)
Not observable: <from the profile>
```

Keep it short. Name the nodes that need a person.
