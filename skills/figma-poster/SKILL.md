---
name: figma-poster
description: Use to design a print poster in Figma Design in a chosen style kit. Sets size, bleed, and safe margins, builds one clear focal point with three levels of hierarchy, checks type size for viewing distance and contrast, and exports a PDF or PNG. Warns about the limits of RGB to CMYK.
---

# figma-poster

Status: written, not tested in Figma.

Load `figma-use` and `figma-generate-design`. Profile: `profiles/poster.json`.

## Process

1. **Ask first.** Final size, where it prints, bleed rule, viewing distance, and the one action or fact the poster must deliver.
2. **Style kit (required).** Run the style step of `figma-new` if there is none.
3. **Frame.** Design at 96 px per inch. Add bleed (0.125 in = 12 px) as a larger frame behind the trim frame, or extend backgrounds past the trim. Draw a safe margin guide (0.5 in = 48 px). Keep text inside it.
4. **Hierarchy.** One focal point. Three levels: title, support, detail. If everything is big, nothing is.
5. **Type.** Body 12 pt or more at arm length. Headline readable from 2 m (72 pt or more). Two families at most. Use the kit.
6. **Layout.** Pick a grid and align to it. Leave empty space on purpose. Use the signature motif of the kit once, large.
7. **Check.** Run `figma-audit` for contrast and naming. Check by eye: squint test (is the focal point clear?) and a small print copy.
8. **Export.** PNG at scale for 300 dpi at final size, or PDF. Say that Figma is RGB. Bright oranges and greens shift in CMYK. Ask the print shop for a proof.
9. **Report.** Size, bleed, margins, hierarchy, what the print shop must check.

## Rules

- Contrast 4.5 for small text, 3 for large.
- No text on busy photos without a scrim.
- Put a date, place, or link where people look last, but make it large enough to read.

Not observable: CMYK shift, paper stock, trim accuracy, view from a distance.
