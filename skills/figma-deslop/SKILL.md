---
name: figma-deslop
description: Use to remove AI slop from a Figma design: generic default looks (blue to purple gradients, Inter everywhere, three identical cards, icon in a circle, centered paragraphs, uniform big radius, glass and shadow everywhere) and generic copy (unleash, seamless, elevate, placeholder text, emoji icons). Scans, explains each sign, replaces it with a choice taken from the style kit and the brief, and keeps the content and the identity. Use when a design looks like every other AI made page.
---

# figma-deslop

Slop is a choice made by habit. Nobody chose it for this brief. Your job is to find each habit and replace it with a decision.

Read first: the style kit (`DESIGN.md`, `tokens.json`) and the brief. Without them you cannot tell slop from intent. If there is no kit, run the style step of `figma-new` or `figma-rip` first. Load `figma-use` before any `use_figma` call.

## Process

1. **Scope.** Get the node id of the frame. Ask which one if unclear.
2. **Scan.** Run `scripts/slop-scan.js` (replace `__ROOT_ID__`). It is read only. It finds signs and gives a slop score (higher is cleaner).
3. **Look.** Take a `get_screenshot`. Read the squint test: cover the text. Does it look like any page you could name? Does the page say what it is without words?
4. **Judge each sign.** A sign is slop only if the kit and brief did not ask for it. A kit with a gradient on purpose is not slop. Write the verdict per sign: slop, or intended.
5. **Plan the swaps.** For every slop sign, write one replacement chosen from the kit (see "Swap table"). Show the list. Wait for a yes unless the user said to go ahead.
6. **Apply.** Use `use_figma` for design changes (read `figma-use` first). Copy changes go through the user (see "Copy rules"). Return ids.
7. **Re-scan.** Run the scan again. Take one screenshot. Report before and after.

## The signs and the swap

| Sign (rule id) | Why it is slop | Swap |
|---|---|---|
| Blue to purple gradient (`purple-gradient`) | The default AI hero. | Flat kit color, or the kit's own gradient. Or a photo or shape from the kit. |
| Gradient text (`gradient-text`) | Decoration with no job. | Solid ink. Use weight and size for emphasis. |
| Inter only (`default-font-only`) | Nobody chose it. | The kit's display face for headings, its body face for text. |
| Centered paragraphs (`centered-paragraphs`) | Hard to read past 2 lines. | Left align. Center only a title, a quote, or one sentence. |
| Three identical cards (`three-identical-cards`) | A template, not content. | Use the real count. Vary size by importance. Make one card the lead. |
| Icon in a circle (`icon-in-circle`) | Filler. | Remove the icon, or use the kit's mark, or a number, or a real image. |
| Same big radius (`same-big-radius`) | One setting for everything. | Use the kit's shape language: sharp, pill, or mixed on purpose. |
| Shadow everywhere (`shadow-everywhere`) | Depth with no meaning. | Use borders or flat color. Keep shadow for one raised layer. |
| Glass blur (`glass-everywhere`) | A trend, not a need. | Solid surface from the kit. |
| Emoji as icon (`emoji-as-icon`) | Inconsistent across devices. | The kit's icon set, or none. |
| Placeholder text (`placeholder-text`) | Unfinished. | Real text from the user. Ask. Never invent claims. |
| Stock phrase (`slop-phrase`) | Says nothing. | See copy rules. |
| Dash in copy (`dash-in-copy`) | A strong AI tell in bulk. | Use a period or a comma. Respect the project's own style rule. |
| Exclamation mark headline (`exclamation`) | Shouting. | Plain statement. |

## Beyond the scan (look for these by eye)

- A hero with a big headline, a small subline, two buttons, and a glow behind it.
- Feature grids where every card has the same icon, title, and two lines of text.
- Stock "trusted by" logo rows with no real logos.
- Pill badges above every heading ("New", "Beta", "AI powered").
- Even spacing everywhere. Real design has rhythm: tight groups, big gaps between ideas.
- No point of view. Ask: what is the one thing this page wants to be remembered for? Make that thing larger, stranger, or closer to the edge.

## Copy rules

- Never change meaning, claims, prices, or names.
- Do not invent facts, numbers, quotes, or customers to fill space.
- Say the concrete thing. "Mist from a neckband you wear while you train" beats "Unleash seamless performance".
- Cut adjectives first. Then cut the sentence. Keep the verb.
- If the project has a rule such as "copy comes verbatim from a source" or "no health claims", that rule wins. Flag the line. Do not edit it.
- Offer 2 rewrites per line. The user picks.

## Rules for this skill

- Keep the content, the structure, and the kit's identity.
- Do not swap one habit for another habit (purple gradient to orange gradient). Remove it or decide it.
- The scan finds signs. It is not a score to chase. A page can score 100 and still look generic. Use your eyes.

Not observable: whether the page feels distinct to a real visitor, how the copy sounds read aloud, brand rules that live outside the file.
