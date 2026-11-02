---
name: figma-new
description: Use at the start of any new design in Figma to ask what is being made (presentation, website, mobile app, mobile website, poster), load that format's profile, and make sure a style is chosen before anything is drawn. Routes to the right build skill. Use when the user says make, create, or design something and the format or style is not settled.
---

# figma-new

Two questions come first: **what is it**, and **what should it look like**. Nothing is drawn until both have an answer.

## Step 1: Format

Ask which one. Offer these:

| Format | Profile | Build skill | Status |
|---|---|---|---|
| Presentation (Figma Slides) | `profiles/presentation.json` | `figma-deck` | Built |
| Website (desktop, responsive) | none yet | `figma-design` plus `figma-prototype` | Planned. Say so. |
| Mobile app | none yet | `figma-design` plus `figma-prototype` | Planned. Say so. |
| Mobile website | none yet | `figma-design` plus `figma-prototype` | Planned. Say so. |
| Poster | none yet | `figma-design` | Planned. Say so. Figma cannot export CMYK, bleed, or crop marks. |

If the format has no profile, say that plainly. Offer to go ahead with the general `figma-design` skill and state the numbers you will use (sizes, targets) and why. Do not pretend a profile exists.

## Step 2: Style first

Claude's own default look (the usual type pairing, rounded cards, gradient) is not a style. **Never start a design without a style source.** Ask:

1. **A style kit already saved?** Look in `.claude/figma-styles/` and `~/.figma-master/styles/`. List the names.
2. **A reference?** A live link, a screenshot, a Mobbin result, a Figma file or link, or a brand guide. Then run `figma-rip`.
3. **Their own brand?** Read it (a Figma library, tokens file, or brand notes) with `figma-sync` or `figma-rip`.
4. **No reference at all.** Offer: find references together (Mobbin search, a few links), or build a style from the brief. If they choose the brief, write it as a style kit first (colors with roles, type pairing with a reason, shapes, motion), show it, and get a yes. The kit is the record of the choice.

A style kit is a folder with `tokens.json`, `DESIGN.md`, `components.json`, and `provenance.md`. Format: see `figma-rip`.

## Step 3: Settings

Read `.claude/figma.md`. Fill gaps: Figma file URL, library, font notes. Ask at most 2 questions.

## Step 4: Hand off

Tell the user in three lines: the format, the profile and its key numbers, and the style kit name. Then run the build skill. Do not restate the whole plan.

## Rules

- Style source and format are both required. If the user says "just make it", ask for one reference. A single screenshot is enough.
- A profile's minimum text sizes and contrast limits win over a style kit.
- Be honest about what is not built yet.
