---
name: figma-prototype
description: Use to make a Figma design clickable - links between screens, overlays, Smart Animate transitions, back and close, variables and if/else logic, and flow starting points. Builds from an approved interaction map using a name based, all or nothing script, then checks the flow for broken links, unreachable screens, and dead ends. Use after screens exist.
---

# figma-prototype

Screens must already exist. If they do not, use `figma-flow` then `figma-design` first.

Load `figma-use` before any `use_figma` call. Pass `skillNames: "figma-use"`.

## Process

1. **Read** `.claude/figma.md` for the motion style and defaults.
2. **Inspect** (read-only). List top level screens and their tap targets. Names must be unique and clear. If they are not (`Frame 12`, two screens named `Card`), say so. Offer to rename them first with approval.
3. **Interaction map.** Write this table and wait for a yes:

   | # | From (Screen/Layer) | Trigger | Action | To | Transition |
   |---|---|---|---|---|---|

   Mark touch or desktop. Use the defaults below.
4. **Apply.** Run `scripts/apply-reactions.js` with the spec. It changes nothing if any name is missing or ambiguous.
5. **Check.** Run `scripts/check-flow.js`. Fix findings you caused.
6. **Look.** Take one `get_screenshot` of a key screen. Reactions do not show in screenshots. Be honest about that.
7. **Hand over.** Tell the user to press Present in Figma and click through. Give the file URL. List the paths to try, in order. Say what was verified (links written and read back, graph checked) and what was not (how it feels when played).

## Spec shape (for apply-reactions.js)

```json
{
  "mode": "replace",
  "startingPoints": [{ "screen": "Home", "name": "Main flow" }],
  "links": [
    { "from": "Home/Open button",
      "trigger": { "type": "ON_CLICK" },
      "actions": [{ "type": "NODE", "to": "Detail",
        "transition": { "type": "SMART_ANIMATE", "easing": { "type": "GENTLE" }, "duration": 0.4 } }] },
    { "from": "Home/Menu button", "trigger": { "type": "ON_CLICK" },
      "actions": [{ "type": "NODE", "to": "Menu", "navigation": "OVERLAY",
        "transition": { "type": "MOVE_IN", "direction": "LEFT", "matchLayers": false, "easing": { "type": "EASE_OUT" }, "duration": 0.3 } }] },
    { "from": "Detail/Back button", "trigger": { "type": "ON_CLICK" }, "actions": [{ "type": "BACK" }] },
    { "from": "Menu/Close button", "trigger": { "type": "ON_CLICK" }, "actions": [{ "type": "CLOSE" }] }
  ]
}
```

- `from` is `Screen name/Layer name`. The layer name must match exactly one layer in that screen.
- `to` is a screen name. It must match exactly one top level frame.
- `mode: "replace"` (default) replaces all reactions on each listed layer. `"append"` keeps the old ones. Tell the user which one you used.
- Logic actions:
  - `{ "type": "SET_VARIABLE", "variable": "state/open", "value": true }` (BOOLEAN, FLOAT, STRING only)
  - `{ "type": "SET_VARIABLE_MODE", "collection": "Theme", "mode": "Dark" }`
  - `{ "type": "CONDITIONAL", "blocks": [{ "ifVariable": "state/open", "actions": [ ... ] }] }` (BOOLEAN variable only)
- Replace `__SPEC__` in the script with the JSON. Keep the rest unchanged.

## Defaults

| Situation | Trigger | Navigation | Transition | Duration |
|---|---|---|---|---|
| Go deeper (list to detail) | `ON_CLICK` | `NAVIGATE` | `SMART_ANIMATE` if a layer is shared, else `PUSH` left | 0.3 to 0.4 s |
| Open a menu, sheet, or dialog | `ON_CLICK` | `OVERLAY` | `MOVE_IN` from the edge it belongs to, or `DISSOLVE` | 0.25 to 0.3 s |
| Close it | `ON_CLICK` | `CLOSE` | none | |
| Go back | `ON_CLICK` | `BACK` | none (reverses the last move) | |
| Switch tabs | `ON_CLICK` | `NAVIGATE` | `DISSOLVE` | 0.15 to 0.2 s |
| Success after action | `ON_CLICK` | `NAVIGATE` | `DISSOLVE` | 0.3 s |
| Open a web page | `ON_CLICK` | `URL` | | |

Easing: `EASE_OUT` for things that arrive. `EASE_IN_AND_OUT` for things that move across the screen. `GENTLE` for Smart Animate. Never `EASE_IN_OUT`.

## Rules

- **Touch first.** Do not hide the only path behind `ON_HOVER` or `MOUSE_ENTER`. Hover is fine as an extra for desktop.
- **Every screen needs a way out.** A link, Back, or Close.
- **Overlays need Close.** Give the overlay a close target, and make it at least 44 by 44.
- **Smart Animate matches layers by name.** Name the same layer the same in both screens. Change only position, size, opacity, or color. If no names match, the move becomes a dissolve. The checker warns.
- **Auto advance (`AFTER_TIMEOUT`).** Use only for splash screens or loaders. Flag it in the accessibility notes.
- **One starting point per flow.** Set it with `startingPoints`.
- **Moving transitions need a calm option.** If the project wants reduced motion, build a second set of links that use `DISSOLVE`.
- **Keep logic small.** Use a boolean for toggles and a conditional for gates. If the logic needs numbers and expressions, say it is beyond what this script does.

## Tested and not tested

Tested on 2026-11-02 (real file, 34 links on 7 screens plus 6 component variants): `NODE` with `NAVIGATE`, `OVERLAY`, `SWAP`, `SCROLL_TO`, and `CHANGE_TO`; `SMART_ANIMATE`, `MOVE_IN`, `PUSH`, `DISSOLVE`, `SCROLL_ANIMATE`; triggers `ON_CLICK`, `ON_HOVER`, `ON_PRESS`, `AFTER_TIMEOUT`, and `ON_KEY_DOWN` (written, read back, and flow checked); `BACK`, `CLOSE`, `URL`, `SET_VARIABLE`, `CONDITIONAL` with a boolean alias, `SET_VARIABLE_MODE`, and flow starting points.

Written and read back, but not played: how any of it feels. Key presses and timeouts only prove they were stored.

Not tested: media actions, `ON_DRAG`, mouse enter and leave, and `EXPRESSION` conditions (these failed).

Overlay position, background, and click outside settings are read only in the Plugin API. A new overlay uses Figma's defaults. Say so if the user wants a dimmed backdrop; they must set it by hand.

A plain `NAVIGATE` link to its own screen is rejected. The script stops before writing and names the layer.

## Extra spec fields

- `"toLayer": "Screen/Layer"` replaces `to` when the destination is a layer, not a screen. Use it for `SCROLL_TO` (a section inside a scrolling frame) and `CHANGE_TO` (a variant inside a component set).
- Component sets and components on the page count as screens, so `from` can be `Button/Style=Primary, State=Default`.
- `CHANGE_TO` reactions live on the variants. Run the script on the page that holds the component set.
- A scrolling frame needs `overflowDirection = "VERTICAL"` (the accepted values are `NONE`, `HORIZONTAL`, `VERTICAL`, `BOTH`).
- If Figma refuses the write for one layer after names resolved, the script keeps going and lists it under `failures`. Check `applied`.

## Output

```
Prototype: <flow name>  <file URL>
Links written: <n> on <n> layers   Starting point: <screen>
Flow check: <Blockers/Critical/Warning counts>
Fixed: <list or none>
Left: <list or none>
Try this path: Home > Open > Back > Menu > Close
Not seen: how it feels when played. Please click through and tell me what to change.
```
