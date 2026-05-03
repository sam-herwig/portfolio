# Copy Archive — samherwig.dev (pre-redesign)

> Preserved before Phase 0 deletions. Tags:
> - 🟢 **Theme-neutral** — lift directly to redesign
> - 🟡 **Theme-coded but salvageable** — rewrite the trail noun, keep the structure/voice
> - 🔴 **Theme-bound** — kill, write fresh
>
> Case study body content lives in `web/src/data/projects.ts` and is **fully preserved** (only the schema types `StationBreak`, `SpecimenBlock`, `FriezeBlock`, `MastheadBlock`, `TRAIL_STATIONS` are stripped — actual project prose, headings, image refs, and metadata stay intact).

---

## Identity (global)

🟢 **Email:** `sam@samherwig.dev`
🟢 **LinkedIn:** `https://linkedin.com/in/samherwig`
🟢 **Twitter handle:** `@samherwig`
🟢 **URL:** `https://samherwig.dev`
🟢 **Wordmark:** `Sam Herwig`
🟢 **Title:** `Creative Engineer`
🟢 **Schema/SEO bio:** `Creative engineer building scroll-driven WebGL experiences in Three.js and shaders.`
🟢 **Locality:** Denver, CO, US
🟢 **Affiliation:** CraftedKit · `https://craftedkit.io`
🟢 **Skills (knowsAbout):** Three.js, WebGL, GLSL, React, Next.js, Creative coding, Shader development

🟡 **Page metadata title:** `Sam Herwig | Creative Engineer` *(neutral — lift)*
🟡 **Page metadata description:** `I write code that you walk through. Three.js, shaders, and the browser as a canvas.` *(the "walk through" gestures at the trail metaphor — could keep, could swap to "scroll through" or rewrite)*

---

## Homepage — Hero

🟡 **Eyebrow:** `Denver · Front End / Creative Engineering` *(keep structure, drop or swap "Denver" if going US-agnostic)*
🔴 **Headline:** `Let's climb a mountain` — kill, write fresh
🔴 **Subhead:** `3D web, motion, marketing sites. Most of the good stuff lives a little above the treeline.` — first half neutral (`3D web, motion, marketing sites.`), second half kill
🟢 **Primary CTA label:** `Email`
🟢 **Secondary CTA label:** `LinkedIn`
🟢 **CTA aria:** `Send email to start a project`, `Visit LinkedIn profile`

🟡 **Scroll indicator label:** `Scroll`
🟢 **Skip-to-content link:** `Skip to content`

---

## Homepage — About / "Forest Narrative" (4 cards)

🟡 **Section eyebrow on each card:** `Trail Marker` — kill the noun, keep the slot if useful

🟡 **Card 1 — "Hi, I'm Sam."**
> I make front ends where the hero is a real WebGL scene. Based in Denver, currently nursing a 40-tab Chrome window and one very confused GPU.

*Voice is exactly right for confident-cheeky. Salvage:* `I make front ends where the hero is a real WebGL scene.` *Cut Denver if going location-agnostic; the 40-tab/GPU joke is theme-neutral and good.*

🟢 **Card 2 — "The stack, roughly."**
> Next.js, R3F, a lot of custom GLSL, and whatever headless CMS the team already trusts. The fancy part has to survive a content edit at 4pm on a Friday.

*Fully reusable. The "4pm Friday" line is gold for confident-cheeky.*

🟡 **Card 3 — "The workbench stays messy."**
> I've got a half-finished thing that makes pixels behave like wet ink on paper, another that tries to catch the way fog hangs in a valley at dawn, and a third I can't talk about because I haven't figured out what it is.

*Wet-ink/fog refs are atmosphere-coded. Replace specifics with new shader-direction language (dispersion experiments, type-mesh studies); structure of "two I can name and one I can't" is reusable.*

🟢 **Card 4 — "What's out there."**
> Some client sites, a couple of heavier campaign builds, and CraftedKit, which is me plus a pack of AI agents that do the research passes and asset cleanup I'd never finish alone.

*Fully reusable. Strong CraftedKit positioning line.*

---

## Homepage — Skills / "GearRack" (formerly "The Gear")

🔴 **Eyebrow:** `Around the Fire` — kill
🔴 **Heading:** `The Gear` — kill, replace with theme-neutral noun (`Stack`, `Toolkit`, `Things I use`)

🟢 **Categories + tools (all directly reusable):**

**Creative Engineering**
- Three.js / R3F
- Custom GLSL Shaders
- WebGL / WebGPU
- Scroll-Driven 3D

**Marketing & CMS**
- Next.js / Nuxt
- GSAP / Framer Motion
- Sanity / Contentful
- Optimizely / Episerver

**Core Stack**
- TypeScript
- React / Vue
- Tailwind CSS
- Node.js

**AI & Tooling**
- Multi-Agent Pipelines
- Automated QA Gates
- Nightly Build Cycles
- Puppeteer / Playwright

---

## Homepage — Credentials Strip

🟢 **Credential line:** `Currently building at Consume & Create · CU Boulder MS '21`

🟢 **Tech marquee items:** Three.js · WebGL · GLSL · React · Next.js · Vue · Nuxt · TypeScript · GSAP · Framer Motion · Tailwind · Sanity · Node.js · WebXR · D3.js

---

## Homepage — Summit / Footer / Contact

🟡 **Eyebrow:** `Sam Herwig · Creative Engineer` *(reusable, just identity tag)*
🔴 **Display heading:** `The Summit.` — kill
🟡 **Subhead:** `Front-end systems, motion design, Three.js, and marketing builds that still know how to close.`

*"Marketing builds that still know how to close" is excellent confident-cheeky — keep. Drop the heading; the subhead can stand alone with a new heading.*

🔴 **Primary CTA label:** `Pitch Me Your Mountain →` — kill, write fresh (candidates: `Email me`, `Start something`, `Make something cool`)
🟢 **CTA aria:** `Send email to start a project`

---

## Section anchors / a11y labels (informational)

- `#main-content` — main content
- `#about` — About Sam
- `#skills` — Technical Skills
- `#trail-fork` — Trail Fork *(dies with the section)*
- `#selected-work` — Selected Work *(rename per redesign — `Field Notes` / `Drops` / `Work / 12` / TBD)*
- `#contact` — Contact

---

## Case study chrome

🔴 **Back link label:** `Back to Trail` — kill, replace with `Back` or `← Index` or `← Work`
🟢 **Generic:** `Read more`, `Watch video`, `Visit project` (used in case study CTAs — verify in projects.ts)

🟡 **Trail counter format:** `Trail / 07 / 24` — kill the "Trail" label, keep the `07 / 24` numeric pattern (it's exactly the "agency-tier visible craftsmanship" tell from research)

---

## Audio toggle (component dies, copy reusable if a similar control returns)

🟢 `Mute ambient sound` / `Enable ambient sound`
🟢 `Sound on` / `Sound off`

---

## Preloader (component dies — copy is theme-bound)

🔴 **Milestones:**
- `Base Camp` — `0m`
- `Tree Line` — `2,400m`
- `Alpine` — `3,600m`
- `Summit` — `4,200m`

*Replace with redesign-appropriate ramp — likely a single `0.00 → 1.00` numeric tied to dispersion intensity (per research finding #1).*

---

## 404 page

🔴 **Browser title:** `Off Trail · 404 — Sam Herwig`
🔴 **Meta description:** `The trail ended a few miles back. Backtrack to the trailhead.`
🔴 **Eyebrow:** `Error · 404 · Off Trail`
🔴 **Heading:** `Off Trail.`
🔴 **Body:**
> You've wandered past the last waypoint. The trail ended a few miles back — *backtrack to the trailhead* and pick up the route from there.
🔴 **CTA:** `← Return to Trailhead`
🔴 **Footer mark:** `Fig. 404 — Lost waypoint`

*Whole page rewritten — but per research, the 404 is the highest-leverage micro-stage for the signature material. Worth a custom flex.*

---

## Error page (boilerplate, fully neutral)

🟢 `Something went wrong.`
🟢 `An unexpected error occurred.`
🟢 `Try Again`

---

## Case study CONTENT (preserved in `src/data/projects.ts`)

The following survive **untouched**:
- All project titles, subtitles, slugs, tags
- All `projectUrl`, `thumbnail`, `gallery` references
- All overview headlines + section bodies
- All quote/testimonial blocks if any
- Per-project metadata (year, role, client, stack)
- All MP4 paths under `/public/work/videos/`
- All WebP paths under `/public/work/`, `/public/assets/graphics/case-study/`, `/public/images/diagrams/`

What dies in `projects.ts`: only the **schema types** for trail-themed block kinds (`StationBreak`, `SpecimenBlock`, `FriezeBlock`, `MastheadBlock`) and the `TRAIL_STATIONS` constant. The actual case study prose, headings, and media references are content, not theme.

If any individual project body uses trail vocabulary inside its `body` strings, that's surfaced during Phase 4 (case study template rebuild) — won't lose anything because `projects.ts` is preserved verbatim.

---

## Voice / register reference (lift to redesign tone guide)

The current site's *voice*, stripped of trail metaphor, is already in the right register for confident-cheeky:

- "**40-tab Chrome window and one very confused GPU**"
- "**The fancy part has to survive a content edit at 4pm on a Friday**"
- "**a third I can't talk about because I haven't figured out what it is**"
- "**me plus a pack of AI agents that do the research passes and asset cleanup I'd never finish alone**"
- "**marketing builds that still know how to close**"

These five lines define the voice. Keep that voice when rewriting the trail-bound headlines.
