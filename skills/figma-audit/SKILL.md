---
name: figma-audit
description: Use to audit a Figma frame, page, or file for design quality without changing it. Finds hardcoded colors, missing text styles, tiny or low contrast text, small touch targets, missing auto layout, and default layer names. Scores 0 to 100 by severity and lists fixes. Read-only. Use before handoff, after a build, or when asked to review a Figma design.
---

# figma-audit

Read-only. This skill never edits the file. It reports. Fixing is a separate step the user must approve.

Load `figma-use` before any `use_figma` call (read-only calls too, for the API rules).

## Process

1. **Scope.** Get the node id from the user's URL (`node-id=1-2` means `1:2`). If they gave a file with no node, list top-level frames and ask which one. Do not scan a whole large file in one call.
2. **Session.** `create_session` once. Reuse the id.
3. **Scan.** Run `scripts/scan.js` through `use_figma`. Replace `__ROOT_ID__` with the node id. Keep the script as is.
4. **Look.** Take one `get_screenshot` of the root. Check what the numbers cannot show: hierarchy, spacing rhythm, alignment, visual weight.
5. **Report.** Use the format below.
6. **Stop.** Offer fixes. Wait for a yes. Do not edit.

## Rules the scan checks

| Rule id | Severity | Meaning |
|---|---|---|
| `low-contrast` | Blocker under 3:1, Critical otherwise | Text against its nearest solid backdrop. Needs 4.5:1, or 3:1 for large text. |
| `tiny-target` | Blocker | Interactive node under 24 by 24. |
| `tiny-text` | Critical | Font size under 12. |
| `small-target` | Warning | Interactive node under 44 by 44. |
| `hardcoded-fill` | Warning | Solid fill not bound to a variable or style. |
| `no-text-style` | Warning | Text without a text style. |
| `no-auto-layout` | Warning | Frame with 2 or more children and no auto layout. |
| `hardcoded-stroke` | Tip | Stroke not bound. |
| `unbound-gap` | Tip | Auto layout gap not bound to a variable. |
| `default-name` | Tip | Layer still named Frame 12, Rectangle 3, and so on. |

Score: start at 100. Subtract 12 per Blocker, 8 per Critical, 4 per Warning, 1 per Tip. Do not go below 0.

Edge cases to state in the report, not hide:
- Many repeated findings on one rule (for example 40 text nodes with no style) are one root cause. Group them. Count them once for the "top fixes" list, but keep the real score.
- A file with no variables at all will show `hardcoded-fill` everywhere. Say so. It is a missing system, not 40 mistakes.
- Text over an image or gradient has no solid backdrop. The scan counts it under `notObservable`. Tell the user to check it by eye.

## Not observable

Say these out loud when relevant. Never guess:
- Text over images, gradients, or video.
- Fonts that failed to load.
- Hidden layers (the scan skips them).
- Component internals of library instances you cannot read.
- Real keyboard order and screen reader output.

## Report format

```
Audit: <root name> (<node id>)
Score: <n>/100   Blockers <n>  Critical <n>  Warning <n>  Tip <n>
Scanned: <nodes> nodes, <text nodes> text nodes

Top fixes
1. <rule> x<count>: <what to do>  (ids: ...)
2. ...

Not observable
- ...

Full list: <rule, node name, id, detail> grouped by severity
```

Keep "Top fixes" to 5 lines. Put the full list after it.

## Optional: report page in Figma

Only if the user asks. Needs a write. Ask first. Create a new page named `Audit <date>` and put the report on it as text. Never change the audited frames.

## Next step offer

End with one line: "Want me to fix the top item?" Then wait. When fixing, follow the approval ladder in the `figma-master` skill: preview the change, get approval, change, read back, verify with one screenshot.
