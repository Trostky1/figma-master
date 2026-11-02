---
name: figma-sync
description: Use to keep design tokens in step between code and Figma variables. Reads CSS custom properties or DTCG JSON, shows a dry run of what would change, then creates or updates Figma variables (with light and dark modes, aliases, and scopes) without deleting anything. Also exports a Figma collection back to CSS or DTCG JSON. Doubles as a drift check.
---

# figma-sync

Code is the source of truth by default. Figma gets a synced copy. Changes that start in Figma come back to code as a proposal the user approves, never as a silent overwrite.

Load `figma-use` before any `use_figma` call. Pass `skillNames: "figma-use"`. Variable writes work on any Figma plan (they use the Plugin API).

## Name rule

`--color-gray-900` in CSS is `color/gray/900` in Figma. Dashes become slashes, and back. Rules that follow:

- Keep names lowercase. Do not use a dash inside a segment you want to keep as one word (`--color-brand-primary` becomes three segments).
- Two CSS names that become the same Figma name are a collision. Stop and tell the user.
- No mapping table is needed. Same names on both sides is the whole system.

## Commands inside this skill

| Job | Steps |
|---|---|
| **Check drift** (read-only) | Read tokens, run `sync-tokens.js` with `apply: false`, show the report. |
| **Code to Figma** | Check drift, show it, get a yes, run with `apply: true`, check `mismatches` is empty. |
| **Figma to code** | Run `export-tokens.js`, then `tokens-to-css.mjs`. Show the diff against the code file. Apply only with a yes. |
| **Start from code with no tokens** | Say so. Offer to scan the code for repeated colors and sizes first. This skill does not guess a system. |

## Process: code to Figma

1. **Settings.** Read `.claude/figma.md` for the collection name and the tokens file path. Ask only if both are unknown.
2. **Read tokens.**

   ```bash
   node skills/figma-sync/scripts/tokens-to-spec.mjs <tokens.css|tokens.json> --collection Tokens --chunk 50
   ```

   It prints `{ parts, skipped }`. Show the `skipped` list to the user (shadows, easing curves, and component scoped properties are not converted). Say how many tokens and which modes it found.
3. **Dry run.** For each part, run `scripts/sync-tokens.js` through `use_figma` with `apply: false` and `partial: true` (when there is more than one part). Replace `__SPEC__` with the part. Combine the reports:
   - to create, to update (with old and new values), unchanged
   - type conflicts (Figma has a different type: left alone, tell the user)
   - alias targets that do not exist
   - `figmaOnly`: variables in Figma that are not in code (only for a single, full spec)
4. **Show and wait.** Report in plain lines. Wait for a yes.
5. **Apply.** Same script with `apply: true`, parts in order (aliases come last). Check each result: `mismatches` must be empty and `variableCount` sensible.
6. **Report.** Created, updated, unchanged, skipped, conflicts, figmaOnly.

The code limit for one `use_figma` call is 50,000 characters. That is why the spec comes in parts. About 50 tokens per part is safe.

## Process: Figma to code

1. Run `scripts/export-tokens.js` (replace `__COLLECTION__`). Save the JSON in a scratch folder.
2. Make CSS: `node skills/figma-sync/scripts/tokens-to-css.mjs <export.json>`. First mode goes in `:root`. A mode named Dark goes in `[data-theme="dark"]` (change with `--dark-selector`). Add `--dtcg` for DTCG JSON.
3. Compare with the project's token file. Show only the differences. Ask before writing.
4. Never overwrite a token file whole. Edit the lines that differ.

## What is converted

| Code | Figma type | Notes |
|---|---|---|
| `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `hsl()` | COLOR | |
| `16px`, `1rem` (as 16 px each), unitless numbers | FLOAT | `em` and `%` are skipped |
| `font-family` values | STRING | |
| `var(--other)` | Alias | Target must exist |
| Dark blocks (`[data-theme="dark"]`, `.dark`, `prefers-color-scheme: dark`) | Dark mode | Tokens with no dark value copy the light one |

Not converted: shadows, gradients, `cubic-bezier`, `calc()`, component scoped properties. They are listed in `skipped`. Say so. Do not drop them silently.

## Scopes

The script sets scopes from the name: `bg`, `surface` for backgrounds, `text`, `fg` for text, `border` for strokes, `space`, `gap` for gaps, `radius`, `font/size`, `weight`, `family`. Anything else gets `ALL_SCOPES`. Tell the user the rule. They can fix odd cases by hand.

## Safety

- Dry run first, always.
- The script never deletes variables and never changes a variable's type.
- It reads every value back after it writes. Report any `mismatches`.
- Variables in other collections are not touched.
- Modes: the first mode of a new collection is renamed to the first mode in the spec.
- Run on a copy of the file if the user has not used this before.

## Not observable

- Tokens published from a team library (the export skips aliases to library variables and lists them).
- Which design layers use a token. Use `figma-audit` for hardcoded values.

## Output

```
Sync: <tokens file> -> <Figma collection>
Created <n>  Updated <n>  Unchanged <n>  Skipped <n>  Conflicts <n>
Figma only (not in code): <names or "not checked">
Mismatches after write: <none or list>
```
