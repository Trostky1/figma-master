# Breakpoint modes (tested 2026-11-02)

Goal: one set of text styles and spacing that changes size per frame.

## Steps

1. Create a variable collection named `Breakpoint`. Add modes `Desktop`, `Tablet`, `Mobile`.
2. Add FLOAT variables, one value per mode. Example used in the test file:

| Variable | Desktop | Tablet | Mobile |
|---|---|---|---|
| font/size/display | 84 | 60 | 40 |
| font/size/headline | 56 | 42 | 32 |
| font/size/title | 24 | 22 | 20 |
| font/size/body | 18 | 17 | 16 |
| font/size/small | 14 | 14 | 13 |
| font/size/label | 13 | 13 | 12 |
| layout/section | 120 | 88 | 64 |
| layout/margin | 80 | 40 | 20 |
| layout/gutter | 32 | 24 | 16 |
| layout/stack | 24 | 20 | 16 |

3. Create text styles. Bind `fontSize` to the variables with `style.setBoundVariable("fontSize", variable)`.
4. Bind padding and gap on frames to the layout variables with `node.setBoundVariable("paddingLeft", variable)`.
5. On each page frame call `frame.setExplicitVariableModeForCollection(collection, modeId)`.

## Notes

- Set scopes on each variable (`FONT_SIZE`, `GAP`, `WIDTH_HEIGHT`).
- Load fonts before you set a variable mode on frames that hold text.
- Check with `site-check.js`: a frame with no explicit mode gets a `breakpoint-mode` warning.
