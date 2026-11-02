# Format profiles

One file per format. A profile holds the numbers and rules that change with what you are making. The skills read it. The audits read it. Nothing in code is hard wired to one format.

| Format | Profile | Status |
|---|---|---|
| Presentation (Figma Slides) | `presentation.json` | Built and tested |
| Website (desktop and responsive) | `website.json` | Built and tested |
| Mobile app | | Planned |
| Mobile website | | Planned |
| Poster (print) | | Planned |

## Shape of a profile

```json
{
  "format": "presentation",
  "name": "Presentation (Figma Slides)",
  "status": "built",
  "canvas": {},
  "margins": {},
  "type": {},
  "density": {},
  "contrast": {},
  "layout": {},
  "motion": {},
  "export": {},
  "skills": [],
  "notObservable": []
}
```

- `canvas`: sizes and structure.
- `type`: minimum sizes and how many families.
- `density`: how much may go on one unit (slide, screen, section).
- `contrast`: thresholds for body and large text.
- `layout`: variety rules, required non text elements, sections.
- `skills`: which skills this format loads.
- `notObservable`: what Figma cannot show for this format. The report must say so.

## Rules

1. The numbers are working defaults. Change them with evidence, and write the reason.
2. A style kit may override type families, weights, line height, tracking, and colors. It never overrides the minimum sizes or the contrast thresholds. Those protect the reader.
3. When a number is missing, say so. Do not guess.
4. A new profile needs: a profile file, a check script (or an honest "not checked"), a tested real example, and an entry in the router skill.
