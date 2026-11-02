# Theme from a style kit (tested code pattern)

Run once per style, before the first slide. Adjust the palette and the type roles from the kit. Sizes come from the profile.

```js
const hex = (h) => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
for (const [family, style] of FONT_PAIRS) await figma.loadFontAsync({ family, style });   // every family and weight you will use

// 1) colors: overwrite the 8 theme variables, then add more
const col = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === "local slide colors");
const modeId = col.modes[0].modeId;
const vars = (await figma.variables.getLocalVariablesAsync()).filter((v) => v.variableCollectionId === col.id);
vars.sort((a, b) => parseInt(a.name.replace(/\D/g, "")) - parseInt(b.name.replace(/\D/g, "")));
PALETTE.forEach(([name, h], i) => { vars[i].name = name; vars[i].setValueForMode(modeId, { ...hex(h), a: 1 }); });   // up to 8
for (const [name, h] of EXTRA) { const v = figma.variables.createVariable(name, col, "COLOR"); v.scopes = ["ALL_SCOPES"]; v.setValueForMode(modeId, { ...hex(h), a: 1 }); }

// 2) text styles: family, weight, line height, tracking from the kit. Sizes from the profile.
const S = Object.fromEntries((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
const set = (s, family, style, size, lh, ls) => { s.fontName = { family, style }; s.fontSize = size; s.lineHeight = lh; if (ls) s.letterSpacing = ls; };
set(S["Title"], DISPLAY.family, DISPLAY.style, 144, { unit: "PERCENT", value: 92 });
set(S["Header"], ...);   // and Subheader, Body, Caption
const label = figma.createTextStyle(); label.name = "Label"; set(label, MONO.family, "Medium", 20, { unit: "PERCENT", value: 120 }, { unit: "PERCENT", value: 14 }); label.textCase = "UPPER";
```

## Building with the theme

- Bind fills to variables: `figma.variables.setBoundVariableForPaint({ type: "SOLID", color: { r: 0, g: 0, b: 0 } }, "color", variable)`.
- Apply styles with `await text.setTextStyleIdAsync(style.id)` BEFORE setting `characters`. The style's font must be loaded.
- A display size larger than the style (for a hero word) is a per node override: `text.fontSize = 400`.
- Append the node to its parent first. Then set size, fill, `x`, and `y`.
- Sections: `figma.createSlideRow()`, then `figma.createSlide(rowIndex, 0)`. Name rows with `grid.children[i].name`.

## Motif helpers worth writing once per deck

- A key cap: auto layout frame, 8 to 10 px radius, hairline stroke, two small drop shadows.
- A glow dot: ellipse with a drop shadow of its own color.
- A marker bar: a 10 px wide colored rectangle beside a line of text.

Keep each motif bold enough to see from the back of a room.
