# Home
Figma: figma skill tests (private file), page Screens, node 7:6    Size: 1200 x 1280    Date: 2026-11-02

Made by `/figma-handoff`. The reader script returned 61 nodes. Nothing was truncated.

## Summary
The landing screen of a mock app. A visitor reads the hero, sees a before and after sample, and picks one of six skill cards. Each card opens a detail screen.

## Layout
Top to bottom, all auto layout, width 1200, no absolute positions except the compare mock.

| Block | Direction | Gap | Notes |
|---|---|---|---|
| Nav (92 px) | Horizontal, space between | | Logo left. Links and Menu button right. Links are 44 px tall targets. |
| Nav Rule | | | 1 px line, `color/border/line` |
| Hero (504 px) | Horizontal | `space/16` (64) | Copy column 528 wide, compare mock 480 wide |
| Skills Section (616 px) | Vertical | `space/8` (32) | Fill `color/bg/deep`. Two rows of three cards, `space/6` apart |
| Footer (108 px) | Horizontal, space between | | Note left, GitHub link right |

Hero compare is absolute positioned on purpose (a decorative before and after mock). The audit flags it. It is accepted.

## Tokens used
| Token | Used for | Count |
|---|---|---|
| `space/6` | padding, gaps | 36 |
| `space/2`, `space/3`, `space/4` | gaps, padding | 16, 15, 15 |
| `space/16` | page padding, hero gap | 12 |
| `color/border/line` | strokes, rules | 14 |
| `color/bg/raised` | cards, compare card | 9 |
| `color/text/muted` | secondary text | 8 |
| `color/text/strong` | headings, labels | 7 |
| `radius/lg` | cards | 7 |
| `color/bg/deep` | skills section, chips | 5 |
| `radius/sm` | buttons, chips | 5 |
| `color/bg/page` | screen background | 1 |
| `color/accent/gold`, `color/accent/gold/deep`, `color/on/gold` | tag, kicker, slider | 3, 1, 1 |
| `color/accent/patina` | active dot, progress | 2 |

All 25 are in `tokens.css` in this folder. Zero raw hex values on this screen.

## Typography
| Text style | Font | Size | Where |
|---|---|---|---|
| `display/hero` | Alumni Sans ExtraLight | 72 | Hero title |
| `heading/h2` | Alumni Sans Light | 40 | Section title |
| `heading/h3` | Albert Sans SemiBold | 18 | Card titles, compare title |
| `body/md` | Albert Sans Regular | 15 | Hero lead |
| `body/sm` | Albert Sans Regular | 13 | Card text, nav, footer |
| `label/mono` | JetBrains Mono Medium | 12 | Kickers, labels (8 uses) |
| `code/mono` | JetBrains Mono Regular | 13 | Command chips |

Every text layer has a style. Label size was 11 and was raised to 12 after the first audit (token `font/size/xs`).

## Components
| Component | Variant | Count |
|---|---|---|
| Button | Primary or Secondary, State Default | 3 |
| Pill | Selected true or false | 3 |
| Skill Card | one variant, four text properties | 6 |

## Content (exact copy)
- Kicker: `FIGMA-MASTER  /  TEST BENCH`
- Title: `Every skill, shown in one place.`
- Lead: `A small mock app that runs every figma-master command on a real Figma file: flows, screens, prototype links, motion, tokens, audits, and handoff.`
- Buttons: `Run the tour`, `How it works`
- Pills: `/figma-design`, `/figma-prototype`, `/figma-animate`
- Section: `THE SKILLS`, `Ten commands. Six shown here.`
- Cards: figma-flow, figma-design, figma-prototype, figma-motion, figma-sync, figma-handoff (text in the Figma file)
- Footer: `figma skill tests  /  a mock app for figma-master  /  not published`, `GitHub`

## Interactions
| Layer | Trigger | Action | Transition |
|---|---|---|---|
| Home | Key K | Open Palette (overlay) | Dissolve 0.15 s |
| Nav Commands | Click | Go to Commands | Push left 0.35 s |
| Nav Settings | Click | Go to Settings | Dissolve 0.2 s |
| Nav Menu | Click | Open Palette (overlay) | Move in from top 0.25 s |
| Tour button | Click | Set `state/toured` true, then if true go to Skill detail | Smart Animate 0.4 s |
| Card design | Click | Go to Skill detail | Smart Animate 0.4 s |
| Footer GitHub | Click | Open URL | |
| Buttons and pills | Hover, press, click | Change to another variant (interactive component) | Smart Animate 0.15 s |

The branch inside Tour button is listed as CONDITIONAL only. Read `node.reactions` on that layer for the full detail.

## Motion
Page load, plays once, intensity calm, 12 layers. Timeline is 2 s. Ready to use CSS is in `home.motion.css` (5 of the 12 layers, as a sample). Includes a reduced motion block.

| Layers | Recipe | Starts | Stagger |
|---|---|---|---|
| Hero Copy children (5) | rise-in | 0 s | 0.08 s |
| Hero Compare | pop-in | 0.3 s | |
| Cards Row 1 (3) | rise-in | 0.7 s | 0.1 s |
| Cards Row 2 (3) | rise-in | 1.0 s | 0.1 s |

## Assets
No images. No vector layers on this screen. Icons are not used.

## States
Drawn: default for every element. Hover, pressed, focus, and disabled for Button. Selected and not selected for Pill.
Missing: Pill has no hover, focus, or disabled. Skill Card has no hover. No loading, empty, or error state for the card grid.

## Not in Figma (needs a decision)
- How the layout behaves below 1200 px wide. Figma shows one size.
- What the real card copy length limit is.
- What the K shortcut does while a text field has focus.
- Screen reader names and tab order.

## Open issues
1. `Hero Compare` uses absolute positions (accepted, decorative).
2. Pill has no focus state.
3. Splash screen advances by itself after 1.5 s (lives on the Splash screen, not Home).
