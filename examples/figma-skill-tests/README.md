# figma skill tests: the showcase

A mock app (Figma file, private) used to run every figma-master skill on real data. The Figma file is not published. These are the files the skills wrote.

| File | Made by | What it is |
|---|---|---|
| `tokens.css` | the author | 37 design tokens, Light and Dark. `figma-sync` turned it into Figma variables. |
| `home.motion.json` | `figma-motion` (`read-motion.js`) | Keyframes read from the Home screen (5 of 12 layers, as a sample). |
| `home.motion.css` | `figma-motion` (`motion-to-css.mjs`) | The same motion as plain CSS. Plays once. Reduced motion included. |
| `handoff-home.md` | `figma-handoff` | Developer document for the Home screen. |
| `audit-report.md` | `figma-audit`, `figma-a11y` | Scores before and after fixes, top fixes, accessibility notes. |

## What the Figma file holds

| Page | Skill | Content |
|---|---|---|
| Cover | `figma-doctor` | What ran where, and how to try the prototype |
| Tokens | `figma-sync` | Light and Dark swatches, type styles, scales, sync report |
| Components | `figma-design`, `figma-prototype` | Button (10 variants), Pill, Skill Card. Interactive variants. |
| Flow | `figma-flow` | Plan table and flow map |
| Screens | `figma-design`, `figma-prototype`, `figma-animate` | 7 screens, 34 links, page load motion |
| Motion lab | `figma-animate` | Eight recipes on one timeline |
| Audit | `figma-audit`, `figma-a11y` | Before and after scores |
| Handoff | `figma-handoff` | Short version of the Home handoff, plus the generated CSS |

## What this run found

- Every prototype action in the Plugin API that figma-master supports now has a real test, including swap, change to, scroll to, and key presses.
- Four gaps in figma-master itself were found and fixed in the scripts: a link to its own screen, targets that are variants or inside scrolling frames, path trim on an inside stroke, and partial write failures that were not reported.
- The first audit scored the author's own first draft between 0 and 88. One token change and a few 44 px minimums brought every screen to 96 or 100.

How it feels when played was not checked. Press Present in Figma and click through.
