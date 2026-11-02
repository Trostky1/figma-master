---
name: figma-a11y
description: Use to check a Figma design for accessibility. Covers text contrast, text size, touch target size, interactive component states (hover, focus, disabled), auto advancing screens, and motion that needs a reduced motion version. Read-only. Says clearly what Figma cannot show, such as screen reader output and keyboard order.
---

# figma-a11y

Read-only. Reports against WCAG 2.2 AA. It cannot prove a design is accessible. It finds what a file can show, and lists what it cannot.

Load `figma-use` before any `use_figma` call.

## Process

1. **Scope.** Same as `figma-audit`: a node id, or `PAGE`.
2. **Session.** `create_session` once.
3. **Run both scripts** through `use_figma`:
   - `../figma-audit/scripts/scan.js` for contrast, text size, and target size.
   - `scripts/a11y-extra.js` for motion and state coverage.
   Only keep findings that belong to accessibility: `low-contrast`, `tiny-text`, `tiny-target`, `small-target`, and everything from `a11y-extra.js`. Drop style findings such as `hardcoded-fill`.
4. **Look.** Take one `get_screenshot`. Check by eye: is meaning carried by color alone? Are focus and error states visible? Is the reading order sensible top to bottom?
5. **Report.** Use the format below.

## What gets checked

| Check | WCAG | Rule |
|---|---|---|
| Text contrast | 1.4.3 | 4.5:1 normal, 3:1 large (24 px, or 18.66 px bold). |
| Text size | best practice | Under 12 px is flagged. |
| Target size | 2.5.8 (24 px minimum), best practice 44 px | Interactive nodes only. |
| Auto advancing screens | 2.2.1 | `AFTER_TIMEOUT` reactions. Need a way to pause or extend. |
| Moving transitions | 2.3.3 (AAA), good practice | Smart Animate, Push, Slide, Move. Ask for a reduced motion version. |
| Long transitions | good practice | Over 0.5 s. |
| State coverage | 2.4.7 and others | Interactive component sets need hover, focus, disabled. |

## What Figma cannot show (always list these)

- Keyboard order and focus paths.
- Screen reader names and roles.
- How the design looks to color blind users. Offer a render check as a next step.
- Whether color alone carries meaning. This needs a human look.
- Text over images or gradients. Check by eye.

## Report format

```
Accessibility: <name> (<node id>)  Target: WCAG 2.2 AA
Blockers <n>  Critical <n>  Warning <n>  Tip <n>

Fix first
1. <rule>: <node name> (<id>) - <detail>
...

Checked by eye
- <one line each>

Not observable
- <list above, only items that apply>
```

Do not give a pass or "accessible" verdict. Say "no issues found in what Figma can show" when clean.

## After the report

Offer to fix contrast and target size. Contrast fixes change color, so show the new color and its ratio first. Wait for a yes. Follow the approval ladder in `figma-master`.
