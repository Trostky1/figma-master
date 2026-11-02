# figma-master: branches, ripping, and "what I mean" (RESEARCH ONLY, no code)

Date: 2026-11-02. Nothing in this file was built. Two small read-only probes were run (one Mobbin search, one Figma selection read).

Three new features to research:

1. **Branches.** The skill tailors itself to the thing being made: presentation, mobile app, desktop website, mobile website, poster.
2. **Rip.** Read live sites, screenshots (Mobbin and others), Framer sites, and Figma files. Pull out styles, themes, and components. Reuse them in our own designs.
3. **Point.** Know exactly which component or area of a Figma file the user means, then fix it from chat.

---

## 1. What already exists

### 1.1 The repos you listed

| Project | License | What it is | Best ideas to take | Weak spots |
|---|---|---|---|---|
| [nexu-io/open-design](https://github.com/nexu-io/open-design) | Apache-2.0 | Local design workspace. Uses your own agent CLI as the engine. 100+ skills, 277 plugins, 151 design systems. | `DESIGN.md` as the one central file (tokens, components, provenance). Modes: prototype, deck, video, image. Drop a screenshot or URL, get a `DESIGN.md`. A `critique` skill (5-dimension self review). Live "tweaks" panel. Brand context saved across sessions. | Extraction method is not described. Some features are alpha (tweaks panel, surgical comment edits). It is its own app, not Figma. |
| [hugohe3/ppt-master](https://github.com/hugohe3/ppt-master) | MIT | Agent skill. Turns PDF, DOCX, images, or text into native, editable PPTX. | Builds real PowerPoint shapes, not pictures (SVG to DrawingML). Distills reusable templates from your references. "Edit native PPTX" fills an existing deck and keeps the design. Speaker notes, image licensing with auto credit. Confirms a design spec first, with a quick mode. | No automated quality checks. One pass in quick mode. PowerPoint only. |
| [hakimel/reveal.js](https://github.com/hakimel/reveal.js) | MIT | HTML presentation framework. | Vertical slides, Markdown slides, auto-animate between slides, speaker notes, PDF export, code and math. A good HTML target for decks. | A framework, not a designer. Docs for themes and plugins are on revealjs.com (not read). |
| [gohugoio/hugo](https://github.com/gohugoio/hugo) | Apache-2.0 | Static site generator. | Content and theme are separate. Hugo Modules share themes and assets. Asset pipeline for CSS, JS, and images. Instant dev server. A good website output target. | Theme layout and front matter details are in its docs (not read). It does not design. |
| [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai) | Apache-2.0 | Crawler. Python library, Docker server, MCP. | Screenshots and PDFs. Clean Markdown. CSS and XPath extraction without an LLM, with `generate_schema`. JS execution. Sessions and saved logins. | Heavy to set up (browser, Docker, token). Built for content, not styles. Anti-bot options need care and permission. |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | see repo | 314 skills. | See 1.2. | Still no Figma, no poster, no mobile design skill. |

### 1.2 What ECC gives us this time

| ECC skill | Idea to borrow |
|---|---|
| `frontend-slides` | A hard "fit the viewport" gate. Density limits per slide type (heading plus 4 to 6 bullets, grids of 6 or fewer, code of 10 lines or fewer). Test at 5 sizes. Preview 3 looks and let the user pick. Reduced motion. Convert PPT in, keep notes. |
| `design-system` | Scan before you propose. One token file, many outputs. Write the reason next to each token. Ship a self-contained preview page. Score on 10 named dimensions, 0 to 10. A separate "AI slop" check. Tie each finding to an exact place. |
| `browser-qa`, `data-scraper-agent`, `accessibility`, `brand-discovery`, `dashboard-builder` | Names only. Not read. Worth a look when we build. |

### 1.3 Tools that rip styles from the web (found this round)

| Tool | License | How it works | Notes |
|---|---|---|---|
| [dembrandt](https://github.com/dembrandt/dembrandt) | MIT | Playwright renders the page. Reads computed styles from the DOM. | Colors with roles and confidence, type, spacing, borders, shadows, motion, buttons, inputs, breakpoints, icons. Outputs DTCG, `DESIGN.md`, Tailwind v4, shadcn. `--dark-mode`, `--mobile`, `--crawl`. A drift gate compares to a saved baseline. Cannot read canvas or WebGL sites. Asks users to respect site terms and not reproduce brands. Has an MCP server. |
| [arvindrk/extract-design-system](https://github.com/arvindrk/extract-design-system) | see repo | Playwright. Skill plus CLI. | Tokens only, not components. Strict safety rules: draft only, ask before changing code, one page is not a whole system. Splits extract from file writing. |
| [jpoindexter/design-md-extractor](https://github.com/jpoindexter/design-md-extractor) | see repo | Playwright. Per page and per viewport. | The richest: components grouped by type with reuse counts, layout rhythm, imagery strategy, interaction states (real pointer events), `evidence.json`, an AI rebuild prompt, a local GUI. Blocked by Cloudflare and logins. |
| designlang family (`d-extract`, `design-extract`) | see repos | npm CLI and Claude plugin | Forks with drift check and sync commands. |

### 1.4 Tools that turn pictures and pages into design

| Tool | What it does | Notes |
|---|---|---|
| [html.to.design](https://html.to.design/docs/free-features) | Figma plugin. Live URL to editable layers, optional auto layout, local styles and variables, hover states as components. | Public URLs only. A Chrome extension covers private pages. Free tier is about 10 imports a month. Handles Framer, Webflow, WordPress sites. You run it by hand inside Figma. |
| Figma screenshot to design | Figma's own converter. | Details not read. |
| Codia, image.to.design | Figma plugins. Image to editable layers. | Vendor claims. Unverified. |
| [abi/screenshot-to-code](https://github.com/abi/screenshot-to-code) | Screenshot to HTML, React, Vue, Tailwind. | Code, not Figma. README is old. Output looks close but is weak on structure and accessibility. |
| Figma `generate_figma_design` | Captures a live web page into Figma. Docs say production, staging, or localhost on the remote server, "select clients" only. | **Not in this session's tool list.** A GitHub issue says it is missing in Claude Code. We cannot rely on it. |

### 1.5 Framer and Figma community files

- **Framer to Figma:** no official export. Framer's importer goes Figma to Framer only, copies layers (not component libraries), and does not bring fonts. html.to.design reads Framer sites.
- **Framer Server API** is in open beta (since February 2026). It covers CMS updates and publishing. Reading components and styles through it is not documented in what I found.
- **Official Framer MCP** (`mcp.framer.com/mcp`): create pages, edit layouts and copy, manage CMS. Third party servers exist.
- **A published Framer site is a normal web page.** DOM extraction (dembrandt style) works on it.
- **Figma Community files:** free files are CC BY 4.0. You may adapt them, even commercially, if you credit the creator. Duplicating copies the file to your drafts. Paid files use a separate license. Each creator may add terms in the file description. ([Figma help](https://help.figma.com/hc/en-us/articles/360042296374-Figma-Community-copyright-and-licensing))
- **Reading a Figma file we can open:** `get_design_context`, `get_variable_defs`, `get_screenshot`, library search, and our own read scripts. The official Slides skill already says: with a reference file, "your job shifts from designer to interpreter".

### 1.6 Mobbin (connected in this session)

Probe result (one search, 2 results): each result has `id`, `image_url` (high resolution, expires in 30 days), `mobbin_url`, `app_name`, `platform`. The inline previews carry a "curated by Mobbin" bar. Tools: `search_screens`, `search_flows`, `search_sections`, `list_collections`. Searches take `platform` (ios or web) and an `output_destination` such as `design_tool`.

The tool text says: cite each result with its `mobbin_url`, download from `image_url` instead of reusing previews, and show any `ai_usage_notice` word for word.

**Terms warning.** A third party summary of Mobbin's terms says they bar using AI tools to make derivative works of platform materials or to train or index a model on them without consent. The screens show other companies' interfaces, which may be protected. I could not confirm the current text. **Read mobbin.com/terms before we build any "clone from Mobbin" feature.** Safe use: look at patterns and structure, cite the source, rebuild with our own content and brand.

### 1.7 Format specific skills that exist

| Format | Found | Gap |
|---|---|---|
| Presentation | Figma's own `figma-use-slides` (installed here), ppt-master, reveal.js, ECC `frontend-slides`, `design-slides` in chudarin-design-skills | Nobody joins Figma Slides, PPTX, and HTML under one rule set. No automated deck quality check in Figma except the overlap validator. |
| Mobile app | [ehmo/platform-design-skills](https://github.com/ehmo/platform-design-skills) (MIT, iOS and Android rules, 300+ or 450+ rules), awesome-skills `mobile-app-design`, Figma's `figma-swiftui` (installed), Expo skills (installed) | No skill sets up Figma frames, safe areas, and target checks together. |
| Desktop and mobile website | The `web` skill in platform-design-skills, Hugo, many design skills | No Figma skill for responsive sets (desktop, tablet, mobile of one page). |
| Poster | `poster-design-mcp` (HTML to 300 dpi PNG), posterskill (academic), a print spec list in a graphic design skill | Nothing for Figma. **Figma cannot export CMYK, bleed, or crop marks by itself.** Plugins do it (TinyImage, Print for Figma). Forum threads show the request is years old. |

---

## 2. Branches (formats)

### 2.1 The idea: a format profile

One small file per format. The router reads it. The audits, the doctor, and the design process all read the same file. Same skills, different numbers.

A profile holds:
- **Canvas:** sizes, orientation, grid, margins, safe area.
- **Structure:** what a "unit" is (slide, screen, section, panel).
- **Rules:** minimum text size, target size, density limits, contrast, line length.
- **Motion:** what moves, how long, what to avoid.
- **Checks:** the audit rules and thresholds that apply.
- **Export:** where it ends up and how.
- **Skills to load:** which Figma and figma-master skills run.
- **Reference sources:** where good examples live.
- **Honest limits:** what Figma cannot do for this format.

The audit already has fixed thresholds (12 px, 44 px). With profiles those become profile values. That is the main change to existing code.

### 2.2 Per format findings

#### Presentation

| Topic | Finding |
|---|---|
| Targets | Figma Slides (default), PPTX (ppt-master style), HTML (reveal.js or ECC style). The user picks. |
| Canvas | Figma Slides decks use a slide grid (`SLIDE_GRID`, `SLIDE_ROW`, `SLIDE`). Older workaround was 1920 by 1080 frames in a Design file. |
| Official skill | `figma-use-slides` (read). Two phase build for 5 or more slides: plan every slide first, then build 3 to 5 slides per call. A batch validator checks overlap, clipping, and out of bounds. Screenshots only at checkpoints. `get_metadata` does not work on Slides. `createPage` does not exist. Set `x` and `y` only after `appendChild`. Never delete slides to rebuild. Sections are grid rows. Speaker notes are supported. |
| Design rules to add | Plan layout variety (no "two column, two column, grid"). One signature element. Density limits from ECC. Reference file means "interpreter, not designer". |
| Checks to add | Minimum text size for projection (a number to verify, not assert). Slide density. Contrast. Notes present. Section names. Consistency of the title position across slides. |
| Motion | Figma Smart Animate between slides, reveal.js auto-animate as the HTML equivalent. Keep it small. Reduced motion version. |
| Open questions | Can Slides export PPTX or PDF through the API? What transitions can the API set? Does `get_design_context` read Slides? |

#### Mobile app

| Topic | Finding |
|---|---|
| Canvas | iPhone and Android frames. Exact sizes and safe area numbers were **not confirmed** by sources this round. They must be tested or read from platform docs. |
| Rules source | platform-design-skills: iOS (navigation, layout, gestures, tab bars, sheets, Dynamic Island, Dynamic Type), Android (Material 3, dynamic color, navigation). Rule files hold the numbers. Read them before we copy any. |
| Checks to add | Target size (platform specific), safe areas, thumb reach, text growth, dark mode pair, state coverage. |
| Prototype | Native feel: push, sheet, tab switch. Spring easing exists in Figma (`GENTLE`, `QUICK`, `CUSTOM_SPRING`). |
| Output | Figma's `figma-swiftui` skill and the Expo skills are already installed. The branch should hand off to them. |
| Reference | Mobbin iOS screens and flows (patterns only). |

#### Desktop website

| Topic | Finding |
|---|---|
| Canvas | A wide frame, a column grid, breakpoints. Exact numbers to be chosen and tested. |
| Structure | Sections: nav, hero, logo strip, features, proof, pricing, FAQ, footer. Mobbin's section search matches this model. Impeccable's own page follows it. |
| Responsive | One page as three frames (desktop, tablet, mobile) from the same components and variables. Variable modes can hold breakpoint values (a known technique, to test). |
| Output | Code (Next, plain HTML) or Hugo. Hugo's content and theme split suits a "Figma to Hugo theme" exporter. |
| Checks | Grid alignment, line length, one clear call to action, hover states exist, focus states exist, contrast. Page speed is not observable in Figma. |

#### Mobile website

| Topic | Finding |
|---|---|
| Difference from the app | Browser chrome, address bar, `env(safe-area-inset-*)`, no platform back gesture rules, no hover. |
| Difference from desktop | One column, thumb reach, sticky call to action, forms that do not trigger zoom. |
| Verification | We can check the live page at phone width. The built-in browser has `resize_window` (mobile preset 375 by 812). Compare Figma to the live result. |
| Build order | Derive it from the desktop set, not from scratch. |

#### Poster

| Topic | Finding |
|---|---|
| Real limits | **Figma has no native CMYK, bleed, or crop marks.** Plugins fill the gap. Complex jobs go to Illustrator or InDesign. So the skill must be honest: it designs and preflights, then hands off. |
| Canvas | Physical size (A-series, US sizes). Pick a rule for pixels per millimetre and keep it in the profile. |
| Print facts (standard print practice, verify with the printer) | Bleed (3 mm or 0.125 in), safe margin inside the trim, 300 dpi at final size, CMYK, fonts outlined or embedded. |
| Checks to add (a "preflight") | Image resolution at final size. Text inside safe margin. Bleed extended. Minimum text size for viewing distance. QR code size and quiet zone. Contrast. Fonts licensed for print. Rich black. |
| Export | PDF from Figma is RGB. Say so. Offer: plugin route, or a handoff note for the printer. |
| HTML route | `poster-design-mcp` style headless Chrome to 300 dpi PNG is an alternative for simple posters. |

### 2.3 What is shared across all five

- The profile file and the router step ("what are you making?").
- Per format reference examples (Mobbin, Figma community, `DESIGN.md`).
- Per format audit scores. Same engine, profile thresholds.
- Per format export notes.

---

## 3. Rip: view and reuse components, themes, and styles

### 3.1 Inputs and the best method for each

| Input | Best method | Exactness |
|---|---|---|
| Live public URL | Read computed styles from the DOM in a real browser (dembrandt style) | High for tokens. Medium for components. |
| Live page behind a login | Same, with the user's own session. **Needs the user's consent and care.** | Same |
| Screenshot or Mobbin image | Claude reads the picture (vision). Sample colors from pixels. Identify the font by look. | Approximate. Fonts and spacing are guesses. |
| Framer site | It is a live URL. Same as above. | High |
| Figma file (ours or community) | `get_design_context`, `get_variable_defs`, library search, our read scripts | Exact |
| PDF or deck | ppt-master style input reading | Medium |

**Proven in this session:** the built-in browser plus a short script read Impeccable's real fonts (Albert Sans, Alumni Sans, JetBrains Mono), real colors (oklch), and CSS variables from the live page. We needed no install. That shows the "no install" route works for the first test.

### 3.2 What a rip should produce

One folder per source, saved for reuse (idea from open-design and arvindrk):

```
styles/<name>/
  DESIGN.md        reasons, tone, rules, how components behave
  tokens.json      colors (with roles), type scale, spacing, radius, shadows, motion
  components.json  typed groups with counts, states, sample sizes
  layout.json      container widths, section rhythm, grid
  provenance.md    source URL or file, date, license, what was NOT copied
  preview.html     a page to look at it
```

Then the existing parts take over:
- `figma-sync` turns `tokens.json` into Figma variables (it already reads DTCG JSON).
- `figma-generate-library` (Figma's skill) builds the components.
- `figma-design` builds screens from that kit.
- `figma-audit` scores the result against the style's own rules.

### 3.3 Where figma-master is new

Existing extractors stop at tokens, a `DESIGN.md`, and a prompt. None of them:
- builds a **Figma library** (variables, text styles, components with variants) from the result;
- keeps a **provenance** record and enforces a license check;
- **verifies** the result against the source (compare the rebuilt screen to the source screenshot);
- plugs into **format profiles**.

### 3.4 How to test "almost exact" honestly

Use ground truth. For a site we can read (Impeccable), the DOM gives the real values. Then:
1. Run the screenshot only path (as if we had just a Mobbin image) and estimate the values.
2. Compare estimate to truth: color distance, font identified or not, spacing error in pixels, radius error.
3. Report a score per token class. That tells us what "almost exact" really means for screenshots.

A second test uses Mobbin: the incident.io hero returned by the probe is a live site, so truth is readable.

### 3.5 Rules and risks (needs your decision)

This is not legal advice. Check with a lawyer for commercial work.

- **Colors, spacing, and type sizes** are facts. Alone they are generally not protected.
- **Layout composition, original text, images, illustrations, logos, icons, custom fonts, and code** are protected. Trade dress and brand rules can also apply.
- **Site terms and robots.txt** may bar automated access. dembrandt's README asks users to respect them and to run only on sites that permit it or on your own properties.
- **Mobbin's terms** may bar AI derivative works (see 1.6).
- **Figma Community files** need credit (CC BY 4.0) and have per file terms.
- **Font files** have their own licenses. Naming a font is fine. Copying the file is not.

Proposed guardrails for the skill:
1. Ask before every scrape. Name the URL and what will be read.
2. Own sites and open licensed sources run without extra prompts. Other sites need an explicit yes and a stated purpose.
3. Rip the **system, not the artifact**: tokens, scales, patterns. Replace copy, images, logos, and brand marks. Warn when a result is close to a 1:1 copy of one distinctive composition.
4. Write a `provenance.md` every time (source, date, license, what was excluded).
5. Never bypass logins, CAPTCHAs, or bot checks. Stop and tell the user.
6. Mobbin: reference and cite only, until the terms are read.

### 3.5b Options for "fully create websites and apps from screenshots"

| Option | Result | Setup | Risk |
|---|---|---|---|
| A. Claude reads the screenshot and rebuilds in Figma with `use_figma` | Native layers, our variables and components | None | Medium fidelity. Slow on big pages. |
| B. DOM extraction, then rebuild | Higher fidelity tokens | None with the built-in browser. Or `npx dembrandt` (needs your OK) | Site terms |
| C. html.to.design plugin | Fast layer import | You run it by hand in Figma | Layers are messy. Third party. Free limit. |
| D. screenshot-to-code | Code, not Figma | API keys | Old |

Recommended default: B for live sites, A for screenshots, Figma file reading for Figma sources. C stays an optional manual aid.

---

## 4. Point: know what I mean in a Figma file

### 4.1 What I measured

| Test | Result |
|---|---|
| In this session's `use_figma` sandbox, read `figma.currentPage.selection` | **Empty.** |
| Read the viewport | Default values (center 960, 540, zoom 1). |
| `figma.currentUser`, `figma.activeUsers` | Not supported. |
| Official MCP tool list in this session | No "get selection" tool. `get_design_context`, `get_metadata`, `get_screenshot` all need a node id. |

Caveat: I did not have you select something in a file that was open. So the sandbox looks **headless, not your live view**, but a live test with you selecting a layer is still needed.

### 4.2 Options

| # | Option | How it works | Setup | Works now? | Notes |
|---|---|---|---|---|---|
| A | **Copy link to selection** | You press the copy link shortcut. The link has `node-id`. Claude reads that node. | None | Yes | Most reliable. One extra step. |
| B | **Figma desktop MCP server** | Local server inside Figma Desktop. Docs say "select a frame" then prompt. | Dev or Full seat. Desktop app. | Not tested | Official. Exact tool names for selection were not in the docs page I read. |
| C | **Figma Console MCP + Desktop Bridge plugin** | `figma_get_selection` returns selected nodes. `figma_get_design_changes` returns what changed. Plugin runs in Figma Desktop and talks over WebSocket. | Node 18+, a personal access token, import the plugin by hand | Not installed | Real time selection works only in its Local mode. About 10 minutes to set up. Community project (2.6k stars). |
| D | **Comments with pins** | You leave a Figma comment on the layer ("make this bigger"). Claude reads comments with their node. | Token for the Console tools | Not tested | Natural for "fix this". Gives a written note and a pin together. Can reply and resolve. |
| E | **Describe, then confirm** | You say "the hero card". Claude finds candidates by name, text, and position. Shows screenshots. You confirm. | None | Yes | Good fallback. Needs a layer index. |
| F | **Screen view** (computer use) | Claude takes a screenshot of the Figma app. It sees the selection box and the layers panel. | Permission to use the screen | Possible | Slow. Fragile. Last resort. |
| G | **A small plugin of our own** | Posts the selection to a local port. | Build and maintain | No | Console's bridge already does this. Do not rebuild without need. |

### 4.3 Proposed behavior (to design later)

A loop, whatever the input method:

1. **Resolve.** Turn "this", "the hero", or a link into one node id.
2. **Restate.** "I think you mean `Hero Compare` (7:43) on Home, 480 by 340. Is that right?" with a screenshot.
3. **Scope.** Only that subtree may change.
4. **Propose.** Say the change in one line.
5. **Apply and read back.** Then one screenshot, before and after.
6. **Undo path.** Name the change. Figma version history is the safety net.

Helpers to research further:
- **Layer index:** names, types, text, bounds, parent chain for a page. Used to match plain words to layers.
- **Aliases** saved in `.claude/figma.md` ("the hero" means `Home/Hero`).
- **Highlight:** another MCP server has `set_selection` (select and scroll to a node). That would let Claude show you what it thinks you mean. Console MCP's page lists no such tool.
- **Disambiguation:** if more than one match, show the top three with screenshots.

### 4.4 Questions to test before any code

1. With a layer selected in an open file, does the remote `use_figma` see it?
2. Does the desktop MCP server expose selection, and under which tool name?
3. Does `figma_get_selection` work with our file, and how fast?
4. Can an official or Console tool read comments and their node ids on your plan?
5. How good is "describe, then confirm" on a real page of 300 layers?

---

## 5. Proposed shape (no code yet)

| New piece | Job |
|---|---|
| Format profiles (5 files) | Numbers and rules per format |
| `figma-new` (command) | Ask "what are you making?", load the profile, route |
| Format skills: `figma-deck`, `figma-mobile`, `figma-web`, `figma-poster` | Process and checks per format. They call existing skills. |
| `figma-rip` | Live URL, screenshot, Figma file in. A style folder out. |
| `figma-kit` | Style folder in. Figma variables, text styles, and components out. |
| `figma-here` | The pointer loop above |
| `figma-preflight` | Poster and print checks |
| Audit and a11y | Read thresholds from the profile |
| `provenance` rules in CONFLICTS.md | Legal guardrails |

Order I suggest:
1. Format profiles plus the router, and **presentation** first (the most existing parts: Figma Slides skill, ECC rules, ppt-master ideas).
2. **Poster** second (it is the format with the clearest gap and honest limits).
3. **Rip** from DOM, tested against ground truth.
4. **Kit** builder.
5. **Pointer** starting with links, then comments, then the bridge.
6. Mobile app, desktop site, mobile site (they share most pieces).

## 6. Open questions (answered by the owner on 2026-11-02, see CHANGELOG 0.7.0)

1. Which format first? (Suggested: presentation.)
2. For rip: own sites and open licenses only, or other sites with a yes each time?
3. Will you read Mobbin's current terms, or should I fetch and summarize them?
4. For pointing: start with links and comments (no install), or install the Console bridge (10 minutes, a token)?
5. Presentation output: Figma Slides only, or PPTX and HTML too?
6. Poster output: design plus preflight only, or also a plugin route for CMYK?
7. May I run `npx dembrandt` on one site as a test? (It downloads a browser.)

## 7. Sources

- [open-design](https://github.com/nexu-io/open-design), [ppt-master](https://github.com/hugohe3/ppt-master), [reveal.js](https://github.com/hakimel/reveal.js), [Hugo](https://github.com/gohugoio/hugo), [Crawl4AI](https://github.com/unclecode/crawl4ai), [ECC](https://github.com/affaan-m/ECC)
- ECC skills read: [frontend-slides](https://github.com/affaan-m/ECC/blob/main/skills/frontend-slides/SKILL.md), [design-system](https://github.com/affaan-m/ECC/blob/main/skills/design-system/SKILL.md)
- Extractors: [dembrandt](https://github.com/dembrandt/dembrandt), [extract-design-system](https://github.com/arvindrk/extract-design-system), [design-md-extractor](https://github.com/jpoindexter/design-md-extractor)
- Screenshot and page to design: [html.to.design](https://html.to.design/docs/free-features), [screenshot-to-code](https://github.com/abi/screenshot-to-code)
- Framer: [Framer importer lesson](https://framer.com/academy/lessons/import-from-figma), [html.to.design from Framer](https://html.to.design/blog/from-framer-to-figma), [Server API beta news](https://www.createwith.com/tool/framer/updates/framer-opens-server-api-beta-for-automated-cms-updates-and-publishing)
- Figma: [MCP server intro](https://developers.figma.com/docs/figma-mcp-server/), [Community licensing](https://help.figma.com/hc/en-us/articles/360042296374-Figma-Community-copyright-and-licensing), [Figma Console MCP](https://github.com/southleft/figma-console-mcp), [CMYK forum threads](https://forum.figma.com/suggest-a-feature-11/export-to-cmyk-36522/index4.html)
- Mobile: [platform-design-skills](https://github.com/ehmo/platform-design-skills), [mobile-app-design](https://github.com/awesome-skills/mobile-app-design)
- Poster: [poster-design-mcp](https://glama.ai/mcp/servers/suprisedr/poster-design-mcp), [graphic design skill](https://claudeskills.info/skills/travisjneuman/.claude/graphic-design/)
- Mobbin: [terms summary](https://tostracker.app/document/mobbincom-tos) (third party, verify at mobbin.com/terms)
- Local: `figma-use-slides` skill text (read in full for slides rules)
