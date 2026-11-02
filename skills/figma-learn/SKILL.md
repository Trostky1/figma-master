---
name: figma-learn
description: Use after a Figma call fails in a new way, or a result surprises you, to record it so it does not happen again. Writes the symptom, the fix, and where it was seen into the gotcha list only after the user agrees. Checks for duplicates and keeps the list numbered. Also use when the user asks to remember a Figma tip.
---

# figma-learn

The gotcha list is what makes figma-master better over time. Keep it short, true, and tested.

## When to use

- A `use_figma` call threw an error you had not seen before, and you found the cause.
- A call worked but the file was wrong (a silent failure).
- A tool behaved differently from its description.
- The user says "remember this" about a Figma behavior.

Do not record: one-off typos, mistakes in your own script that have no general lesson, or anything you have not confirmed with a second run or a read back.

## Process

1. **Confirm it.** Reproduce or read back. A guess is not a gotcha. If you cannot confirm, say so and do not record.
2. **Check the list.** Read `skills/figma-master/references/gotchas.md`. If an entry already covers it, say which one and stop.
3. **Draft one row.** Two parts:
   - **Problem:** what you saw, in one sentence, with the exact error text if there was one.
   - **Fix:** what to do instead, in one sentence.
   Write in plain words. No project names. No secrets, file keys, or user data.
4. **Ask.** Show the row. Say "Add this to the gotcha list?" Wait for a clear yes. Without a yes, stop.
5. **Add.**

   ```bash
   node skills/figma-learn/scripts/add-gotcha.mjs --problem "<problem>" --fix "<fix>"
   ```

   Use `--dry` first if unsure. The script numbers the row, escapes pipes, and refuses duplicates (exit code 3).
6. **Capabilities.** If the finding changes what works (a new tested action, a new limit), also offer a one-line change to `references/capabilities.md` with the date. Ask first.
7. **Report** the number and the row.

## Rules

- One finding, one row.
- Include the date in `capabilities.md` rows. Figma changes its beta tools.
- If a later test shows a gotcha is no longer true, tell the user and offer to remove the row. Do not delete without a yes.
- Never write to the list silently.

## Output

```
Gotcha #<n> added: <problem>
Fix: <fix>
```
