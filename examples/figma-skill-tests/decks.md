# Decks: one story, two styles

Made with `/figma-rip` and `/figma-deck` in a private Figma Slides file. Same content, two style kits.

| | Deck A (8 slides) | Deck B (3 slides) |
|---|---|---|
| Style source | A live public page, read with `rip-dom.js` (the site's own CSS variables were readable, so the result could be checked) | One reference image, read with `rip-image.mjs`. Fonts chosen by looking. |
| Look | Paper white, near black ink, thin condensed display type, mono labels, hairlines, key caps, a gold glow dot | Warm off white, light serif headline, peach panels, an orange accent, pill buttons |
| Fonts | Three families | Two families |
| Checked against its own kit | 100 average, 1 note (large decorative numeral bleeds off the slide on purpose) | 100 average |
| Deck A checked against kit B | 46 average, 7 colors and 28 text layers flagged | Shows the style check catches drift to the wrong look |

## What the tests showed

- The page read matched the site's own variable names for page, ink, and accent colors, and found the display font. Another extractor (dembrandt) matched the colors but reported the body font for the display heading and produced 124 type styles.
- The image read found the page color, the panel, the ink, and the orange accent from a 1920 wide image. It cannot see fonts, spacing, or radius.
- Real findings from the deck check on the first draft: a decorative numeral at 1.7 to 1 contrast (a Blocker), and one slide with 63 words. Both were fixed.
- The reference's own orange button with white text is about 3.5 to 1. The deck uses ink text on the orange instead and says so.

No text, images, or logos from the references are in these decks. Provenance for each kit is written in its style folder.
