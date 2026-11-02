# Website: one page, three widths

Made with `/figma-site` in a private Figma Design file. One home page, a style kit read from a reference image (warm grey page, near black ink, orange accent, Geist stand in for a display face not in Figma).

| | Desktop 1440 | Tablet 768 | Mobile 390 |
|---|---|---|---|
| Display type | 84 | 60 | 40 |
| Section spacing | 120 | 88 | 64 |
| Page margin | 80 | 40 | 20 |
| Cards | row | row | stack |

Type and spacing change through a `Breakpoint` variable collection. Each frame sets its own mode.

## What the check found (first run)

- 10 labels per frame at 2.4 to 1 contrast (orange on cream, 13 px). Blocker. Fixed: small labels use the muted ink. The accent stays on shapes.
- Footer link 20 px high. Blocker. Fixed with line height.
- Nav links and chips under 44 on touch frames. Warning. Fixed.
- Card labels at 2.85 to 1. Fixed the same way (also in the library component).

Second run: contrast clean (lowest 5.6 to 1), touch targets clean.

Left as is: 5 font families counted (two are from the old file's samples), content differs only in desktop only section names (Tip).

Not observable: real content, page speed, keyboard order, in between widths.
