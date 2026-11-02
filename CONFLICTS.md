# Conflict rulings

When two sources disagree, this order wins. Higher beats lower.

1. The user's direct instruction in this conversation.
2. Safety and approval rules (ask before download, before credits, before bulk change; read-only means read-only).
3. Figma's Plugin API rules in `figma-use` (they stop silent failures).
4. figma-master process rules (inspect first, read back, dry run, approval ladder).
5. Project settings in `.claude/figma.md`.
6. figma-master defaults (durations, severities, recipes).

## Rulings

| # | Conflict | Ruling |
|---|---|---|
| 1 | `figma-generate-design` says use a library component. The file has no library. | Say so. Offer local variables and a few local components. Do not hardcode silently. |
| 2 | Figma's motion skill allows keyframes where figma-master blocks top level frames. | Block. Animate children. The docs say avoid it, and the script is stricter on purpose. |
| 3 | Figma's export gives looping motion code. The user wants one time entrances. | Use `motion-to-css.mjs` (plays once). Offer the loop with `--loop`. |
| 4 | Audit rules disagree with the user's design on purpose (small text in a legal footer). | Report it. Do not fix it. Let the user mark it accepted. Do not hide it from the score. |
| 5 | The user asks for a fix, and the audit is read-only. | The audit stays read-only. The fix is a new step with a preview and a yes. |
| 6 | The user says "just apply it" for a sync. | Still show the dry run in the reply, then apply in the same turn. The report must still list creates, updates, and skips. |
| 7 | Figma says a call succeeded, the read back says otherwise. | Trust the read back. Report the mismatch. |
| 8 | A hover trigger looks nice, but the target is touch. | Keep the hover as an extra only. Give touch users a click path. |
| 9 | Project settings say `calm` motion, the user asks for "snappier". | The user wins for this task. Do not edit the settings file unless asked. |
| 10 | Two skills could handle a task (`figma-design` and `figma-generate-design`). | Use figma-master's wrapper. It loads the official one. |
| 11 | A token name in code does not follow the dash to slash rule. | Do not invent a mapping table. Tell the user the name and let them rename it, or skip it. |
| 12 | A scan finding repeats 40 times. | Group it as one cause in the top fixes. Keep the true count in the score. |

## When this file is silent

Choose the more cautious option. Say what you chose and why in one line. If the choice cannot be undone, ask.
