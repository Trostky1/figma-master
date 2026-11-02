---
name: figma-rip
description: Use to read the styles of something that already exists (a live site, a screenshot, a Mobbin result, a Framer site, or a Figma file) into a style kit - colors with roles, type, spacing, shapes, motion, and component patterns - that can be reviewed and reused in new designs. Asks before every read, records where each style came from, and copies values, never text, images, or logos.
---

# figma-rip

Turns "make it look like that" into a style kit you can check. The kit feeds `figma-deck`, `figma-design`, and `figma-sync`.

## Gate (every time)

1. **Ask first.** Say the exact URL or file and what will be read ("computed colors, fonts, sizes, spacing from the page"). Wait for a yes. The yes covers that source on that day.
2. **Own and open sources.** The user's own site, their own Figma files, and sources with an open license need only the one confirmation. Everything else needs the user to say they may read it, and to say why.
3. **Never get around** a login, a CAPTCHA, a bot check, or a robots rule. Stop and say so. A logged in read needs the user's own session and an explicit yes.
4. **Take the system, not the artifact.** Copy values: colors, type sizes, spacing, radius, shadows, timing. Never copy text, images, illustrations, logos, icons, font files, or code. Tell the user the kit is for new work with their own content and brand.
5. **Warn on near copies.** If the user wants a 1:1 copy of one distinctive page, say that layout, copy, images, and brand marks are protected, and suggest using the system with a different composition. This is not legal advice.

## Pick the method

| Input | Method | How exact |
|---|---|---|
| Live public page (including a Framer site) | **Page read.** Run `scripts/rip-dom.js` in the page. | High for colors, type, spacing, radius, motion. Medium for components. |
| Screenshot or Mobbin image | **Image read.** `scripts/rip-image.mjs` for colors. Look at the picture for fonts, sizes, shapes. | Colors good. Fonts, sizes, and shapes are chosen by looking and marked "manual". |
| Figma file or link | Read it: `get_design_context`, `get_variable_defs`, `get_screenshot`, and `figma-audit`'s read of bound values. | Exact |
| Wide crawl of many pages | Optional: `npx dembrandt <url>` (downloads a browser, ask first). | Broad, but noisy type. |

### Page read

1. Open the page in the built-in browser (or Playwright, or Chrome).
2. Run `scripts/rip-dom.js` with the browser's JavaScript tool. It returns one JSON string. It changes nothing on the page.
3. Save the JSON. For dark mode, read again with the page in dark mode.
4. Resize the browser to a phone width (375) and read again if the user wants the mobile style.

### Image read

1. Get the image. For Mobbin: `search_screens`, `search_flows`, or `search_sections` with `output_destination: design_tool`. **Cite each result with its `mobbin_url`. Show any `ai_usage_notice` text word for word.** Download from `image_url` (it expires in 30 days). Mobbin previews carry a bar at the bottom: use `--trim-bottom 0.09`.
2. `node skills/figma-rip/scripts/rip-image.mjs <image> <out.json> --trim-bottom 0.09 --source "<where it came from>"`
3. Look at the picture. Choose the display and body fonts by eye from fonts that exist in Figma (`listAvailableFontsAsync`). Pass them as `--fonts "display=Newsreader:300:64;body=Inter:400:18"` in the next step. Say that these were chosen by looking.
4. A picture cannot show spacing, radius, shadow, or motion. Say what was left out.

### Make the kit

```bash
node skills/figma-rip/scripts/rip-to-style.mjs <rip.json> <styleDir> --name <style-name> [--fonts "..."]
```

Put the folder in `.claude/figma-styles/<name>/` (this project) or `~/.figma-master/styles/<name>/` (all projects). It holds:

| File | What |
|---|---|
| `tokens.json` | DTCG tokens. `figma-sync` reads it. |
| `tokens.css` | Same as CSS variables |
| `DESIGN.md` | Roles with evidence, type table, space, radius, shadows, motion, component patterns, what was not read |
| `components.json` | Buttons and cards seen, with sizes and fills |
| `evidence.json` | The guesses and the data behind them |
| `provenance.md` | Source, date, method, permission, terms, what was copied and not copied |

## Review (do not skip)

1. Show the color table and the type table. Ask the user to fix wrong roles.
2. Check every font exists in Figma. If not, name a stand in and say it is a stand in.
3. Fill the permission and terms lines of `provenance.md`.
4. Status stays "needs human review" until the user says it is fine.

## What was measured

Tested on 2026-11-02 against a site whose own CSS variables were readable (ground truth):

| Check | Result |
|---|---|
| Page, ink, and accent colors from the page read | Matched the site's own variables, with their names |
| Display font | Found correctly (the heading font, not the body font) |
| Same site through `dembrandt` | Colors matched. It reported the body font for the display heading, and produced 124 type styles (noisy). It added breakpoints and motion contexts. |
| Palette from a JPEG screenshot | Page and ink colors exact. Small accents need a low share threshold. |
| A Mobbin image (1920 wide) | Page, panel, ink, grays, and the orange accent all found. Fonts not available. |

## Not in scope here

Components rebuilt as Figma components (that is `figma-generate-library` using a kit), screenshot to layers (use `figma-design` with the kit and the picture as reference), and any copying of content.
