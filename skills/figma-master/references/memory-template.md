# .claude/figma.md template

Save this in a project as `.claude/figma.md`. Edit it by hand any time. figma-master reads it before it writes to Figma. Keep it short.

```markdown
# Figma settings

## Files
- Main design file: <URL or unknown>
- Design library: <URL or unknown>

## Type
- Font family: <name or unknown>
- Font style names checked: <for example "Semi Bold" not "SemiBold">

## Design system
- Variables prefix: <for example color/, space/>
- Naming rule: <for example color/gray/900 matches --color-gray-900>
- Code tokens file: <path or none>

## Motion
- Style: calm | standard | expressive
- Reduced motion version: yes | no
- Default easing: <for example EASE_OUT>
- Default duration (s): <for example 0.25>

## Rules for this project
- <one line each, for example "Never change the Brand page">
```

figma-master asks at most 2 questions to fill this: the font family, and the library or file URL. Everything else starts as `unknown`.
