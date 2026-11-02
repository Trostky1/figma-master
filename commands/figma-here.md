---
description: Point at a layer or area in Figma (paste a copy-link-to-selection link) so Claude knows exactly what you mean, then fix it from chat.
argument-hint: "<figma link with node-id> <what to change>"
---

Use the `figma-here` skill for this request: `$ARGUMENTS`

If there is no link with a `node-id`, ask the user to select the layer in Figma, copy the link to the selection, and paste it. Say back what you found and wait for a yes before changing anything.
