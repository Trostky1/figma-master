---
name: figma-mobile-site
description: Use to design a phone first website in Figma Design (Mobile 390 first, then Tablet 768) in a chosen style kit. Builds on figma-site with the mobile site profile, a menu button nav, a tighter first screen, and a short performance budget for images and fonts.
---

# figma-mobile-site

Status: written, not tested in Figma.

Follow `figma-site` for the whole process (Breakpoint modes, components first, checks). Differences:

- Profile: `profiles/mobile-site.json`. Frames: Mobile 390 first, then Tablet 768. Add Desktop only if asked.
- Design Mobile first. Tablet adds columns. Do not shrink Desktop.
- Nav: logo, one primary action, menu button. The menu opens a full screen or a drawer (design both states).
- First screen: headline, one sentence, one button. Primary button within 700 px.
- No hover. Every hover idea needs a tap version.
- Limit to 2 font families and few weights. Keep images few and large enough to matter.
- Run `site-check.js` from figma-site with `profiles/mobile-site.json`.

Not observable: real page speed, browser toolbar changes, orientation, keyboard overlap, slow networks.
