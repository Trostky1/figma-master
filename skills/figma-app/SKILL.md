---
name: figma-app
description: Use to design mobile app screens (iOS and Android) in Figma Design in a chosen style kit. Plans the screens and states first, builds with variables and components, sets safe areas and thumb reach, then checks text size, touch targets, contrast, and style fidelity. Wraps figma-flow, figma-use, and figma-generate-design.
---

# figma-app

Status: written, not tested in Figma. Treat the first run as a trial and report what broke.

Load `figma-use` and `figma-generate-design`. Profile: `profiles/mobile-app.json`.

## Process

1. **Style kit (required).** Run the style step of `figma-new` if there is none.
2. **Plan with `figma-flow`.** List screens, states (loading, empty, error, offline), and paths. Show the plan. Wait for a yes.
3. **Platform.** Ask iOS, Android, or both. iOS 393 by 852. Android 412 by 915. Targets 44 on iOS, 48 on Android.
4. **Variables and styles.** Theme collection from the kit. Text styles by role. Use the `Breakpoint` collection only if you support two sizes.
5. **Components first.** Tab bar, top bar, button, list row, input, card, sheet. Include press and disabled states.
6. **Screens.** Name `<Screen> / Mobile 393`. Keep content out of the safe area (top 59, bottom 34). Primary action in the lower half. Tab bar at most 5 items.
7. **Check.** Run `site-check.js` from figma-site with `profiles/mobile-app.json` and the kit (it checks the Mobile frames: text, targets, contrast, overflow, style fidelity). Then `figma-audit`.
8. **Prototype.** Use `figma-prototype` for the paths from the plan.
9. **Report.** Screens, states built, scores, not observable.

## Rules

- Back is always possible. Destructive actions ask first.
- Every list screen has an empty state. Every network screen has loading and error states.
- Text 16 or more for body. Do not shrink to fit. Cut words.
- Use platform patterns (iOS back swipe, Android system back). Do not invent a nav model without a reason.

Not observable: real device speed, gestures, haptics, Dynamic Type, keyboard overlap, dark mode on device.
