# samherwig.dev — Redesign Plan (Agency-Tier Pivot)

> Drafted from /grill-me + 10 parallel research agents. Awaiting verification before any code is written.

## North star

A confident-cheeky, agency-tier portfolio whose single signature is **3D type rendered through a custom dispersive/refractive material** — recurring across hero, section breaks, every case study cover, and the cursor itself. Editorial typographic spine carries taste; one weird-but-clean shader carries engineering. Two things, executed at peak quality. Buyer = US agencies & studios at the Active Theory / Lusion / Hello Monday / Watson DG tier.

## Locked decisions

| Axis | Locked |
|---|---|
| Theme | **Removed entirely.** No metaphor, no regional vocabulary, no trail/forest/summit anywhere. |
| Buyer | US agencies + studios (peer-judged) |
| Organizing principle | Typography + material + motion, converged into one signature |
| Register | Confident-cheeky (clean + senior + a touch of wit; not toy, not lifestyle, not illustrated) |
| Signature | 3D type-mesh + custom dispersive/refractive material, 10% viscous undertone |
| Architecture | Stacked-panel scroll, single fixed R3F canvas, 3-panel ruthless homepage |
| Color | Dark default. Near-black bg, off-white type, mono labels in muted gray. Single accent emerges from dispersion chroma. |
| Motion language | Springy + slight overshoot. Fast in, slow settle. Cursor has momentum. Transitions ramp dispersion intensity, not opacity. |
| Identity | Sam Herwig the freelancer. Personal name as wordmark. |
| Typography | Display: **Fraunces** (OFL, variable, opsz/wght/SOFT/WONK). Body: **Geist Sans** (OFL). Utility: **Geist Mono** (OFL). All free. Hot-swappable later. |

## Highest-signal research findings (the 4 that matter most)

1. **Roman Jean-Elie's portfolio (Codrops, Nov 2025)** is the closest extant match for our exact signature — project titles as WebGL textures with stretch-on-scroll-velocity. Use as architectural reference. https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/
2. **Stack pivot is required, not optional.** Agency-tier 2026 consensus: Lenis + virtual scroll + GSAP ScrollTrigger orchestrating, R3F rendering, Framer Motion downgraded to component-level only. Current site uses Framer Motion `useScroll` everywhere — wrong primitive for this signature.
3. **The "engineered" tell over drei drop-in** is three techniques together: (a) per-channel IOR refraction (or 6-channel rygcbv spectral split), (b) back-face depth FBO pre-pass for thickness on non-convex text geometry, (c) cursor *velocity* (not position) coupled to dispersion uniform. Source: Heckel, Petrick, Anatole Touvron.
4. **Whitespace named explicitly:** no one at agency tier has paired dispersive 3D type with a serif display face. Every existing demo uses geometric sans. Fraunces in dispersion is genuinely differentiated territory.

## Information architecture

### Homepage (3 panels, ruthless)

1. **Hero** — full viewport. Name + one tagline as 3D dispersive type. Cursor is a refractive lens. That's it.
2. **Selected Work** (rename pending — candidates: `Field Notes`, `Drops`, `Work / 12`). Grid of case study tiles. Each tile auto-generates a cover from project title + signature material. Hover deforms.
3. **Contact** — single typographic statement + email. Possibly the Hello-Monday 4-bucket intent split (`work / hi / collab / learn`).

Visible UI tells: scroll-progress numeric (`0.00–1.00`) in a corner, doubling as the dispersion-intensity uniform display.

### Case study pages

- **Title panel:** project name in 3D dispersive type, metadata triple inline below (`Year · Role · Client · Stack · Awards`).
- **Body:** numbered chapters (`01`, `02`, `03`) — free-form count per project, no enforced 5-act schema.
- **Rhythm:** paragraph → visual → paragraph, no text block over ~80 words before a visual break.
- **Outro:** "Next Project" — never "Get in touch" inside a case study.
- **`/lab` sub-route per case study** (Immersive Garden pattern): public surface stays calm and taste-driven; one click reveals shader breakdown, code snippets, easter eggs. Solves the dual-audience problem in one move.

### Other surfaces

- 404 page — high-leverage micro-stage for the signature material
- Loading state — quiet, possibly the dispersion uniform ramping from 0 → 1
- Footer — Rauno-style declarative repetition with clipped fragment

## Tech stack pivot

| Layer | Current (dies) | New |
|---|---|---|
| Smooth scroll | Native + Framer `useScroll` | **Lenis** (`<ReactLenis root>` in root layout) |
| R3F canvas | Per-page | **Persistent in root `layout.tsx`** |
| DOM ↔ mesh sync | Manual | **14islands/r3f-scroll-rig** (or tunnel-rat for lighter touch) |
| Choreography | Framer Motion useScroll + transforms | **GSAP ScrollTrigger** drives shader uniforms via single store |
| Route transitions | None | **Next.js View Transitions API** (`viewTransition: true`) — Canvas wrapped with `viewTransitionName: 'none'` to prevent flicker |
| Triggers | scroll-progress math | **IntersectionObserver** for set-piece triggers |
| Text rendering | Plain DOM | **drei `<Text>` (troika)** + **THREE-CustomShaderMaterial** layered over MeshTransmissionMaterial. Pre-baked MSDF atlas via `msdf-bmfont-web` |
| Variable font axes | n/a | DOM uses live VF axis play (CSS `font-variation-settings`); 3D type uses baked atlas of one chosen variant (live axis morph in MSDF not viable in 2026) |
| Component motion | Framer Motion (full) | Framer Motion (component-level only) |

Stays the same: Next.js 16, React 19, Tailwind v4, ESLint/Prettier/Husky chain, anti-slop hooks.

## Migration matrix

### KEEP (content)
- `src/data/projects.ts` — all project metadata: title, subtitle, slug, tags, projectUrl, year, role, client, stack
- All case study text bodies
- All case study images (`/public/images/...`, project galleries)
- All case study videos (MP4s)
- `text-block`, `media-block`, `video-block`, `spotlight-block` block types — these are theme-neutral

### KILL
- All 19 atmospheric shaders (`src/components/shaders/*Material.ts` — Woodcut, Alpine, Camp, Forest, Sumi, Paper, Water, Fire, Cloud, Dawn, Night, Grove, Silhouette, Ground)
- All trail/atmosphere assets (`/public/forest/`, `/public/alpine/`, `/public/camp/`, `/public/grove/`, `/public/cairn/`, `/public/trail-fork/`, `/public/home-hero/`, animal sprites — fox/bunny/bird, parallax layers)
- Audio assets (`/public/audio/`)
- Trail-themed components: `HeroLandscape`, `DeepForest`, `CaseStudyScene`, `UnifiedScene`, `ScrollLinkedSprite`, `PaperAtmosphere*`, etc.
- `moduleTimeline.ts` — replaced by simpler stacked-panel choreography
- `TRAIL_STATIONS` constant + `StationBreak`, `SpecimenBlock`, `FriezeBlock`, `MastheadBlock` types
- `eggs/` system (trail-themed easter eggs) — replaced with new ones inside the dispersive lens
- `Preloader.tsx` topographic altitude animation
- The custom cursor (replaced with dispersive-lens cursor)

### TRANSFORM
- `src/lib/heroParams.ts`, scroll math helpers — replaced with Lenis + GSAP store
- Custom cursor → refractive-lens cursor
- 5-station case study spine → numbered free-form chapters

## Implementation phases

### Phase 0 — branch & scaffold ✅ shipped (commit `9c73245`)
Trail theme stripped, theme-neutral scaffold compiles, archive branch pushed.

### Phase 1 — signature material ✅ shipped (commits `019ae78`–`11a180f`)
- ✅ Fraunces TTF + drei Text3D + opentype.js typeface.json bake script
- ✅ MeshTransmissionMaterial baseline for A/B
- ✅ Custom per-channel IOR via three-custom-shader-material extending MeshPhysicalMaterial
- ✅ rygcbv 6-channel spectral split (Petrick → Heckel) with 1/2/3 keyboard mode toggle
- ✅ Cursor velocity coupling via useMouseVelocity + self-decaying rAF loop
- ✅ Back-face thickness FBO + Beer-Lambert absorption (per-mesh material swap, no scene.overrideMaterial)
- ✅ 10% viscous undertone (multi-axis sin/cos breath)
- ✅ Leva live-tune panel (IOR, refract/fresnel/saturation/absorption/breath) + studio HDRI on all modes
- ✅ Soft 5-blob radial-gradient backdrop replaces test-card stripes
- 🟡 Validate against bar (Roman Jean-Elie / Codrops glass torus / Anatole) — *user visual review remaining*

### Phase 2 — refractive cursor (1 sitting) — *not started*
- Title-layer render-to-RT
- Cursor as small WebGL plane with same lens math, sampling RT
- Smoothed cursor velocity → dispersion strength uniform
- Magnetic snap to interactive elements via DOM event handoff

### Phase 3 — homepage 3D + persistent canvas (1–2 sittings) — *not started*
- Persistent Canvas in root layout
- Lenis + ReactLenis + GSAP ScrollTrigger plumbing
- Hero panel: 3D dispersive type + cursor lens
- Selected Work grid: per-project tile material with hover deformation
- Scroll-progress numeric in corner
- Next.js View Transitions API (Canvas wrapped in `viewTransitionName: 'none'`)

### Phase 4 — case study template ✅ shipped (commits `1c626be`–`ed51489`)
- ✅ Schema migration: ChapterBlock replaces station/specimen/frieze/metric/masthead; openingQuote/signatureLandmark/TRAIL_STATIONS dropped
- ✅ Per-project block migration (4 case studies, ~17 blocks each, all theme-neutral; year/role/client/deliverables filled with drafts to tighten)
- ✅ Eight render components (`CaseStudyHero`, `ChapterMark`, `TextBlockRender`, `MediaBlockRender`, `VideoBlockRender`, `SpotlightSlot`, `BlockRenderer`, `NextProject`)
- ✅ Spotlight registry (CraftedKitPipelineSpotlight, NewBelgiumSpotlight) wired via dynamic import + ssr:false
- ✅ Instrument Serif font wired up via next/font
- ✅ NextProject full-bleed reveal footer (per 2026 dominant pattern from research)
- ✅ Reveal wrapper (framer-motion in-view fade + blur) on every block
- ✅ Homepage: editorial 2-column grid w/ thumbnails, mono index/year strip, Fraunces title, Instrument subtitle
- ✅ Dual-track `/work/[slug]/lab` sub-route for backstage notes (CraftedKit + New Belgium have content; others 404 — only depth-warranted projects get a lab)
- ⚠ Note: year/role/client placeholders are *drafts* — verify before shipping public

### Phase 5 — final polish (1 sitting) — *partial; remaining items*
- ⏳ 404 with the dispersion signature
- ⏳ Loading state
- ⏳ Site footer (currently minimal copyright line on home only)
- ⏳ Easter eggs
- ⏳ Section name decision: `Selected Work` vs `Field Notes` / `Drops` / `Work / 12`

## Branch plan (RESOLVED)

- **Trail-theme code preserved on `archive/trail-theme`** (pushed to origin, permanent reference).
- **Redesign work happens directly on `staging`** going forward.
- Strategy: aggressive delete of KILL list in Phase 0 on `staging` → keep only infrastructure (Next config, ESLint, Husky, package.json, Tailwind, anti-slop hooks) + content (projects.ts data, case study assets).
- Rollback: `git checkout archive/trail-theme` recovers everything.

## Open questions for Sam

1. ~~Plan directionally right?~~ ✅ Confirmed.
2. ~~Branch strategy?~~ ✅ Archive at `archive/trail-theme`; redesign on `staging`.
3. `Selected Work` section rename — `Field Notes` / `Drops` / `Work / 12` / something else? *(can be tuned later, not blocking)*
4. ~~`/backstage` route name?~~ ✅ `/lab`.

## Reference dump (curated, not exhaustive)

### Direct architectural matches
- Roman Jean-Elie portfolio (Codrops Nov 2025): https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/
- Stefan Vitasović portfolio (Codrops Mar 2025): https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/
- Arnaud Rocca portfolio (Codrops Mar 2026): https://tympanus.net/codrops/2026/03/31/arnaud-roccas-portfolio-from-a-gsap-powered-motion-system-to-fluid-webgl/
- Corentin Bernadou portfolio (Codrops Mar 2026): https://tympanus.net/codrops/2026/03/05/inside-corentin-bernadous-portfolio-swiss-inspired-layouts-webgl-geometry-and-thoughtful-motion/

### Signature material references
- Codrops "Warping 3D Text Inside a Glass Torus" (Mar 2025): https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
- Maxime Heckel "Refraction, dispersion": https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/
- Taylor Petrick "Simulating Dispersion": https://taylorpetrick.com/blog/post/dispersion-opengl
- drei MeshTransmissionMaterial source: https://github.com/pmndrs/drei/blob/master/src/core/MeshTransmissionMaterial.tsx
- Codrops Anatole Touvron case study: https://tympanus.net/codrops/2022/01/14/case-study-anatole-touvrons-portfolio/
- ShaderToy liquid glass (viscous undertone): https://www.shadertoy.com/view/WccXDj

### Cursor lens
- Ben Godfrey 3D cursor DOM refraction: https://www.awwwards.com/inspiration/3d-cursor-dom-refraction-link-hover-animation-ben-godfrey-selected-work
- Dorian Lods refraction hover: https://www.awwwards.com/inspiration/webgl-refraction-hover-effect-dorian-lods-portfolio-2025
- Codrops "Progressively Enhanced WebGL Lens": https://tympanus.net/codrops/2023/10/10/progressively-enhanced-webgl-lens-refraction/
- Codrops mouse flowmap (OGL): https://tympanus.net/codrops/2019/09/25/mouse-flowmap-deformation-with-ogl/

### Stack & architecture
- pmndrs/react-three-next (persistent canvas template): https://github.com/pmndrs/react-three-next
- pmndrs/tunnel-rat: https://github.com/pmndrs/tunnel-rat
- 14islands/r3f-scroll-rig: https://github.com/14islands/r3f-scroll-rig
- Lenis: https://www.lenis.dev/
- Codrops "Composite Rendering" (Feb 2026): https://tympanus.net/codrops/2026/02/23/composite-rendering-the-brilliance-behind-inspiring-webgl-transitions/
- Next.js viewTransition config: https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition

### Text rendering
- drei `<Text>`: https://drei.docs.pmnd.rs/abstractions/text
- troika createDerivedMaterial: https://protectwise.github.io/troika/troika-three-utils/createDerivedMaterial/
- THREE-CustomShaderMaterial: https://github.com/FarazzShaikh/THREE-CustomShaderMaterial
- countertype/three-text: https://github.com/countertype/three-text
- msdf-bmfont-web: https://msdf-bmfont.donmccurdy.com/

### Senior creative engineer peers
- Anatole Touvron: https://anatoletouvron.fr
- Henry Heffernan: https://henryheffernan.com
- Maxime Heckel: https://maximeheckel.com
- Rauno Freiberg: https://rauno.me
- Robin Noguier: https://robin-noguier.com
- Cody Bennett: https://codyb.co
- Robin Mastromarino: https://www.awwwards.com/sites/robin-mastromarino-portfolio-1

### Agency benchmarks
- Active Theory: https://activetheory.net
- Lusion: https://lusion.co
- Immersive Garden (Awwwards Agency 2025): https://immersive-g.com
- Malvah Studio (Awwwards Studio 2025): https://malvah.co
- Hello Monday: https://hellomonday.com
- Watson DG: https://watsondg.com
- Tendril: https://tendril.studio

### Microcopy / IA
- Rauno: https://rauno.me
- Linear: https://linear.app
- Anyways Studio: https://anyways.studio
- Bonhomme: https://bonhomme.lol
- Hello Monday (4-bucket contact): https://hellomonday.com

### Typography
- Fraunces: https://fonts.google.com/specimen/Fraunces (OFL)
- Newsreader: https://fonts.google.com/specimen/Newsreader (OFL, Production Type)
- Instrument Serif: https://fonts.google.com/specimen/Instrument+Serif (OFL)
- Geist Sans: https://vercel.com/font (OFL)
- Geist Mono: https://fonts.google.com/specimen/Geist+Mono (OFL)
