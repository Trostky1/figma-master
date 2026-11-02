# Prototype reference

Write with `await node.setReactionsAsync([...])`. Read with `node.reactions`. Always read back after writing.

A reaction is one trigger plus a list of actions.

## Triggers

| Type | Fields | Note |
|---|---|---|
| `ON_CLICK`, `ON_PRESS`, `ON_HOVER`, `ON_DRAG` | none | `ON_HOVER` and `ON_PRESS` undo when the trigger ends. |
| `AFTER_TIMEOUT` | `timeout` (ms) | |
| `MOUSE_ENTER`, `MOUSE_LEAVE`, `MOUSE_UP`, `MOUSE_DOWN` | `delay` (ms) | One way. Not undone. |
| `ON_KEY_DOWN` | `device`, `keyCodes` | |
| `ON_MEDIA_HIT`, `ON_MEDIA_END` | `mediaHitTime` | Video only. Check the unit before use. |

## Actions

| Type | Fields |
|---|---|
| `NODE` | `destinationId`, `navigation` (`NAVIGATE`, `SWAP`, `OVERLAY`, `SCROLL_TO`, `CHANGE_TO`), `transition`, optional reset flags |
| `BACK`, `CLOSE` | none |
| `URL` | `url` |
| `SET_VARIABLE` | `variableId`, `variableValue` |
| `SET_VARIABLE_MODE` | `variableCollectionId`, `variableModeId` |
| `CONDITIONAL` | `conditionalBlocks[]` each with `condition` and `actions` |
| `UPDATE_MEDIA_RUNTIME` | `mediaAction`, `destinationId` |

## Transitions

- Simple: `DISSOLVE`, `SMART_ANIMATE`, `SCROLL_ANIMATE`. Fields: `type`, `easing`, `duration`.
- Directional: `MOVE_IN`, `MOVE_OUT`, `PUSH`, `SLIDE_IN`, `SLIDE_OUT`. Add `direction` (`LEFT`, `RIGHT`, `TOP`, `BOTTOM`) and `matchLayers` (true means Smart Animate).
- `duration` is in seconds.

## Easing

`EASE_IN`, `EASE_OUT`, `EASE_IN_AND_OUT`, `LINEAR`, the `_BACK` forms, `CUSTOM_CUBIC_BEZIER` (with `easingFunctionCubicBezier {x1,y1,x2,y2}`), `CUSTOM_SPRING` (with `easingFunctionSpring {mass, stiffness, damping, initialVelocity}`), and named springs `GENTLE`, `QUICK`, `BOUNCY`, `SLOW`.

Never write `EASE_IN_OUT`. The name is `EASE_IN_AND_OUT`.

## Tested shapes

Smart Animate with a spring:

```js
await node.setReactionsAsync([{
  trigger: { type: 'ON_CLICK' },
  actions: [{
    type: 'NODE', destinationId: '1:6', navigation: 'NAVIGATE',
    transition: { type: 'SMART_ANIMATE', easing: { type: 'GENTLE' }, duration: 0.4 }
  }]
}]);
```

Set a boolean, then branch on it:

```js
await node.setReactionsAsync([{
  trigger: { type: 'ON_CLICK' },
  actions: [
    { type: 'SET_VARIABLE', variableId: flag.id,
      variableValue: { type: 'BOOLEAN', resolvedType: 'BOOLEAN', value: true } },
    { type: 'CONDITIONAL', conditionalBlocks: [{
      condition: { type: 'VARIABLE_ALIAS', resolvedType: 'BOOLEAN',
                   value: { type: 'VARIABLE_ALIAS', id: flag.id } },
      actions: [{ type: 'NODE', destinationId: '1:5', navigation: 'NAVIGATE',
                  transition: { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.3 } }]
    }] }
  ]
}]);
```

## Smart Animate needs matching layers

Smart Animate matches layers by name between the two frames. Give the same layer the same name in both frames. Change the property you want to animate (position, size, opacity, color). Unmatched layers dissolve instead.
