# Case Study Page Redesign

Craft-forward scrollytelling case studies with trail-themed framing and bespoke spotlight slots.

## Phase 1: Foundation (DONE)

- [x] 1. Define typed block data model in `projects.ts`
- [x] 2. Migrate existing project content into the new block structure
- [x] 3. Kill the modal intercept route, add scroll position preservation on return
- [x] 4. Build the shared case study skeleton component (scrollytelling framework)
- [x] 5. Capture video recordings and screenshots for all projects
- [x] 6. Compress/convert assets (MP4 <5s, WebP statics)
- [x] 7. Write and humanize copy for all 4 projects
- [x] 8. Wire blocks, assets, and copy into `projects.ts`
- [x] 9. Frostier glass panels (bumped to bg-background/93)

## Phase 2: Atmosphere & Hero (CURRENT)

- [x] 10. **E — Velocity-reactive paper texture atmosphere**
  - PaperAtmosphereMaterial GLSL shader (simplex noise, fBm, fiber texture)
  - CaseStudyScene R3F canvas, fullscreen quad at z=-10 (depth-scaled)
  - Scroll velocity drives directional ripple + grain stretch
  - Per-project accent color watercolor seep from edges
- [x] 11. **H — Generative trail hero (parallax scroll-through)**
  - 130vh header, 3 parallax layers (bg/mid/fg) with depth-aware sizing
  - Per-project biomes: NB, CK, MB, CC with unique landmark compositions
  - WoodcutMaterial + uPaperOpacity for transparent paper, per-layer ink opacity
  - Desktop: mouse hover watercolor + gentle ambient sway
  - Mobile: scroll-velocity wind + scroll-position watercolor
  - Sticky title at top-[55vh], timestamp-seeded daily layout variation
  - **Needs visual tuning pass** (element positions, opacity balance)

## Phase 2.5: Monochrome Sweep & Hero Rework (CURRENT)

Strip all per-project color accents in favor of strict black-and-white via theme tokens
(`#18181b` foreground / `#f9fafb` background). Rework the case study parallax hero to
be a pure 100vh woodblock-print moment — keep the commissioned assets, but dial them
in so they actually read. Title/subtitle/tags move out of the hero frame into a new
`masthead` block at the top of the content flow. Paper atmosphere shader retracts to
hero-only scope so the moment has a clean end at 100vh. Mouse interactivity killed
in favor of a quieter ambient scene.

Grilled decisions:
- Vibe: **Woodblock print** (high-contrast ink-on-paper, authored composition)
- Hero structure: **Pure 100vh visual moment**, no text competing
- Paper shader scope: **Hero-only** (fades at 100vh, content scrolls on clean bg)
- Biome density: **Trim each biome from 9 → 6 elements** (kill redundancies, keep depth hierarchy)
- Mouse: **Kill vertex push + watercolor injection**, only time-driven wind sway remains
- Parallax speeds: **Soften to 0.15 / 0.45 / 0.9** (cinematic, less demo-like)
- Masthead: **New `MastheadBlock` marker** (empty `{ type: 'masthead' }`, renderer reads from project root)

### A. Strip color — everything becomes theme-token b&w

- [x] A1. Delete `ProjectPalette` interface and `palette` field from `Project` in `projects.ts`
- [x] A2. Delete `palette: {...}` from all 4 projects
- [x] A3. `useAppStore` — change transition default color from `#09090b` → `#18181b` (foreground token)
- [x] A4. `CaseStudyCard.handleLinkClick` — drop palette lookup, always pass `#18181b` to `startTransition`
- [x] A5. `work/[slug]/page.tsx` — remove `accentColor` prop passed to `CaseStudyScene`
- [x] A6. `CaseStudyScene.tsx` — remove `accentColor` prop from component + `AtmosphereLayer`
- [x] A7. `HeroLandscape.tsx` — remove `accentColor` prop + `colorWater` memo
- [x] A8. `CaseStudyContent.tsx` — remove `--cs-accent` / `--cs-accent-muted` CSS var injection from article `style`

### B. Woodblock tuning — make the assets actually read

- [x] B1. `WoodcutMaterial.ts` fragment — delete watercolor math (`waterRadius`, `sunRadius`, `flow`, `injectedPaperColor`). `finalColor = mix(uColorPaper, uColorBase, inkIntensity)` only.
- [x] B2. `WoodcutMaterial.ts` vertex — delete mouse-push math (`worldMouse`, `distToMouse`, `mousePush`, `pushDir`, `pos.x += pushDir.x * mousePush; pos.z -= mousePush * 0.5;`). Keep wind sway.
- [x] B3. `WoodcutMaterial.ts` uniforms — remove `uColorWater`, `uColorSun`, `uColorAlt`, `uMouse`. Defaults `uColorBase = #18181b`, `uColorPaper = #f9fafb`.
- [x] B4. `heroAssets.ts` — `LAYER_OPACITY` `{bg:0.2, mid:0.3, fg:0.4}` → `{bg:0.65, mid:0.8, fg:0.92}`
- [x] B5. `heroAssets.ts` — `LAYER_PAPER_OPACITY` all → `0` (single paper source via atmosphere shader)
- [x] B6. `heroAssets.ts` — `LAYER_SPEED` `{bg:0.3, mid:0.6, fg:1.0}` → `{bg:0.15, mid:0.45, fg:0.9}`
- [x] B7. `heroAssets.ts` — trim `new-belgium`: drop cumulus cluster, trail marker, hop vine
- [x] B8. `heroAssets.ts` — trim `mission-bell`: drop cumulus cluster, trail marker, dead tree snag
- [x] B9. `heroAssets.ts` — trim `corners-and-coasts`: drop wispy stratus, trail marker, jagged outcrop
- [x] B10. `heroAssets.ts` — trim `crafted-kit`: drop wispy stratus, trail marker, jagged outcrop
- [x] B11. `heroAssets.ts` — set `xVariance: 0` on all remaining elements (locked composition)
- [x] B12. `HeroLandscape.tsx` — drop `xOffset` randomization (always 0 now)
- [x] B13. `PaperAtmosphereMaterial.ts` — remove `uAccentColor` uniform entirely
- [x] B14. `PaperAtmosphereMaterial.ts` fragment — delete watercolor edge seep (`edgeL/R/T/B`, `edgeMask`, `bleedNoise`, `bleedShape`, `bleedStrength`, `watercolorTint`)
- [x] B15. `PaperAtmosphereMaterial.ts` fragment — delete velocity fiber stretch + wind ripple (keep only time-driven `fbm` fiber grain + speckle)
- [x] B16. `PaperAtmosphereMaterial.ts` fragment — delete warm color shift (`color.r += 0.005; color.g += 0.002;`)
- [x] B17. `PaperAtmosphereMaterial.ts` — `uPaperColor` default `#f9fafb` (bg token), `uInkColor` stays `#18181b`
- [x] B18. `CaseStudyScene.tsx` — drop `uVelocity` wiring to paper shader, drop `velocity` prop chain if no other consumer
- [x] B19. `HeroLandscape.tsx` — drop `mouse` prop chain to `WoodcutSprite`
- [x] B20. `CaseStudyScene.tsx` — remove `handleMouseMove`, `mouseRef`, `<div onMouseMove>` handler, `useVelocity`, `useSpring` plumbing if unused

### C. Hero structure — pure 100vh moment, canvas fades past it

- [x] C1. `CaseStudyContent.tsx` — delete the sticky 130vh `<header>` entirely
- [x] C2. `CaseStudyScene.tsx` — fade Canvas opacity to 0 as `scrollY` crosses 100vh (keeps fixed positioning, just makes it invisible past the moment)
- [x] C3. `CaseStudyScene.tsx` — `heroHeight = window.innerHeight * 1.3` → `* 1.0` so `scrollProgress` tracks 0→1 across exactly one viewport
- [x] C4. `HeroLandscape.tsx` — tighten hero fade smoothstep `(0.75, 1.0)` → `(0.8, 1.0)` so fade finishes before content arrives
- [x] C5. Verify `BackToTrail` overlay positioning still works over the new hero

### D. Masthead block (empty marker pattern)

- [x] D1. `projects.ts` — add `interface MastheadBlock { type: 'masthead' }` (no data)
- [x] D2. `projects.ts` — add `| MastheadBlock` to `ContentBlock` union
- [x] D3. `projects.ts` — insert `{ type: 'masthead' }` at `blocks[0]` of all 4 projects
- [x] D4. `CaseStudyContent.tsx` — add `MastheadBlockRenderer({ project })` component (reuses markup from deleted hero header, sans sticky positioning)
- [x] D5. `CaseStudyContent.tsx` — `BlockRenderer` signature gains `project` prop
- [x] D6. `CaseStudyContent.tsx` — add `case 'masthead': return <MastheadBlockRenderer project={project} />` to switch
- [x] D7. Update `blocks.map` call site to pass `project` through

### E. Verification

- [x] E1. `npm run guardrails` (format, lint, typecheck, build)
- [ ] E2. Visual check all 4 case studies: hero is pure woodblock at 100vh, b&w, content starts cleanly below
- [ ] E3. Visual check ink-wash card-click transition: foreground-token dark ink, no per-project color
- [ ] E4. Visual check back-to-trail reverse transition
- [ ] E5. Verify reduced-motion still gracefully skips the transition animation

---

## Phase 3: Media & Navigation

- [x] 12. **A — Woodcut border dissolve on media blocks**
  - WoodcutBorder component: torn-edge mask, scroll-driven dissolve inward
  - Tinted with `--cs-accent`, applied to MediaBlockRenderer only
- [x] 13. **F — Topographic elevation profile progress indicator**
  - ElevationProfile component: SVG path from block density, glowing dot, chapter waypoints
  - Accent-colored active portion, fixed right sidebar (desktop only)

## Phase 3.5: Field Journal content layout (CURRENT)

Reframe case studies from "centered column of blocks" into a printed field journal
with five named trail stations, a scroll-drawn trail line in the margin, specimen
marginalia lifted from the 24 old hero sprite assets, and authored pacing moments
(horizontal frieze, cinemascope breakout). Every layout decision flows from one
metaphor: you're reading an expedition log, not a web article.

### Locked decisions
- Metaphor: **Field journal / expedition trail log**
- Structure: **5 named stations** — Trailhead, Ascent, Ridge, Summit, Descent
- Grid: **12-col asymmetric** — text in 5–6 col swings, media full-bleed via negative margin, marginalia in outer rail
- Trail spine: **vertical SVG path draw in left margin**, scroll-driven, waypoint dots replaced by `trail-marker-signpost.webp` sprites
- Typography: **display serif + sans metadata**, Roman numerals for station marks, `Fig. N` captions, 5-line drop caps on post-station paragraphs
- Asset reuse: **all 24 old sprite assets reborn as specimens, landmarks, chapter backdrops, friezes, and ornaments** (see asset map below)
- Counter: **running `07 / 24` case-study index** fixed bottom-right, replaces `ElevationProfile` as the progress indicator
- Breakouts per case study: **1 horizontal specimen frieze + 1 full-bleed cinemascope shot + 1 sticky metric counter**

### Asset integration map (old sprite → new role)

| Asset bucket | Files | New role in Field Journal |
|---|---|---|
| Station markers | `trail-marker-signpost.webp` | Waypoint dot sprites on TrailSpine + running counter icon |
| Specimen marginalia | `pine-tree-dense.webp`, `dead-tree-snag.webp`, `rock-boulder-cluster.webp`, `rock-jagged-outcrop.webp`, `wildflower-meadow-strip.webp` | Small sprites in outer margin w/ `Fig. N` + italic Latin label |
| Weather ambients | `cloud-cumulus-cluster.webp`, `cloud-wispy-stratus.webp` | Slow horizontal drift at station footers; CSS infinite translate |
| Terrain backdrops | `ridgeline-distant.webp`, `ridgeline-close.webp`, `terrain-rocky-trail.webp`, `terrain-rolling-hillside.webp` | Watermarks behind long text blocks at 5–8% opacity |
| Per-project landmark | `nb-rustic-cabin.webp`, `ck-crystalline-formation.webp`, `mb-mission-bell-tower.webp`, `cc-lighthouse.webp` | Washed at 10% opacity behind Station III "The Ridge" header per project |
| Secondary landmarks | `nb-hop-vine.webp`, `ck-circuit-fern.webp`, `mb-desert-mesa.webp`, `cc-coastal-cliff.webp` | Marginalia specimens specific to that case study |
| Ink-wash transitions | `ink-wash-horizontal.webp`, `ink-wash-vertical.webp` | Full-width dividers between stations at 30% opacity |
| Border masks | `border-organic-edge.webp`, `border-torn-edge.webp` | CSS mask on media blocks + spotlight frames (polaroid effect) |

### A. Data model — station vocabulary + specimen blocks

- [ ] A1. `projects.ts` — rename `TRAIL_CHAPTERS` from 4-chapter to 5-station: `['Trailhead', 'Ascent', 'Ridge', 'Summit', 'Descent']`
- [ ] A2. `projects.ts` — replace `ChapterBreak` with `StationBreak` block type: `{ type: 'station', roman: 'I'|'II'|'III'|'IV'|'V', title: string, subtitle?: string }`
- [ ] A3. `projects.ts` — add `SpecimenBlock`: `{ type: 'specimen', src: string, figNumber: string, label: string, side?: 'left'|'right' }`
- [ ] A4. `projects.ts` — add `FriezeBlock`: `{ type: 'frieze', specimens: string[], title?: string }`
- [ ] A5. `projects.ts` — add `MetricBlock`: `{ type: 'metric', value: string, unit?: string, label: string }`
- [ ] A6. `projects.ts` — add `openingQuote: string` and `signatureLandmark: string` to `Project` interface
- [ ] A7. `projects.ts` — rewrite `blocks[]` for all 4 projects into 5-station narrative (see K)

### B. Specimen catalog + asset helper

- [ ] B1. New `web/src/lib/specimenCatalog.ts` — typed catalog mapping 24 sprite filenames → `{ role, defaultLabel, slug? }`
- [ ] B2. Helper `getSpecimensForProject(slug)` returns the ordered list of specimen sprites appropriate for that project (mix of shared nature + per-project secondary landmarks)

### C. Trail spine — scroll-drawn SVG path in left margin

- [ ] C1. New `web/src/components/TrailSpine.tsx` — fixed left-margin SVG, desktop-only (`hidden lg:block`)
- [ ] C2. Scroll-driven `pathLength` via `useScroll` + Framer Motion `useTransform` on `strokeDashoffset`
- [ ] C3. 5 waypoint dots positioned by station ownership percentages; active dot fills as scroll passes
- [ ] C4. Replace `ElevationProfile` with `TrailSpine` in `CaseStudyContent.tsx`

### D. Station break renderer — the named chapter head

- [ ] D1. New `StationBreakBlock` component: outline Roman numeral (180px+, foreground/10) floating in outer margin, display-serif title at 72px, optional subtitle, 1px full-width rule above, 40vh breathing room
- [ ] D2. Station III specifically renders `project.signatureLandmark` at 10% opacity as a full-width background behind the header
- [ ] D3. First `<p>` after any station break gets a 5-line drop cap via CSS `::first-letter`

### E. Asymmetric grid

- [ ] E1. `CaseStudyContent.tsx` root wrapper → `grid grid-cols-12 gap-x-6 px-6 md:px-16 max-w-[88rem] mx-auto`
- [ ] E2. `TextBlockRenderer` — `col-span-6` alternating `col-start-2` / `col-start-7` by block index. Drop frosted glass panel. Use serif body, generous leading.
- [ ] E3. `MediaBlockRenderer` — default `col-span-10 col-start-2`; `fullBleed` becomes `col-span-12 -mx-6 md:-mx-16`
- [ ] E4. `VideoBlockRenderer` — same rules as media
- [ ] E5. Outer-margin specimen rail lives at `col-start-1` (left side) or `col-start-12` (right side) via `SpecimenBlock.side`

### F. Block upgrades — editorial flourishes

- [ ] F1. `TextBlockRenderer` — drop frosted glass panel, replace with `prose prose-editorial` (Tailwind v4 typography plugin or custom). Serif body, generous leading, no bg container.
- [ ] F2. `MediaBlockRenderer` — add `Fig. N` small-caps caption ABOVE image + italic description BELOW, right-aligned flush to image edge
- [ ] F3. `MastheadBlockRenderer` rework:
  - Opening italic quote from `project.openingQuote` BEFORE title (Rally National Parks pattern)
  - All-caps stacked metadata `CLIENT / ROLE / YEAR` underneath title
  - Title in display serif at 7–8rem
  - No more frosted glass container
- [ ] F4. `SpotlightBlockRenderer` — wrap in `border-torn-edge.webp` CSS mask for a polaroid-pasted-in-journal feel
- [ ] F5. New `SpecimenBlockRenderer` — places specimen sprite in outer margin w/ `Fig. N` label + italic description
- [ ] F6. New `FriezeBlockRenderer` — sticky horizontal scroll section, tiles at 60vw each, translateX driven by inner scroll progress
- [ ] F7. New `MetricBlockRenderer` — sticky full-viewport counter, scroll-driven number count-up, `wildflower-meadow-strip.webp` at the bottom

### G. Typography system

- [ ] G1. Verify `font-instrument` (Instrument Serif) is already loaded; if not add `@font-face` or next/font for display serif
- [ ] G2. `globals.css` — add `.drop-cap-5` utility for 5-line dropped first letter
- [ ] G3. `globals.css` — add `.fig-caption` utility for italic right-aligned figure captions
- [ ] G4. Define display scale tokens: `text-display-1` (96px) through `text-display-4` (32px)

### H. Running counter

- [ ] H1. New `TrailCounter.tsx` — fixed bottom-right, renders `{projectIndex}` / `{totalProjects}` w/ a `trail-marker-signpost.webp` icon
- [ ] H2. Mounts into `CaseStudyContent` top-level

### I. Ambient flourishes

- [ ] I1. Between each station: full-width `ink-wash-horizontal.webp` at 30% opacity as transition ornament
- [ ] I2. Long text blocks: optional terrain watermark sprite at 5% opacity behind content

### J. Project data — rewrite blocks for 5-station narrative

- [ ] J1. For each of 4 projects, rewrite `blocks[]`:
  - **Station I Trailhead**: masthead + 1 text block
  - **Station II Ascent**: station break + 2 text blocks + horizontal frieze + 2 specimen marginalia
  - **Station III Ridge**: station break + 1 cinemascope + 1 video + 1 text + 2 specimen marginalia
  - **Station IV Summit**: station break + 1 spotlight + 1 text
  - **Station V Descent**: station break + 1 metric + 1 text + 1 specimen marginalia
- [ ] J2. Write `openingQuote` for each project (1-line italic hook)
- [ ] J3. Assign `signatureLandmark` per project (NB cabin, CK crystals, MB bell tower, CC lighthouse)
- [ ] J4. Pick per-project specimen mix from the catalog (each project gets 5–7 specimens across the page)

### K. Verification

- [ ] K1. `npm run guardrails` (format, lint, typecheck, build)
- [ ] K2. Visual QA each of 4 case studies desktop + mobile
- [ ] K3. Verify trail spine draws correctly, waypoints align to stations
- [ ] K4. Verify reduced-motion gracefully skips kinetic effects

---

## Phase 3.6: Mobile hero + flat shader (CURRENT)

Hot-swap portrait mobile hero assets for the 4 case studies on phone-size viewports,
strip all vertex-level distortion out of `WoodcutMaterial` (commented out, not deleted,
so it's togglable for A/B), and replace mouse-based watercolor on mobile with
press-to-activate touch interaction on all heroes.

### Locked decisions (via /grill-me)

1. **Vertex effects to kill** — all three: time sway (`uWind` sin), mouse push (radial
   vertex shove from cursor), and luminance-based Z pop. Commented out with a clear
   header so toggling back is one uncomment.
2. **Mobile breakpoint** — `(max-width: 767px)` via `window.matchMedia`, matches
   Tailwind's `md:` fault line used everywhere else in the project.
3. **Fit mode** — unchanged `contain @ 1.2×` in `HeroLandscape.tsx` for both desktop
   and mobile. Portrait asset ≈ portrait viewport aspect ratio, so contain naturally
   fills the screen without letterbox gaps. No second fit mode, no branching.
4. **Touch scope** — press-to-activate watercolor on **all** heroes (homepage
   `UnifiedScene.tsx` ParallaxLayer + case studies `HeroLandscape.tsx`). Desktop
   `mousemove` listener unchanged; touch listeners are additive, gated by media query.
5. **Touch feel** — **A + C**: snap `uMouse` to touch position on `touchstart`
   (instant appearance), lerp toward off-screen `(10, 10)` on `touchend` (natural
   fade-in-place because `waterRadius = smoothstep(1.5, 0.0, distToMouse)` goes
   to zero as uMouse moves away).
6. **Mobile homepage hero** — `bg_layer.webp` stays as-is (no mobile variant provided).
   Touch interaction still wires up; just the texture doesn't swap.

### A. Shader — comment out all vertex distortion

- [ ] A1. `WoodcutMaterial.ts` vertex shader — wrap time sway block
      (`swayBlend`, `wind`, `pos.x += wind`, `pos.y += wind * 0.2`) in a comment
      block with header `/* ── VERTEX EFFECTS DISABLED — uncomment to re-enable ── */`
- [ ] A2. Same block — wrap mouse push math (`worldMouse`, `distToMouse`, `mousePush`,
      `pushDir`, `pos.x += pushDir.x * mousePush`, `pos.z -= mousePush * 0.5`)
- [ ] A3. Same block — wrap luminance Z pop (`texData`, `lum`, `displacement`, `pos.z += displacement`)
- [ ] A4. Keep `vDisplacement = 0.0` passthrough so the fragment shader's unused
      varying doesn't error
- [ ] A5. Keep `vWorldPos = pos.xy` (still used by fragment watercolor distance calc)

### B. Mobile asset pipeline

- [ ] B1. `cwebp -q 88 -m 6 ~/Desktop/nbb-mobile.png -o web/public/assets/graphics/case-study-heroes/new-belgium-mobile.webp`
- [ ] B2. `cwebp -q 88 -m 6 ~/Desktop/crafted-mobile.jpeg -o web/public/assets/graphics/case-study-heroes/craftedkit-mobile.webp`
- [ ] B3. `cwebp -q 88 -m 6 ~/Desktop/mission-bell-mobile.jpeg -o web/public/assets/graphics/case-study-heroes/mission-bell-mobile.webp`
- [ ] B4. `cwebp -q 88 -m 6 ~/Desktop/Consume-mobile.jpeg -o web/public/assets/graphics/case-study-heroes/consume-and-create-mobile.webp`
- [ ] B5. Verify all 4 new webp files land in the expected folder and are reasonable size

### C. Asset wiring — parallel mobile map

- [ ] C1. `lib/heroAssets.ts` — add `HERO_SCENES_MOBILE: Record<string, string>`
      parallel to `HERO_SCENES`, keyed by the same 4 slugs
- [ ] C2. `lib/heroAssets.ts` — export `DEFAULT_HERO_MOBILE` fallback

### D. HeroLandscape — media-query-driven texture swap

- [ ] D1. `HeroLandscape.tsx` — new `useIsMobile()` hook (or inline): SSR-safe
      `window.matchMedia('(max-width: 767px)')` with change listener, returns
      boolean. Starts `false` on server, resolves on mount.
- [ ] D2. `HeroLandscape.tsx` — in `HeroPlane`, pick texture URL via
      `isMobile ? HERO_SCENES_MOBILE[slug] ?? DEFAULT_HERO_MOBILE : HERO_SCENES[slug] ?? DEFAULT_HERO`
- [ ] D3. Verify `useTexture` properly re-suspends + reloads when URL changes on
      media-query flip (drei should handle this natively via the Suspense boundary
      already wrapping `HeroPlane`)

### E. Press-to-activate touch — HeroLandscape (case study heroes)

- [ ] E1. `HeroLandscape.tsx` — new `useEffect` that attaches passive
      `touchstart/touchmove/touchend` to `window` when mobile, cleanup on unmount
- [ ] E2. On `touchstart`: read `touches[0].clientX/Y`, snap `mousePos.current` to
      normalized (-1..1) coords (bypass lerp)
- [ ] E3. On `touchmove`: update a `touchTarget` ref (lerp picks it up in useFrame)
- [ ] E4. On `touchend`: set `touchTarget` to `(10, 10)` — far off-screen so
      watercolor naturally shrinks to zero via smoothstep
- [ ] E5. Gate mouse listener: only attach `mousemove` if NOT mobile
      (avoids listener coexistence confusion)
- [ ] E6. Update `useFrame` to lerp `mousePos.current` toward `touchTarget.current`
      on mobile (replaces existing single-source-of-truth lerp)

### F. Press-to-activate touch — UnifiedScene homepage hero

- [ ] F1. `UnifiedScene.tsx` ParallaxLayer — mirror the same `isMobile` +
      touch listener pattern from E1–E6
- [ ] F2. Keep the existing `mousemove` listener on desktop unchanged
- [ ] F3. Note: no texture swap needed (no mobile `bg_layer.webp` asset),
      only the touch interaction wiring

### G. Verification

- [ ] G1. `npm run guardrails` (format, lint, typecheck, build) — must be green
- [ ] G2. Desktop visual: case study heroes are rock-steady (no wind, no cursor
      shove on vertices), watercolor still follows cursor fluidly
- [ ] G3. Desktop visual: homepage hero parallax layer also rock-steady, watercolor
      still follows cursor
- [ ] G4. Mobile visual (device or chrome devtools 375w): case study hero shows
      the correct portrait asset, fills the viewport, touch-and-drag paints
      watercolor, lifting finger fades it out in place
- [ ] G5. Mobile visual: homepage hero touch-and-drag paints watercolor on the
      parallax layer
- [ ] G6. Quick A/B: uncomment the vertex block in `WoodcutMaterial.ts`, confirm
      wind sway comes back, re-comment to lock in the flat behavior

---

## Phase 4: Transitions

- [ ] 14. **D — Watercolor bleed chapter wipes**
  - Overlay flow, no scroll pinning
  - Accent color bleeds across viewport as fixed overlay
  - Content continues scrolling beneath the wash
  - Per-chapter hue variation from project palette
  - Velocity-responsive: fast scroll = quick wash, slow = lingers
- [x] 15. **B — Ink wash page transition (homepage → case study)**
  - InkWashTransition component: click-origin radial spread, 0.7s enter / 0.6s exit
  - ink-wash-horizontal.webp as CSS mask, tinted with project accent color
  - Zustand transition state (entering/exiting), router.push on enter complete
  - BackToTrail reverse transition with dark ink
  - Graceful fallback: native Link still works if JS fails

## Phase 5: Spotlight Slots

- [ ] 16. New Belgium theme-switcher interactive demo
- [ ] 17. CraftedKit pipeline diagrams (Claude workflow — need to create net new)
- [ ] 18. Mission Bell spotlight (GSAP transition replay/scrubber)
- [ ] 19. C&C spotlight (performance metrics visualization)

## Phase 6: Polish

- [ ] 20. Homepage canvas teardown on case study navigate, rebuild on return
- [ ] 21. Progressive enhancement (capability detection, fallbacks)
- [ ] ~~22. Per-project color palettes fully applied~~ — abandoned, superseded by Phase 2.5 (strict monochrome)

## Review — Phase 2.5 implementation (2026-04-11)

### What changed

**Data model (`projects.ts`)**
- Deleted `ProjectPalette` interface and `palette?` field from `Project`
- Added `MastheadBlock = { type: 'masthead' }` empty marker type to the `ContentBlock` union
- Inserted `{ type: 'masthead' }` at `blocks[0]` of all 4 projects
- Removed `palette: { ... }` from all 4 projects

**Transition store (`useAppStore.ts`)**
- Default `transitionColor` changed `#09090b` → `#18181b` (foreground token)

**Shader materials**
- `WoodcutMaterial.ts` rewritten: removed `uColorWater`, `uColorSun`, `uColorAlt`, `uMouse` uniforms; deleted fragment watercolor injection math; deleted vertex mouse-push math; now a pure ink-on-paper mix using theme tokens only. Wind sway + Z displacement preserved.
- `PaperAtmosphereMaterial.ts` rewritten: removed `uAccentColor` + `uVelocity`; deleted watercolor edge seep, velocity fiber stretch, wind ripple, warm color shift. Now just time-driven `fbm` fiber grain + subtle speckle on theme tokens.

**Biome config (`heroAssets.ts`)**
- `LAYER_OPACITY` 0.2/0.3/0.4 → 0.65/0.8/0.92 (ink actually reads now)
- `LAYER_PAPER_OPACITY` → all zero (only the atmosphere shader contributes paper)
- `LAYER_SPEED` 0.3/0.6/1.0 → 0.15/0.45/0.9 (softened parallax)
- All biomes trimmed from 9 → 6 elements, `xVariance: 0` on every element (authored composition)
- **Latent bug fix:** biome keys renamed from `'crafted-kit'` → `craftedkit` and `'corners-and-coasts'` → `'consume-and-create'` so the slug lookup actually hits the right biome. Before this, half the case studies were falling back to the new-belgium biome.

**Scene components**
- `HeroLandscape.tsx`: dropped `accentColor`, `scrollVelocity`, `mouse` props; removed `seededRandom`/`getDaySeed`/`isTouch`; simplified placement (no more xOffset randomization); fade curve tightened from `(0.75, 1.0)` → `(0.8, 1.0)`
- `CaseStudyScene.tsx`: dropped `accentColor` prop, `velocity` ref, `mouse` ref, `handleMouseMove` callback, `useVelocity`/`useSpring` plumbing. Added scroll-driven fade that crosses Canvas opacity 1 → 0 as scroll passes 100vh → 110vh. `heroHeight` now `window.innerHeight * 1.0`. Container is now `pointer-events-none` (chrome doesn't need interaction).
- `CaseStudyContent.tsx`: deleted the entire 130vh sticky `<header>` with title/subtitle/tags/projectUrl. Replaced with a 100vh `<div>` spacer so content starts after the hero fade. Added `MastheadBlockRenderer({ project })` that reads from project root. `BlockRenderer` signature gained a `project` prop. Removed `--cs-accent` / `--cs-accent-muted` CSS var injection.
- `CaseStudyCard.tsx`: removed `palette` prop and `ProjectPalette` import. `handleLinkClick` always passes `#18181b` (foreground token) to `startTransition`.
- `HomeClient.tsx`: dropped `palette={cs.palette}` prop on the `CaseStudyCard` render
- `work/[slug]/page.tsx`: dropped `accentColor` prop passed to `CaseStudyScene`
- `ElevationProfile.tsx` + `WoodcutBorder.tsx`: `var(--cs-accent, ...)` references swapped to `currentColor` since the CSS var is no longer injected

### Grilled decisions (locked via /grill-me)
1. All accent uses → black-and-white via theme tokens `#18181b` / `#f9fafb`
2. Hero vibe: Woodblock print (high-contrast, authored composition, kill color injection)
3. Hero structure: pure 100vh visual moment, no text competing
4. Paper shader scope: hero-only, fades past 100vh
5. Biome density: trim to 6 per biome
6. Mouse interaction: killed entirely
7. Parallax speeds: 0.15 / 0.45 / 0.9
8. Title/subtitle/tags: moved to new `MastheadBlock` at `blocks[0]`
9. MastheadBlock shape: empty marker, renderer reads from project root

### Guardrails
- TypeScript clean (`npm run typecheck`)
- ESLint clean (`npm run lint`)
- Production build passes, all 4 case studies statically generated

### Out-of-scope notes that surfaced
- Content layout below the hero is deferred to a follow-up conversation (you flagged this during Q4)
- The `seededRandom` + `getDaySeed` functions in `heroAssets.ts` are still exported but no longer imported anywhere — left as-is, no dead code cleanup this pass
- `WoodcutBorder.tsx` still accepts an `accent` prop that nobody passes — the tree-shake path is `currentColor` for now; pruning the prop is future scope

### User visual verification needed (E2–E5 still unchecked)
- Hero reads as a pure 100vh woodblock moment
- Content starts cleanly below the hero fade
- Card click transition uses dark ink (no color)
- Back-to-trail reverse transition reads correctly
- Reduced-motion still gracefully skips the ink-wash animation

---

## Phase 3.7: Station atmosphere + Mission Bell rewrite (CURRENT)

The specimen catalog declares 24 sprites across 7 roles, but today the case
study pages only render the `specimen` and `landmark` roles — the `terrain`,
`weather`, and `ink-wash` sprites sit unused. Assets land flat. This phase
wires the missing atmospheric layer so each of the 5 stations feels like a
different place in the climb. Separately: Mission Bell copy is entirely
wine-themed in `projects.ts` but the client is actually a commercial
architectural millwork firm (UCSF Weill Institute, Nvidia Treehouse, Ameswell
Hotel) — full copy rewrite required.

### Grilled decisions (locked via /grill-me)

1. **Organizing principle**: journey-staged atmosphere — each station gets a
   characteristic terrain/weather watermark that maps to its place in the climb.
2. **Render strategy**: station-scoped background layers (render a watermark
   behind each station's header block, not mid-text).
3. **Text protection policy**: 6–8% opacity ceiling (reuse the existing
   Station III landmark + Metric block pattern), `pointer-events-none`,
   `aria-hidden`, below content z-index, no stacking watermarks.
4. **Per-project variance**: shared station atlas for all 4 projects; keep
   existing per-project landmarks at Station III + Fig. 06 marginalia sprites
   as the per-project accents.
5. **Out of scope this phase**: ink-wash station-to-station transitions,
   border-mask on media frames, landmark centerpiece promotion, video-size
   optimization, canvas error boundary, Alpine→Summit homepage seam.

### A. Station atmosphere map (behind each `StationBreakBlockRenderer`)

| Station | Roman | Watermark sprite | Opacity | Motion |
|---|---|---|---|---|
| Trailhead | I | `terrain-rolling-hillside.webp` | 7% | none |
| The Ascent | II | `terrain-rocky-trail.webp` | 7% | none |
| The Ridge | III | (existing `signatureLandmark`) | 7% | none |
| The Summit | IV | `cloud-cumulus-cluster.webp` | 7% | `cloud-wispy-stratus.webp` drifts horizontally 60s loop |
| The Descent | V | `wildflower-meadow-strip.webp` | 7% | none |

- [x] A1. `CaseStudyContent.tsx` — add `STATION_ATMOSPHERE` map keyed by Roman
      numeral with sprite src (excl. III which uses `signatureLandmark`)
- [x] A2. `StationBreakBlockRenderer` — render watermark via same absolute/inset
      pattern already used for the signature landmark (opacity 0.07,
      object-contain, pointer-events-none, aria-hidden, -z-10)
- [x] A3. Station IV only: add a second layer with `cloud-wispy-stratus.webp`
      animating `translateX(-8%)` → `translateX(8%)` on a 60s ease-in-out
      infinite loop via Framer Motion
- [x] A4. Respect `prefers-reduced-motion`: `useReducedMotion()` disables drift
- [x] A5. Watermarks are scoped to the `py-20 md:py-32` station header padding
      band only — they never reach into text columns

### B. Mission Bell copy rewrite (architectural millwork firm)

Facts from missionbell.com:
- Commercial architectural millwork + casework (custom woodwork, interior finishings)
- Offices in San Jose + Seattle, projects throughout Northern California + PNW
- Notable: UCSF Weill Institute for Neurosciences, Nvidia Treehouse, Ameswell
  Hotel, Lucid Showroom, Wells Fargo, Samsara, DPR, Heising-Simons Foundation
- Tagline: "Spaces built for people" / "New Mission. Same Bell"
- Voice: craftsmanship + creativity + purpose + pride

- [x] B1. `projects.ts` Mission Bell entry — rewrote `openingQuote` (catalogs
      stapled to spec sheets → every install as a commission)
- [x] B2. `overview.headline` + `overview.body` — refocused on commercial
      architectural millwork firm with SJ + Seattle offices
- [x] B3. Station I `text-block` ("The Brief") — rewrote with UCSF / Nvidia /
      Ameswell name-checks, catalog-vs-commission framing
- [x] B4. Station II subtitle ("Matching the craft to the site") + both
      `text-block` bodies (stack facts preserved, "winery team" → "shop",
      "landing page" → "project case study")
- [x] B5. Station III subtitle ("The site takes on the shop's voice") +
      "The Transitions" rewrite ("just wine-making" → "the built work"),
      captions updated (services → capabilities, wine catalog → project
      portfolio, detail view → project detail view)
- [x] B6. Station IV `text-block` ("The Scrubber") — unchanged, already generic
- [x] B7. Station V `text-block` ("What Shipped") — preserved client quote +
      0-tickets metric, tightened closing line ("runs the floor")
- [x] B8. Specimen labels updated: `vineyard edge` → `lumber grade`,
      `harvest season` → `installation day`, mesa label tweaked
      `local strata` → `site strata`, `standing snag` → `rough stock`
- [x] B9. `frieze.title` — `Mission Bell photography series` →
      `Built work, a sampling`
- [x] B10. Preserved: tags, projectUrl, signatureLandmark, thumbnail, gallery,
      metric value/unit, Bell Tower sprite

### C. Verification

- [x] C1. `npm run lint` — clean
- [x] C2. `npm run typecheck` — clean
- [x] C3. `npm run build` — all 4 case studies statically generated
- [x] C4. Skimmed `/work/mission-bell` copy end-to-end — no remaining wine
      references (vineyard, winery, harvest, wine-making all purged)
- [ ] C5. User visual check pending: each station now has its own
      atmosphere watermark, text stays fully legible, Summit drift is subtle

---

## Review — Phase 3.7 implementation (2026-04-16)

### What changed

**Station atmosphere (`CaseStudyContent.tsx`)**
- Added `STATION_ATMOSPHERE` lookup table mapping Roman numerals I/II/IV/V
  to terrain + weather sprites from the existing specimen catalog
- `StationBreakBlockRenderer` now renders the station-specific watermark at
  7% opacity (mirroring the existing Station III landmark pattern), so every
  station head feels like a different place in the climb
- Station IV Summit additionally renders `cloud-wispy-stratus.webp` drifting
  on a 60s horizontal loop, gated by `useReducedMotion()`
- All watermarks: `pointer-events-none`, `aria-hidden`, `-z-10`, confined to
  the station's `py-20 md:py-32` header padding band

**Mission Bell copy (`projects.ts`)**
- Every wine-themed reference replaced. The firm is now correctly positioned
  as a commercial architectural millwork + casework shop based in San Jose /
  Seattle, building interior woodwork for UCSF Weill Institute, Nvidia
  Treehouse, Ameswell Hotel, Lucid Showroom, etc.
- Opening quote reframed around "catalogs stapled to spec sheets" vs.
  "every install as a commission"
- Stack tags, URL, signature landmark (bell tower sprite), metric (0 dev
  tickets), and client quote ("It finally feels like us") all preserved
- Specimen Latin labels nudged toward material/craft vocabulary
  (lumber grade, rough stock, installation day)

### Guardrails
- `npm run lint` — clean
- `npm run typecheck` — clean
- `npm run build` — all 9 static pages generated, all 4 case studies OK

### Out-of-scope notes from the grill-me session
- Video size optimization (17MB in `/public/assets/videos/`) deferred to a
  dedicated ffmpeg pass
- Canvas error boundary around `UnifiedScene`, preloader race, and the
  `useTransform` side-effect in `VideoBlockRenderer` deferred to a stability
  pass
- Alpine→Summit homepage seam + Case Study canvas fade flicker deferred
- Spacing token unification across hero/forest/camp/alpine deferred
- Ink-wash station-to-station transitions + border-masks on media frames
  deferred (would further use the catalog but not the flagged "flat" complaint)

---

## Assets

All 24 case study illustration assets processed and ready:
- `web/public/assets/graphics/case-study/` — transparent WebP, ~3.4MB total
- Shared nature elements (12): rocks, ridgelines, clouds, terrain, trees, trail marker
- Per-project themed (8): NB hop vine + cabin, CK crystals + fern, MB mesa + tower, CC cliff + lighthouse
- Transition textures (2): ink wash horizontal + vertical
- Border masks (2): organic edge + torn edge

---

## Phase 7: Launch Day (CURRENT — 2026-04-18)

Target: ship samherwig.dev to production via Netlify today, AWWWARDS-submittable polish. `/grill-me` session locked scope below. todo.md stale-check: Phase 3.5 + 3.6 code already complete, just unchecked — confirmed by greps on CaseStudyContent (TrailSpine, StationBreak, Masthead, Specimen, Frieze, Metric all wired) and HeroLandscape (mobile hook + touch listeners + texture swap present).

### Locked decisions (via /grill-me)

1. **Launch scope** = C: finish in-flight phases + everything else today
2. **Spotlights:** KEEP New Belgium (5-brand slider) + CraftedKit (agent pipeline SVG). DROP Mission Bell + Consume-and-Create spotlight slots entirely
3. **NB concept:** click-tab slider (no auto-advance), 5 brands (Fat Tire, Voodoo Ranger, Lightstrike, Kirin, NB flagship), paper-frame slide + Fig. caption
4. **CK concept:** horizontal-ribbon infographic SVG, 5 agent nodes (Todd/Jackson/Chad/Kyle/Brad) + 4 HITL gates inline, counts strip (5 agents / 22 commands / 8 hook matchers / 2 pipelines), scroll-reveal stagger
5. **Chapter wipes (4.14):** ink-wash overlay on station crossings via Framer Motion (not per-project hue — monochrome'd in 2.5)
6. **Canvas teardown (6.20):** pause via `frameloop="demand"` + `visibility:hidden` on route change (not full unmount)
7. **Progressive enhance (6.21):** WebGL capability-detect fallback, static biome image for no-WebGL devices
8. **Favicon:** use `~/Downloads/favicon.zip` (7 files incl. svg, ico, 96px, apple-touch, 192/512, site.webmanifest)
9. **OG image:** Next.js dynamic `opengraph-image.tsx` at 1200×630, full-bleed woodcut biome + Instrument Serif title
10. **Social video:** 30s silent 1080p 16:9 MP4, screen-cap of scroll-through (user records post-deploy)
11. **Netlify:** `netlify.toml` at repo root, `base = "web"`, `@netlify/plugin-nextjs`, Node 20
12. **AWWWARDS:** submit after launch + polish, not today

### A. Code execution (Claude — in parallel where safe)

- [ ] A1. Install favicon — unzip to `web/public/`, delete old `src/app/favicon.ico`, update `layout.tsx` metadata
- [ ] A2. Create `netlify.toml` at repo root with Next.js plugin + Node 20
- [ ] A3. Strip `spotlight-block` entries from MB + CC in `projects.ts`
- [ ] A4. Build NB 5-brand slider component (click-tab, crossfade, Fig. caption, paper frame, renders off 5 expected paths)
- [ ] A5. Design + build CK agent pipeline SVG component (horizontal ribbon, 5 nodes + 4 gates, counts strip, scroll-reveal)
- [ ] A6. Wire NB + CK spotlight components into `SpotlightBlockRenderer` switch on `spotlightId`
- [ ] A7. Build Phase 4.14 ink-wash station-crossing wipe — scroll-triggered overlay, Framer Motion, reduced-motion gated
- [ ] A8. Build Phase 6.20 canvas pause-on-route-change — `frameloop` + `visibility` swap
- [ ] A9. Build Phase 6.21 WebGL fallback — capability detect + static biome image for no-WebGL devices
- [ ] A10. Create `opengraph-image.tsx` for dynamic OG image generation
- [ ] A11. `npm run guardrails` clean

### B. User blockers (Sam — do in parallel with A)

- [ ] B1. Screenshot 5 NB brand modules on newbelgium.com → save as `web/public/work/nb-spotlight-{fat-tire,voodoo-ranger,lightstrike,kirin,nbb}.webp` (cwebp-convert)
- [ ] B2. Create Netlify site, connect repo, point `samherwig.dev` DNS (CNAME / A record)
- [ ] B3. Screen-capture 30s launch video against deployed preview (scroll homepage → click case study → scroll one station → back)

### C. QA + Ship

- [ ] C1. Deploy preview to Netlify, visual QA on desktop + real phone
- [ ] C2. Verify: no console errors, favicon loads, OG image preview correct (via Twitter card validator), all 4 case studies render cleanly, CK + NB spotlights populated
- [ ] C3. Merge `staging` → `main`, trigger production deploy
- [ ] C4. Verify live samherwig.dev loads, DNS propagated, HTTPS cert active
- [ ] C5. Post launch video to Twitter + LinkedIn

### D. Post-launch (this week, AWWWARDS-readiness)

- [ ] D1. AWWWARDS submission form — needs site URL, tech stack list, 3 screenshots, launch video, $80 fee
- [ ] D2. Delete merged `mission/*` branches per global branch hygiene rule

### E. Homepage polish (2026-04-19)

- [x] E1. Redesign `ElevationBar` as horizontal elevation profile — bottom edge, literal altitudes per zone (8,400→14,430 ft), ink-wash past fill + ghost future outline, signpost sprite + dotted guide + live altitude readout, station markers clickable. Grilled: bottom/horizontal, literal shape, ink-wash mask on leading edge via userSpace gradient, markers on curve with labels below baseline.
- [x] E2. Shrink ElevationBar by 50% — cap max-width at 440px, bump SVG label font-size to 16 to stay legible at reduced scale.
- [x] E3. Mobile case-study overlap fixes (audited 4 pages at 420×900):
  - `BackToTrail` wrapped in backdrop-blur pill (`bg-background/80 border-foreground/10 rounded-full backdrop-blur-md`) so it stops eating body text.
  - Media + video captions get `px-6 md:px-0` so fullBleed captions stay within mobile gutters.
  - Frieze title container gets `ml-6 mr-6 md:ml-20 md:mr-20` and `text-2xl md:text-3xl` so it doesn't clip at mobile.
  - `StationBreak` decorative Roman numeral dropped to `text-[6rem] text-foreground/[0.05]` at mobile (was 10rem/0.08) so it stops competing with the station label; inner div ml trimmed to `ml-2 md:ml-20`.
  - CK pipeline: moved "Interactive Specimen — The Pipeline" header *inside* the sticky `PipelineFrame` container so it can't collide with the first agent pill during sticky-engagement timing.

---

## Phase 8: Awwwards / award-site readiness (2026-04-19)

Research punch list synthesized from four parallel agents (Awwwards process,
other award sites, technical readiness, winning portfolio patterns).

### Audit — already in place
- ✅ Favicon suite (svg, ico, 96, apple-touch, 192/512, manifest)
- ✅ Dynamic OG image via `app/opengraph-image.tsx` at 1200×630
- ✅ Title, description, OG, Twitter meta in `layout.tsx`
- ✅ `metadataBase` set to https://samherwig.dev
- ✅ Theme color + manifest with theme/background_color
- ✅ Skip-to-content link → `#main-content` target exists in `HomeClient.tsx:225`
- ✅ `netlify.toml` security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- ✅ Static `robots.txt` + `sitemap.xml` listing all 5 routes
- ✅ Reduced-motion handling already wired in InkWashTransition + station atmosphere
- ✅ WebGL fallback via `useWebGLSupport.ts`
- ✅ Custom 404? → check (Next default acceptable but on-brand is better)

### A. Technical readiness (low-risk, additive — execute now)

- [ ] A1. Add JSON-LD `Person` schema in `layout.tsx` `<head>` (name, jobTitle, url, sameAs links, image)
- [ ] A2. Add `viewport-fit=cover` to viewport meta for iOS safe-area-insets
- [ ] A3. Dual `themeColor` (light/dark via media query) — currently only `#f5f5f4`
- [ ] A4. Explicit `og:image` width/height (1200×630) + `twitter:image` URL fallback
- [ ] A5. Add `Strict-Transport-Security` HSTS header to `netlify.toml` (max-age=63072000; includeSubDomains; preload)
- [ ] A6. Add baseline CSP in netlify.toml (report-only first if risky)
- [ ] A7. Run `npm run guardrails` after each batch

### B. Strategic content / craft (needs user direction)

- [ ] B1. Custom on-brand `app/not-found.tsx` 404 page
- [ ] B2. One case study taken to "deep" tier (current depth varies — pick CK or NB to anchor)
- [ ] B3. Sound toggle? Ambient wind layer with default-off persistent toggle. Half of recent SOTD winners ship audio.
- [ ] B4. Trail metaphor in cursor idle state (compass / trail marker echo)
- [ ] B5. Clarity audit on metaphor → does a first-time visitor catch "Trailhead/Ascent/Ridge/Summit/Descent" without prompting?
- [ ] B6. Personal vs studio framing — confirm portfolio leads "Sam, creative engineer"; CraftedKit demoted to one-line credential

### C. Submission queue (after launch + polish week)

**Free tier (Week 1, low effort):**
- [ ] C1. SiteInspire — siteinspire.com/contact
- [ ] C2. The Brand Identity — the-brandidentity.com/submit
- [ ] C3. Httpster — httpster.net (footer link)
- [ ] C4. Land-book — land-book.com/submit
- [ ] C5. Best Website Gallery — bestwebsite.gallery/submit
- [ ] C6. Lapa Ninja — lapa.ninja/submit (optional)

**Paid tier (Week 2, high-fit):**
- [ ] C7. **FWA of the Day** (~$80) — thefwa.com/submit. Highest-fit award for WebGL/R3F portfolios; best technical-excellence audience.
- [ ] C8. **CSSDA WOTD** (~$95) — cssdesignawards.com/submit-your-site
- [ ] C9. **Awwwards SOTD** ($65 standard or $165 Pro). Submit Tue–Thu mid-month. Buy Pro for 30% off + Pro vote weight + auto Dev Award routing.
  - Hard requirements: 1600×1200 px main thumbnail; live URL; tags; credits; project description.
  - SOTD eligible 3 months post-approval — submit when fully polished, not at first deploy.
  - Mobile Excellence: separate panel, target Lighthouse Mobile ≥ 75 across all 4 axes.
- [ ] C10. One Page Love free tier — onepagelove.com/submit
- [ ] C11. Communication Arts Interactive (~$55) if annual deadline aligns

**Skip / defer:** Webby ($325–$700+, agency-skewed), D&AD (£250+, campaign-skewed), TDC (type-only), Mindsparkle, Muzli.

### D. Pre-submission verification (right before pressing submit)

- [ ] D1. PageSpeed Insights mobile + desktop — Performance ≥ 90 mobile, ≥ 95 desktop; LCP < 2.5s; CLS < 0.1; INP < 200ms
- [ ] D2. Lighthouse Accessibility ≥ 95
- [ ] D3. Test on real iOS Safari + Android Chrome (BrowserStack acceptable)
- [ ] D4. Zero `console.error` / `console.warn` on load any route
- [ ] D5. axe DevTools scan: zero violations
- [ ] D6. Validate OG image at opengraph.xyz, LinkedIn Post Inspector, X Card Validator
- [ ] D7. securityheaders.com → target A grade
- [ ] D8. ssllabs.com SSL test → A or A+
- [ ] D9. Search Console rich results test on the homepage
- [ ] D10. Click every link end-to-end; no 404s, no `href="#"`, no broken video sources
- [ ] D11. Test forced dark mode (macOS + iOS) — confirm dual theme-color works
- [ ] D12. Spelling/typo pass — Grammarly + manual read of every case study

### Strategic notes

- **Awwwards scoring weights:** Design 40 / Usability 30 / Creativity 20 / Content 10. Min jury 18 voters, 3 furthest from average dropped. Honorable Mention ≥ 6.5; SOTD effectively ≥ 8.0.
- **Developer Award:** auto-routed from SOTD; score > 7 wins. Rewards clean semantic markup, accessibility, novel implementation.
- **What recurs in 2024–25 winners:** custom cursor, scroll-driven WebGL hero, GSAP/Lenis smooth-scroll, view transitions, large display type, one signature technical moment. Sound in ~50%. Dark mode near-universal.
- **What docks scores:** mobile as afterthought (#1), Safari rendering bugs, no clear contact CTA, thin case studies, dated typography, missing reduced-motion.
- **Trends to ride:** view transitions API, ink/paper/print-craft aesthetics (we're here), monochrome with one accent, GPGPU particle hero, editorial typography.
- **Trends fatigued:** glassmorphism, aurora gradient mesh, generic Lenis with no other interaction, oversized Söhne/Inter as the entire design, AI hero imagery, bento grids.

---

# Phase 7: Whimsy System — Compass Rework + Easter Egg Hunt

Kill the passive idle compass; rebuild it as an egg-spotter cursor. Seed 6 in-world
easter eggs across the homepage + case study pages, plus 1 hidden page and 1
fourth-wall final reward. Everything triggers by clicking the highlighted surface
(uniform input, varied content). Compass points at the nearest egg in viewport
and pulses; finding an egg checks it off the notebook.

## Grilled decisions (locked)

- **Compass role:** Spotter, not key. Points + pulses when egg is within ~300px in viewport; click the *surface* (not the compass) to fire.
- **Trigger uniformity:** All eggs fire via click. Content varies, input doesn't. (Exception: the Notebook's `]` keyboard reopen — only *after* first unlock.)
- **Tone:** In-world trail metaphor for 7 of 8 eggs. One fourth-wall final reward (Ranger's Notebook) breaks the wall deliberately as the last unlock.
- **Payoff envelope:** 6 micros (4–6s flourishes), 1 hidden page (`/cairn`), 1 fourth-wall page (`/notebook`).
- **Contrast:** Real luminance detection under cursor → flip compass black/white. No mix-blend-difference.
- **Mobile/touch:** No cursor, so zone-entry glow briefly highlights tappable egg surfaces when a new zone becomes active. Same content, different affordance.
- **State:** localStorage tracks found eggs. `?reset` clears. Notebook shows collected checkmarks + case study stamps.
- **Build order:** Compass system first (infrastructure) → zone-entry touch glow → 4 homepage micros in parallel → 2 case study micros → `/cairn` hidden page → `/notebook` fourth-wall.

## The 8 eggs

| # | Name                 | Location              | Trigger surface                           | Payoff (2–4s)                                                                                  |
|---|----------------------|-----------------------|-------------------------------------------|------------------------------------------------------------------------------------------------|
| 1 | Trailhead Stamp      | Hero                  | Hero headline's first letter (monogrammed)| SVG ink-stamp thuds in behind letter + soft wood-block thunk on `hero-breeze` bus              |
| 2 | Owl Blink            | Forest                | Hidden SVG owl in a Forest card corner    | Eyelids blink, head tilts 15°, barely-audible hoot on `forest-canopy` channel                   |
| 3 | Ember Pop            | Camp                  | Fire hotspot on Camp video poster         | 6–8 CSS/SVG embers rise with flicker keyframes; `camp-fire` ducks for crackle sample            |
| 4 | Pennant Snap         | Summit                | Summit flag/pennant SVG                   | Flag snaps taut in GSAP stagger-ripple, `alpine-wind` boosts briefly, settles slower loop       |
| 5 | Trail Station Stamp  | Every case study page | Ranger-station stamp SVG in page margin   | Unique stamp design per project thuds in — collected in Notebook like passport stamps           |
| 6 | Margin Note          | Case study pages      | Hand-drawn marginalia note with arrow     | Uncrumples from folded paper → reveals 1-line behind-the-scenes aside; re-crumples in 5s        |
| 7 | `/cairn` hidden page | Alpine + route        | Cairn decoration in Alpine (3 clicks)     | Navigate to `/cairn`: paper trail register, localStorage visitor stamps, "leave a mark" button  |
| 8 | Ranger's Notebook    | `/notebook` route     | Auto-unlocks after 1–7; `]` key reopens   | Field journal overlay: hunt checkboxes, SVG-drawn thank-you, ASCII topo map, dev credits        |

## A. Compass rework (infrastructure)

- [x] A1. `src/lib/eggs/eggRegistry.ts` — typed registry of egg targets (id, zone, surface selector or scene coord, bounds getter, label)
- [x] A2. `src/lib/eggs/useFoundEggs.ts` — Zustand store + localStorage persistence; `markFound(id)`, `reset()`, `foundCount`
- [x] A3. `src/components/CustomCursor.tsx` — remove idle-state compass; replace with spotter logic (nearest-egg distance calc in rAF loop, bearing to target, opacity by range)
- [x] A4. Contrast detection — sample background luminance under cursor (canvas readback or computed body bg per zone) → flip needle fill black/white
- [x] A5. Pulse animation — gentle 2s scale breathing when target is in range, stop when no target or target is found
- [x] A6. Check-mark state — when hovering a found egg's surface, replace bearing with a subtle ✓ icon
- [x] A7. Respect `prefers-reduced-motion` (no pulse, just bearing)
- [x] A8. Dev query param `?reset` clears found-eggs store on mount

## B. Touch/mobile affordance

- [x] B1. `src/components/eggs/ZoneEntryGlow.tsx` — on zone become active, briefly glow tappable egg surfaces in that zone (~1.2s, fades)
- [x] B2. Detect touch via `(hover: none)` media query; only mount on touch devices
- [x] B3. Once a zone's eggs are all found, no glow on re-entry

## C. Homepage micros (4 eggs, parallel)

- [x] C1. **Trailhead Stamp (Hero)** — monogrammed first letter in Hero headline, click → inline SVG ink-stamp dissolves in behind letter, audio stinger on hero-breeze bus, marks egg 1
- [x] C2. **Owl Blink (Forest)** — hidden SVG owl placed in a Forest card corner, click → eyelid-blink animation + head tilt 15°, hoot audio on forest-canopy, marks egg 2
- [x] C3. **Ember Pop (Camp)** — interactive hotspot over Camp video's fire region, click → CSS/SVG ember particles rise, camp-fire ducks briefly for crackle, marks egg 3
- [x] C4. **Pennant Snap (Summit)** — clickable pennant SVG in SummitModule, click → GSAP stagger-ripple snap, alpine-wind audio boost, marks egg 4

## D. Case study page micros (2 eggs)

- [x] D1. **Trail Station Stamp** — component mounted on every case study page, unique stamp design per project slug (NB, CK, MB, CC), click → ink-stamp impression animation, marks egg 5 + adds project-specific stamp to notebook
- [x] D2. **Margin Note** — one per case study page, hand-drawn marginalia SVG with arrow pointing at a media block, click → uncrumples to reveal 1-line aside from Sam, re-crumples in 5s, marks egg 6

## E. Hidden page (`/cairn`)

- [x] E1. Cairn decoration sprite in Alpine scene (subtle, low-opacity SVG overlay); 3-click counter lives in its own state
- [x] E2. On 3rd click: InkWash transition → navigate to `/cairn`
- [x] E3. `src/app/cairn/page.tsx` — field-journal layout, WoodcutMaterial paper background, visitor register (localStorage), "leave a mark" ink-stamp monogram button
- [x] E4. Back-link styled as trail marker returning to `/`
- [x] E5. Visit marks egg 7

## F. Fourth-wall final (`/notebook`)

- [x] F1. `src/app/notebook/page.tsx` — field-journal overlay layout, paper texture, stitched binding SVG
- [x] F2. Hunt checklist section — hand-ticked checkboxes for eggs 1–7, ink-drawn as they complete
- [x] F3. Case study stamps panel — shows collected stamps from egg 5
- [x] F4. Handwritten thank-you note from Sam (SVG path stroke-dash draw-on)
- [x] F5. ASCII topographic map of the site (static `<pre>` block)
- [x] F6. Dev credits footnote — the actual fourth-wall moment
- [x] F7. Keyboard listener for `]` to reopen from any page (only active after all 7 found)
- [x] F8. Visit marks egg 8 (self-referential — finishes the hunt)

## G. QA + polish

- [x] G2. All audio stingers respect AudioToggle mute state *(`boostSection` early-returns when disabled)*
- [x] G3. Reduced-motion mode: eggs still fire, payoffs shortened/static *(compass + handwriting + all 6 egg payoffs now gated on `useReducedMotion`)*
- [x] G5. Cold-cache pass: compass never flashes wrong color on first paint *(initial luminance sample defaults to light-bg → dark needle)*
- [x] G6. Check all 4 case study pages have Trail Station Stamp + Margin Note placed without disrupting content flow *(fixed bottom-right collision: TrailStationStamp now `md:bottom-24` so TrailCounter "07 / 24" index stays visible)*
- [x] G7. Dark-mode pass on `/cairn` and `/notebook` — **N/A**: `globals.css` has no `prefers-color-scheme` block and no `.dark` class; `--color-*-dark` tokens exist but are never applied. Site is permanently light. Only the browser chrome `theme-color` meta tag differs between schemes.
- [~] G8. Lighthouse — not run (CLI not installed; needs user browser run). Build is clean: 11 static routes, largest chunk 530 KB (three.js, pre-eggs), egg components add negligible JS (inline SVG + small framer-motion payloads reusing existing zustand store).
- [ ] G1. 60fps budget across all eggs *(still needs real playthrough — spotter samples luminance every 6 frames, but per-frame `document.elementFromPoint` + `getBoundingClientRect` × 8 eggs is the risk)*
- [ ] G4. Mobile pass: ZoneEntryGlow timing, 44px tap targets *(still needs device QA — egg buttons are h-14/w-14 (56px) on case study, h-11/w-11 (44px) on HeroEgg so they meet WCAG min)*

## Open risks

- **Compass contrast detection cost** — if luminance sampling per-frame is expensive, fall back to per-zone theme token lookup.
- **Case study egg placement** — each slug has different hero compositions; Margin Note anchor point may need to be per-project.
- **Notebook progress display** — keeping it honest when eggs are found out of order requires the registry to enforce id stability.
- **Alpine cairn discoverability** — 3-click hidden trigger may be too obscure; if playtest shows nobody finds it, lower to 1 click.

## Review — Phase 7 build (2026-04-20)

**What shipped:**

- `src/lib/eggs/eggRegistry.ts` + `useFoundEggs.ts` — 8-egg registry + persisted Zustand store (localStorage `found-eggs:v1`)
- `src/components/CustomCursor.tsx` — rebuilt as spotter: nearest-egg bearing within 300px, 2s pulse, real-luminance contrast flip, ✓ on found-hover, `?reset` clears store
- `src/lib/audio/audioManager.ts` — added `boostSection()` for egg stingers (brief gain bump on the ambient track)
- `src/components/eggs/*` — 8 components:
  - `HeroEgg` (monogrammed corner button in hero panel → fullscreen stamp reveal)
  - `ForestEgg` (owl SVG, fixed bottom-right, eyes blink 2x + "hoo." whisper)
  - `CampEgg` (small flame, fixed bottom-center, 7-ember burst on click)
  - `SummitEgg` (pennant SVG, fixed top-left, 5-segment stagger-snap)
  - `AlpineCairnEgg` (3-click stacked-stones, top stone falls + ink-wash nav to `/cairn`)
  - `TrailStationStamp` (per-slug WebP, fixed corner on case study pages, stamp-thud overlay)
  - `MarginNote` (folded-paper icon on case studies, unfolds to behind-the-scenes aside for 5s)
  - `ZoneEntryGlow` (touch-only amber pulse around unfound eggs when zone becomes active)
  - `NotebookReopener` (global `]` keyboard listener — only active after 7 eggs found)
- `src/app/cairn/page.tsx` — field journal with shared visitor register (localStorage, 40 entries, 3-letter initials)
- `src/app/notebook/page.tsx` — hunt checklist, station stamp gallery, stroke-animated thank-you, ASCII map, dev credits
- `web/public/` — all 15 final assets in place (7 SVG + 8 WebP)

**Wiring:**

- Homepage — Hero/Forest/Camp/Summit/Alpine eggs + ZoneEntryGlow mounted in `HomeClient.tsx`, scroll-gated via `MODULE_TIMELINE`
- Case studies — TrailStationStamp + MarginNote mounted in `CaseStudyContent.tsx`
- Layout — NotebookReopener mounted globally in `layout.tsx`

**What's honestly green:**

- `npm run guardrails` passes (format, lint, typecheck, asset check, build)
- All 5 routes return 200 w/ no error markers in rendered HTML (homepage, /cairn, /notebook, /work/new-belgium, /work/craftedkit)
- Static generation for /cairn and /notebook succeeds

**What I haven't verified (user QA):**

- 60fps playthrough (the spotter luminance sample every 6 frames is conservative but untested)
- Reduced-motion — compass pulse + handwriting draw respect the token; per-egg payoff animations don't yet
- Mobile/touch — ZoneEntryGlow logic is built but hasn't touched a real device
- Visual polish on `/cairn` + `/notebook` in dark mode
- The chemex stamp (CC) rope detail may read oddly at 64px thumbnail size in the notebook

**Known rough edges to look at:**

- All 4 module eggs use `fixed` positioning with scroll-gated opacity. They don't collide visually (only one zone active at a time) but on device rotation or resize they may briefly overlap the AudioToggle or ScrollHint.
- `AlpineCairnEgg` uses `useAppStore.startTransition` + `setTimeout(500ms) → router.push('/cairn')`. If the ink-wash duration drifts, the page-change could outrun the visual transition.
- The `MarginNote` unfolded-paper WebP is 655 KB. If it feels heavy on first reveal, re-encode at q=80 and/or cap width to 1200px.

**Autonomous polish pass (post-handoff):**

- `margin-note-unfolded.webp`: 655 KB → 74 KB (1200px @ q=78). Visually identical at display size.
- `trail-station-cc.webp`: 481 KB → 91 KB (1200px @ q=85). Chemex detail retained.
- Reduced-motion gating added to HeroEgg / ForestEgg / CampEgg / SummitEgg / TrailStationStamp payoffs — each now short-circuits to a brief opacity-only reveal when `useReducedMotion` returns true. AlpineCairnEgg intentionally keeps its 3-click → stone-fall since that IS the UX.
- `setTimeout` cleanup refs added to HeroEgg, ForestEgg, TrailStationStamp to avoid state updates on unmount.

---

# SOTD Readiness Punch List — 2026-04-20

Audit of `web/` against Awwwards Site of the Day rubric (Design 40, Usability 30, Creativity 20, Content 10). Concept is strong; these are the execution gaps jurors will catch. Ordered by priority.

## P0 — Blockers (must fix before submission)

- [ ] **Keyboard navigation for case study cards.** `CaseStudyCard.tsx` L183 — cards have click handlers + aria-label but no Tab focus target with visible focus ring + Enter/Space activation. Wrap in `<a>`/`<Link>` or add `role="button" tabIndex={0}` with `onKeyDown` for Enter/Space. Jurors Tab through every interactive element.
- [ ] **Reduced-motion gating on scroll-driven animations.** `HomeClient.tsx` imports `useReducedMotion` (L2) but doesn't use it to short-circuit the per-module opacity/position transforms. When reduced-motion is on, collapse zones to a static stacked layout (or instant cuts instead of crossfades). Same pass in `UnifiedScene.tsx` — freeze or disable the 3D scrub.
- [ ] **Phase 4 visual sign-off on all 4 case studies.** Open each (`/work/new-belgium`, `/work/craftedkit`, + 2 others) in dev, walk Trailhead → Descent on desktop + mobile viewport, screenshot each station. This is already tracked higher in todo.md — surface it here because SOTD judges case studies end-to-end.

## P1 — Polish (strongly recommended)

- [ ] **Semantic landmarks in `layout.tsx`.** Only `<main>` is wrapped in case study page. Add `<header>`, `<nav>`, `<footer>` around the appropriate regions so screen readers + axe-core both pass. No visual change required.
- [ ] **Per-case-study dynamic OG image generator.** `work/[slug]/page.tsx` L22 currently points OG at the static `project.thumbnail`. Add `opengraph-image.tsx` inside `work/[slug]/` so each share card renders with project title, client, and thumbnail over the woodcut-branded template (mirror root `opengraph-image.tsx`). This is how portfolios get shared on Twitter/LinkedIn on launch day.
- [ ] **Mobile 3D scene parity.** `UnifiedScene.tsx` L1213 caps dpr but keeps full geometry on phones. Add a `isMobile` branch that swaps heavy scene groups (forest particles, alpine clouds) for lighter variants or skips non-hero groups entirely. Target: 60fps on iPhone 13 / mid-range Android.
- [ ] **Focus-visible ring system in `globals.css`.** Only one `:focus-visible` rule (L115). Add a global ring style that applies to all interactive elements (`a, button, [role="button"]`) with a color that works on both light + dark backgrounds.
- [ ] **Video `preload="metadata"` + bitrate audit.** Case study `video-block`s should use `preload="metadata"` (not `auto`) so the page doesn't pull megabytes up front. Check each MP4 is under 5s and ~2–3 Mbps per the Video Asset Rules memory.

## P2 — Nice-to-have (tiebreakers)

- [ ] **Project metadata layer.** `src/data/projects.ts` — add `client`, `year`, `role`, `deliverables[]` fields to the `Project` interface and surface them on case study mastheads (a small metadata strip under the title). Jurors score content depth; "New Belgium · 2024 · Lead · Web, Brand" reads as real work.
- [ ] **Decorative SVGs marked `aria-hidden`.** WoodcutBorder, paper atmosphere layers, compass marks, etc. — anything purely ornamental should have `aria-hidden="true"` so screen readers don't announce them.
- [ ] **Cursor micro-feedback on clickable cards.** `CustomCursor.tsx` luminance-adapts but doesn't scale/pop on hover over interactive targets. Add a zone/hover state that grows the needle ~1.4x over `role="button"` / `<a>` elements.
- [ ] **Canonical tags + per-route metadata titles.** Not a blocker; helps crawlers and looks professional to jurors inspecting `<head>`.
- [ ] **Lighthouse + WebPageTest pass.** Run Lighthouse on `/` and `/work/new-belgium` on mobile + desktop, capture scores, target ≥90 across the board. Fix the lowest scoring category.

## Submission-day checklist

- [ ] Screenshot and 30s screen recording for the Awwwards entry form
- [ ] Short description (~500 chars) emphasizing the craft — woodcut shader, unified scroll timeline, trail metaphor, Easter egg hunt
- [ ] Credits (Sam Herwig — design, dev, 3D)
- [ ] Launch URL stable on `main` (no staging-branch leaks)
- [ ] `npm run guardrails` green
- [ ] No `console.log` or `// TODO` markers in shipped code

---

# Phase 7.1: Easter Egg Rework — One Egg, `/shhhh`, Water Shader Flex (2026-04-21)

Sam: not happy with current 8-egg system. SVGs read flat, payoff envelope is weak,
collection mechanic is a checklist not a delight. Cut to one substantial egg,
rebuild compass behavior, build a custom water-shader hidden page as the single
payoff. `/grill-me` session resolved the design tree below.

## Locked decisions (via /grill-me)

1. **Cut 8 → 1 egg.** Kill collection mechanic entirely.
2. **Drop `/cairn`.** Visitor register was a localStorage lie (per-browser only) that breaks the metaphor on inspection.
3. **Drop `/notebook`.** Built to celebrate finishing a hunt; without the hunt, it's an empty room.
4. **New egg = hidden page at `/shhhh`** — overhanging tree above a stream, "off-trail" mood.
5. **Hero shader = water.** Ambient flow + mouse-poke ripples + caustics + edge foam. Canonical "this dev knows GLSL" flex.
6. **Drop the smoke entry.** Reuse existing `InkWashTransition` instead — keeps navigation language unified.
7. **Trigger location = Forest zone.** A single off-trail marker sprite. Forest reads more "off the beaten path" than Camp's "convenient detour."
8. **Compass = always visible.** Permanent personality artifact. Spins + pulses near the one unfound egg. Disappears on `/shhhh` (off-trail = no compass), native cursor returns.
9. **Audio = new `grove` ambient bus.** Stream burble + faint wind + occasional bird. Respects existing `AudioToggle`.
10. **Assets = ~10–15 new commissioned sprites.** Same illustrator, same WebP pipeline, scope comparable to one biome.

## A. Rip — delete the 8-egg system

- [x] A1. Delete `web/src/components/eggs/HeroEgg.tsx`
- [x] A2. Delete `web/src/components/eggs/ForestEgg.tsx`
- [x] A3. Delete `web/src/components/eggs/CampEgg.tsx`
- [x] A4. Delete `web/src/components/eggs/SummitEgg.tsx`
- [x] A5. Delete `web/src/components/eggs/AlpineCairnEgg.tsx`
- [x] A6. Delete `web/src/components/eggs/TrailStationStamp.tsx`
- [x] A7. Delete `web/src/components/eggs/MarginNote.tsx`
- [x] A8. Delete `web/src/components/eggs/ZoneEntryGlow.tsx`
- [x] A9. Delete `web/src/components/eggs/NotebookReopener.tsx`
- [x] A10. Delete `web/src/app/cairn/` folder
- [x] A11. Delete `web/src/app/notebook/` folder
- [x] A12. `HomeClient.tsx` — remove all egg + ZoneEntryGlow mounts
- [x] A13. `CaseStudyContent.tsx` — remove TrailStationStamp + MarginNote mounts
- [x] A14. `layout.tsx` — remove NotebookReopener mount
- [ ] A15. `web/public/` — remove unused egg WebPs/SVGs once nothing references them (post-rip grep pass)

## B. Compass rework — always visible

- [x] B1. `CustomCursor.tsx` — drop `visible` state gating; compass always renders at fixed opacity
- [x] B2. Hide native cursor via `document.body.style.cursor = 'none'` while compass mounted; restore on unmount/off-trail
- [x] B3. Spin behavior unchanged: rotate toward the one unfound egg when in `EGG_RANGE_PX`
- [x] B4. Pulse behavior unchanged (now gated on `pointing` state)
- [x] B5. `usePathname()` check — hide CustomCursor entirely on `/shhhh`, restore native cursor
- [x] B6. Existing luminance contrast flip stays
- [x] B7. Reduced-motion: no pulse, just bearing (existing behavior)

## C. Egg registry — collapse to one

- [x] C1. `eggRegistry.ts` — replace 8-egg array with single `grove` entry
- [x] C2. `useFoundEggs.ts` — kept store shape unchanged; works as-is for one id
- [x] C3. `?reset` query param still works

## D. Forest trigger sprite

- [ ] D1. Commission "off-trail marker" sprite — small mossy stone with discreet arrow OR pressed footprint. Match biome WebP style. **(USER-BLOCKED)**
- [ ] D2. Save to `web/public/assets/graphics/eggs/grove-marker.webp` **(USER-BLOCKED on D1)**
- [x] D3. New `web/src/components/eggs/GroveMarker.tsx` — placeholder SVG silhouette in place; scroll-gated opacity via Forest module timeline; `data-egg="grove"` attribute; auto-fades when found
- [x] D4. Click → `startTransition` → `setTimeout(500ms)` → `router.push('/shhhh')`
- [x] D5. Mount in `HomeClient.tsx` (above Preloader)

## E. `/shhhh` page — composition

- [x] E1. New `web/src/app/shhhh/page.tsx` — full-bleed scene, dynamic-imported R3F Canvas
- [ ] E2. Background plane: distant ridge silhouette WebP at low opacity **(USER-BLOCKED on H4)**
- [ ] E3. Mid-ground: stream-bed rocks + bank/grass tufts **(USER-BLOCKED on H2/H5)**
- [ ] E4. Foreground: overhanging tree + foreground brush/ferns **(USER-BLOCKED on H1/H3)**
- [x] E5. Water plane: ortho-projected fullscreen plane with `WaterShaderMaterial`
- [x] E6. Lighting: flat illumination — paper-toned background `#f9fafb`
- [x] E7. Back-to-trail link top-left, InkWash → `router.push('/')`
- [x] E8. Cursor strip on `/shhhh` handled by `CustomCursor` `usePathname()` check (B5)

## F. Water shader — the flex

- [x] F1. `web/src/components/shaders/WaterMaterial.ts` — drei `shaderMaterial` + R3F `extend`
- [x] F2. Vertex: pass UVs + plane-local pos (`vUv`, `vPlanePos`)
- [x] F3. Fragment uniforms: `uTime`, `uMouse`, `uRipples` (vec4[8]), `uFlowDir`, `uColorPaper`, `uColorInk`, `uEdgeMask`, `uHasEdgeMask`, `uOpacity`
- [x] F4. Fragment composition (back → front): caustics (sin/cos cells with flow drift) + surface fBm flow + mouse hover warp + ripple ring accumulator (decay-on-age) + foam (gated on uHasEdgeMask, awaits asset) + monochrome paper/ink composite
- [x] F5. JS-side ripple manager (`GroveScene.tsx`) — pointerdown pushes ripple into ring buffer (max 8), expired (>2s) dropped each frame
- [x] F6. Continuous pointermove updates `uMouse` for subtle real-time warp
- [~] F7. Wrote shader without `/shader-dev` consult — works clean on first compile, but visual polish pass (caustics density, ripple decay curve, foam math) deferred to user playtest

## G. Audio bus

- [ ] G1. `audioManager.ts` — register new `grove` bus
- [ ] G2. Source: stream burble loop (CC0 from freesound.org or commission, ~30–60s seamless)
- [ ] G3. Optional layer: faint wind through leaves loop
- [ ] G4. Optional layer: occasional bird chirp, one-shot every 20–40s with random offset
- [ ] G5. `/shhhh` mount → fade-in over 1s
- [ ] G6. `/shhhh` unmount → fade-out over 1s
- [ ] G7. Respects existing `AudioToggle` mute state

## H. Asset commission (~10–15 sprites)

- [ ] H1. Overhanging tree (gnarled silhouette, frame-defining) — 1
- [ ] H2. Stream-bed rocks (varying sizes) — 4–6
- [ ] H3. Foreground brush / ferns — 2–3
- [ ] H4. Distant ridge silhouette — 1
- [ ] H5. Bank / grass tufts — 2–3
- [ ] H6. Off-trail Forest marker (the trigger from D1) — 1
- [ ] H7. Optional fallback static composition WebP for no-WebGL devices — 1

## I. Verification

- [ ] I1. `npm run guardrails` clean (format, lint, typecheck, asset check, build)
- [ ] I2. Visual: compass always visible on homepage + case studies, spins toward Forest marker
- [ ] I3. Visual: click marker → InkWash → `/shhhh` loads cleanly
- [ ] I4. Visual: water shader renders smoothly, mouse-poke creates rings, ambient flow runs, caustics + foam read
- [ ] I5. Visual: back-to-trail returns smoothly to homepage
- [ ] I6. Visual: compass disappears on `/shhhh`, native cursor returns
- [ ] I7. Audio: stream bus fades in/out, AudioToggle mutes
- [ ] I8. Reduced-motion: water still ambient-flows but mouse ripples disabled (or minimized)
- [ ] I9. WebGL fallback: `/shhhh` shows static fallback composition WebP if no WebGL
- [ ] I10. Mobile: touch-tap creates ripples (tap = single ripple), no compass on touch devices anyway

## Open risks

- **Custom water shader is the long-pole.** Caustics + flow + ripples + foam is non-trivial. Prototype the shader against placeholder rocks before committing to commission scope.
- **Asset commission turnaround.** ~10–15 sprites; if illustrator is slow this gates launch. Use placeholder geometry (flat shaded planes) during shader dev so the two tracks run parallel.
- **Compass-always-visible may feel busy.** Current cursor only appears near eggs. Permanent could become visual noise on long scrolls. Worth A/B testing opacity (0.85 → 0.5) once live.
- **`/shhhh` discoverability.** Single Forest sprite + compass spin is the only way in. If playtest shows nobody finds it, increase sprite size or add a second hint (e.g., zone-entry shimmer on Forest enter).
- **Water performance on mobile.** Custom shader on a fullscreen plane on mid-tier Android could chug. Plan for a mobile-tier shader variant (skip caustics, reduce ripple count) gated behind viewport width or DPR check.

