# Case Study Redesign — Pixel + GLSL Pass

Synthesizing 4 parallel research agents (image dither, hero shaders, chapter screens, Pixel typography) into a phased plan. Spine locked via /grill-me.

## Spine (locked)

| Branch | Decision |
|---|---|
| Frame | 3-tier hybrid: mission-bell (pure magazine), new-belgium + consume-and-create (magazine + earned shader chapter), craftedkit (zine) |
| Pixel | Max intensity — display chapter numerals + hero metadata + section labels + inline data callouts |
| GLSL scope | Hero + Image blocks + Chapter punctuations (no ambient backdrop) |
| Per-project | Shared image dither (uniforms-only variation), bespoke hero + chapter screens (narrative-illustrative) |
| Motion | Scroll-tied no pinning (β), craftedkit ch04 earns ONE pinned chapter screen |

## Phase 1 — Pixel typography (no shaders, lowest risk, biggest perceived shift)

- [ ] 1.1 `ChapterMark.tsx` — replace mono "Chapter 01" with giant `PixelTitle` Square numeral. Per-chapter animation sequence (fixed across projects): 01=`drop`, 02=`scramble`, 03=`wipe`, 04=`typewriter`, 05=`scramble`. Trigger via IntersectionObserver `once: true` on first viewport entry.
- [ ] 1.2 `CaseStudyHero.tsx` hero metadata strip (year/role/client) — Mono → Pixel-Square at 14px mobile / 16px desktop, tracking `0.18em`, drop CSS uppercase. Shrink to 3 items max.
- [ ] 1.3 Section labels ("Overview" / "Credits") — Pixel-Square at ≥14px.
- [ ] 1.4 New `InlineData` component — Pixel-Grid at body cap-height, same color, +`0.02em` tracking, `font-feature-settings: "tnum" 1`.
- [ ] 1.5 Hand-place inline `<InlineData>` callouts in existing project body copy: `98` (Lighthouse, C&C), year stamps, count callouts. Cap 1 per paragraph.
- [ ] 1.6 Mobile fallback: below 14px (Square) / 16px (Grid), serve `var(--font-geist-mono)`.

## Phase 2 — Image dither shared shader

- [ ] 2.1 New `<DitheredImage>` component — R3F `<mesh>` per image, plane geometry, image as `useTexture`, all sharing one cloned `ShaderMaterial`. HTML-as-layout / canvas-as-paint pattern (project to DOM rect of invisible placeholder).
- [ ] 2.2 Single persistent transparent `<Canvas>` mounted on `/work/[slug]/layout.tsx`, fixed position, `pointer-events: none`.
- [ ] 2.3 IntersectionObserver gates per-mesh `useFrame` so off-screen images skip work.
- [ ] 2.4 Build shader: 8×8 ordered Bayer dither + duotone base (resting state). Scroll-velocity-driven polka dot enlargement + CMYK channel offset (intensification, smoothed via `useSpring`).
- [ ] 2.5 Per-project uniform table keyed by slug: `uTint`, `uDotDensity`, `uDitherStrength`, `uVelocityGain`, `uChannelOffset` — values per agent A's recommendation.
- [ ] 2.6 Swap `MediaBlockRender.tsx` to render `<DitheredImage>` instead of `<Image>`.
- [ ] 2.7 Reduced-motion: clamp `uVelocityGain` and `uChannelOffset` to 0, hold dither at fixed mid.
- [ ] 2.8 Verify across all 4 projects, run `npm run guardrails`.

## Phase 3 — Hero shaders (4 bespoke)

- [x] 3.1 `<CaseStudyHeroShader>` shell — drei `<View>` projecting into existing CaseStudyCanvas, hosts intro 0→1 over 2s easeOutCubic via `useHeroUniforms`. sRGB encode tail in every shader.
- [x] 3.2 **mission-bell** — FBM ink-bleed + paper fiber + thumbnail as luminance mask, radial wave intro reveal.
- [x] 3.3 **new-belgium** — Double-domain-warp FBM + 5-stop palette (NB / Voodoo / Fat Tire / Oakshire / Bell's), spiral intro reveal.
- [x] 3.4 **consume-and-create** — Voronoi cells (count tied to scroll) + literal needle (sweeps from -90° on intro, rotates with scroll).
- [x] 3.5 **craftedkit** — 7-node SDF graph + pulse propagation along 8 edges, sequential node intro.
- [x] 3.6 Reduced-motion: hook clamps to `uScroll=0.5, uIntro=1, uTime=0`.
- [x] 3.7 `CaseStudyHero.tsx` swapped `<Image>` for `<CaseStudyHeroShader>`; gradient overlay kept for title legibility, Pixel metadata + Fraunces title preserved.

## Phase 4 — Chapter screens

- [x] 4.1 Extended `ContentBlock` with `ChapterScreenBlock` (`number`, `title`, `eyebrow?`, `shaderId: ChapterShaderId`, `scrollMode`).
- [x] 4.2 `<ChapterScreen>` reveal-dissolve — full-bleed `h-[100svh]`, drei `<View>` projecting per-shader scene, Pixel-Square number bottom-left + Pixel-Grid title top-left, `mix-blend-difference` text. Intersection-observer triggered on first entry.
- [x] 4.3 `<ChapterScreenPinned>` variant — `h-[400svh]` outer + sticky inner, scroll progress feeds `uScroll` 0→1 across full pin. Stage label updates 0→4 from same progress. Used by craftedkit ch04.
- [x] 4.4 **NB ch02 "Identity Prism"** — 5 anisotropic Gaussian beams split from common origin; spread tied to scroll, brightness ramps with intro.
- [x] 4.5 **C&C ch03 "Perf-Motion Braid"** — two sinusoidal ribbons (ink + amber) braid in middle band, scroll-windowed convergence.
- [x] 4.6 **craftedkit ch04 "Pipeline Flow"** (PINNED) — 5 nodes activate progressively across scrub, edges light wire-by-wire, pulses propagate, crystal-grid emerges past 85% progress.
- [x] 4.7 **craftedkit ch02 "Silhouette"** — 7-segment SDF path traces left→right tied to scroll; nodes light as path frontier passes them.
- [x] 4.8 **craftedkit ch03 "Hero Grid"** — 5×3 cells, each running one of 5 micro-shader kinds; staggered wake-up by hashed cell order driven by intro+scroll.
- [x] 4.9 **craftedkit ch05 "Output Lattice"** — solitary pulsing node + scroll-revealed perspective grid floor with twinkling thumbnail cells receding.
- [x] 4.10 `projects.ts` updated: NB ch02, C&C ch03, ck ch02/03/04/05 swapped from `chapter` → `chapter-screen`. Mission-bell untouched.
- [x] 4.11 `BlockRenderer.tsx` dispatches `chapter-screen` to `ChapterScreen` or `ChapterScreenPinned` based on `scrollMode`.
- [ ] 4.12 Static reduced-motion poster fallback per chapter screen — DEFERRED. Reduced-motion currently pins shader at `uScroll=0.5, uIntro=1` mid-state which is acceptable; posters are a polish pass.

## Leva debug panel

- [x] `CaseStudyDebugPanel.tsx` — mounts `<Leva />` only when `?leva` in URL (lazy-init, no setState in effect).
- [x] Per-hero `useControls` folders: `Hero — Mission Bell` (paper, ink), `Hero — New Belgium` (gain), `Hero — Consume & Create` (needle), `Hero — CraftedKit` (ck). Values mutate Color/scalar uniforms via `useEffect` without recreating the material.

## Out of scope (this pass)

- Ambient backdrop layer behind case study pages
- NextProject card shader preview
- Section transition curtains between non-chapter blocks
- Footer band shader signature
- Writing/editing chapter content (text stays as-is)
- Changes to mission-bell beyond Phases 1–3 (no chapter screens — that's the pure magazine tier)

## Files to touch

**Phase 1:**
- `web/src/components/case-study/ChapterMark.tsx`
- `web/src/components/case-study/CaseStudyHero.tsx`
- `web/src/components/case-study/TextBlockRender.tsx` (host for inline callouts)
- `web/src/components/case-study/InlineData.tsx` (new)
- `web/src/components/sections/PixelTitle.tsx` (add `once-on-enter` mode if not present)

**Phase 2:**
- `web/src/components/case-study/DitheredImage.tsx` (new)
- `web/src/components/case-study/MediaBlockRender.tsx`
- `web/src/app/work/[slug]/layout.tsx` (new — hosts persistent canvas)
- `web/src/lib/caseStudyImageUniforms.ts` (new — per-slug table)

**Phase 3:**
- `web/src/components/case-study/CaseStudyHeroShader.tsx` (new shell)
- `web/src/components/case-study/heroShaders/MissionBellHero.tsx` (new)
- `web/src/components/case-study/heroShaders/NewBelgiumHero.tsx` (new)
- `web/src/components/case-study/heroShaders/ConsumeCreateHero.tsx` (new)
- `web/src/components/case-study/heroShaders/CraftedkitHero.tsx` (new)
- `web/src/components/case-study/CaseStudyHero.tsx` (replace Image)

**Phase 4:**
- `web/src/data/projects.ts` (extend union, add chapter-screen entries)
- `web/src/components/case-study/BlockRenderer.tsx`
- `web/src/components/case-study/ChapterScreen.tsx` (new — reveal-dissolve)
- `web/src/components/case-study/ChapterScreenPinned.tsx` (new — for craftedkit ch04)
- `web/src/components/case-study/chapterShaders/*.tsx` (6 new shader modules)
- `web/public/case-study/<slug>/chapter-<n>-poster.webp` (rendered fallbacks)

## Risk register

- **Phase 2 perf** — 5–15 dithered images × 4 case studies. Single shared canvas + IntersectionObserver-gated frameloop must be airtight; otherwise scroll jank. Mitigation: cap active meshes to 4 simultaneously visible.
- **Phase 3 mount cost** — 4 distinct hero shaders means 4 separate compilations on first navigation. Acceptable since case study pages are statically generated and shaders compile once. Mitigation: lazy-import per-project shaders so visiting NB doesn't pay craftedkit's compile cost.
- **Phase 4 craftedkit ch04 scroll length** — 4× viewport pinned section adds ~1500px of vertical scroll budget to the page. Mitigation: confirm against existing chapter rhythm; if total page becomes unwieldy, drop to 3× viewport.
- **Pixel kitsch threshold** — animated giant pixel numerals across 4–5 chapters per project = 4–5 typographic "events." If overdone, reads as zine cosplay. Mitigation: animations fire `once: true`, settled state is calm, fixed sequence is invariant rhythm not novelty.

## Shipping order

Phase 1 ships first as a self-contained PR — addresses "stagnent" complaint immediately, no shader risk, all 4 projects benefit. Phases 2/3/4 each ship as their own PR. Phase 3 can split per-project into 4 sub-PRs if hero shader debugging gets long.

## Review

(filled after work completes)

---

# Homepage Mobile — Stacked Shader Layout

Mobile currently has NO shader scenes (`useCanvasGate` returns false for `< 768px`). Translating the desktop side-by-side choreography into a stacked top/bottom mobile equivalent. Spine locked via /grill-me.

## Spine (locked)

| Branch | Decision |
|---|---|
| Alternation | Keep — vertical alternation (top↔bottom) mirrors desktop's right↔left |
| Split ratio | 50/50, fixed across all 4 modules |
| Pattern | A: canvas TOP / BOTTOM / TOP / BOTTOM (hero → about → work → contact) |
| Lean | Keep — translate 12% horizontal shear → 12% vertical shear, leading-edge-leads |
| Work cards | 2x2 grid on mobile; absolute corner positioning gated to `md:` |
| Perf | Cap DPR to 1.5 on mobile, AA off on mobile. No shader iteration changes (ship + measure) |
| Scroll length | Keep 900svh — same timeline math, no per-viewport branches |
| Reduced motion | Unchanged — still kills the canvas at all viewports |
| Static fallback h1 | Unchanged — `!enableCanvas` correctly handles WebGL-off + reduced-motion cases |

## Per-module slot map

| Module | Canvas slot | Content slot |
|---|---|---|
| hero | TOP half | BOTTOM half (title + meta) |
| about | BOTTOM half | TOP half (bio) |
| work | TOP half | BOTTOM half (2x2 card grid) |
| contact | BOTTOM half | TOP half (CTA) |

## Phase M1 — Gate + viewport hook

- [x] M1.1 Add `useIsMobileViewport()` hook (or extend `useCanvasGate`) — returns boolean reactive to resize. Threshold: `< 768`.
- [x] M1.2 `useCanvasGate` drops the `>= 768` requirement. Now: WebGL + no-reduced-motion. Reduced-motion still kills the canvas at all sizes.

## Phase M2 — Timeline math (vertical translation)

- [x] M2.1 Add `MODULE_CANVAS_SLOT_MOBILE: Record<Module, 'top' | 'bottom'>` to `moduleTimeline.ts` — Pattern A.
- [x] M2.2 Add `canvasTopPct(progress)` — vertical analog of `canvasLeftPct`. Same smoothstep slide math, transposed axis.
- [x] M2.3 Reuse existing `canvasLeanFactor()` — same signed envelope; just consumed on the y-axis instead of x.

## Phase M3 — `HomeSceneRoot` viewport-conditional layout

- [x] M3.1 Switch canvas wrapper between desktop (`width: 50%; height: 100%; left: canvasLeft`) and mobile (`width: 100%; height: 50%; top: canvasTop`) based on `useIsMobileViewport()`.
- [x] M3.2 Switch clip-path between horizontal-shear and vertical-shear math. Vertical: `polygon(0% tly%, 100% try%, 100% bry%, 0% bly%)` where the bottom edge leads when sliding down.
- [x] M3.3 Switch DPR: `dpr={isMobile ? [1, 1.5] : [1, 2]}`, `antialias: !isMobile`.

## Phase M4 — Per-overlay constraints

- [x] M4.1 `HeroOverlay` — replace `inset-y-0` w/ `top-1/2 bottom-0` on mobile (since canvas TOP, content BOTTOM). Reset to `inset-y-0` at `md:`.
- [x] M4.2 `AboutOverlay` — `top-0 bottom-1/2` on mobile (canvas BOTTOM, content TOP). Reset at `md:`.
- [x] M4.3 `WorkOverlay` —
  - Container: `top-1/2 bottom-0` on mobile, reset at `md:`
  - Replace absolute corner `CORNER_POSITIONS` with mobile-only `grid grid-cols-2 grid-rows-2 gap-3 p-4` layout. Cards drop `absolute` + `max-w-[16rem]` + `w-[14rem]` on mobile; size adapts to grid cell. Keep desktop corner layout intact behind `md:` gate.
- [x] M4.4 `ContactOverlay` — `top-0 bottom-1/2` on mobile (canvas BOTTOM, content TOP). Reset at `md:`.

## Phase M5 — Verify

- [x] M5.1 (typecheck + lint clean; full build deferred to user — manual visual check pending in dev) `npm run guardrails` (lint + typecheck + asset check + build).
- [ ] M5.2 Manual: dev server + iPhone-width browser viewport. Test scroll through all 4 modules, verify:
  - Canvas visible top/bottom alternates correctly
  - Vertical shear visible during transitions
  - Work cards in 2x2 grid, all 4 visible, tappable
  - Hero title + bio readable in compressed bottom half
  - About bio readable in top half (no overlap with canvas below)
  - Contact email link tappable
- [ ] M5.3 Manual: desktop ≥768px regression check — desktop layout unchanged.
- [ ] M5.4 Manual: reduced-motion mobile — falls back to static h1, no canvas.

## Files to touch

- `web/src/lib/useCanvasGate.ts` (drop viewport gate)
- `web/src/lib/useIsMobileViewport.ts` (new — or extend useCanvasGate)
- `web/src/lib/moduleTimeline.ts` (add mobile slot map + `canvasTopPct`)
- `web/src/components/sections/HomeSceneRoot.tsx` (viewport-conditional canvas wrapper)
- `web/src/components/sections/HeroOverlay.tsx`
- `web/src/components/sections/AboutOverlay.tsx`
- `web/src/components/sections/WorkOverlay.tsx`
- `web/src/components/sections/ContactOverlay.tsx`

## Out of scope

- Per-shader iteration tuning (deferred until on-device profiling shows a problem)
- Device tier detection beyond viewport-width
- Mobile-specific shader visual variants (e.g. portrait-aware framing)
- Touch gesture handling beyond standard scroll
- The pre-existing visual collision between fallback h1 and HeroOverlay's PixelTitle when canvas is off

## Mobile Review

**What changed:**

- `useCanvasGate` no longer denies mobile viewports. Canvas renders for any viewport that has WebGL + no reduced-motion. Reduced-motion still falls back to the static h1.
- New `useIsMobileViewport()` hook (`web/src/lib/useIsMobileViewport.ts`) — reactive `< 768px` boolean used by `HomeSceneRoot` to switch layout/perf params.
- `moduleTimeline.ts` gains `MODULE_CANVAS_SLOT_MOBILE` (Pattern A: top/bottom/top/bottom) and `canvasTopPct(progress)` — vertical analog of the existing `canvasLeftPct`. Existing `canvasLeanFactor` is reused; on mobile its sign is negated in `HomeSceneRoot` because the mobile slot pattern is the exact mirror of desktop's right/left pattern, so the natural sign flips for "lean into direction of travel."
- `HomeSceneRoot` swaps the canvas wrapper between desktop (50% width, slides left/right, horizontal shear) and mobile (50% height, slides top/bottom, vertical shear) based on the new viewport hook. DPR caps at 1.5 on mobile, antialiasing off on mobile.
- `HeroOverlay` constrained to bottom half (`top-1/2 bottom-0`) on mobile (canvas TOP).
- `AboutOverlay` and `ContactOverlay` constrained to top half (`top-0 bottom-1/2`) on mobile (canvas BOTTOM).
- `WorkOverlay` constrained to bottom half on mobile, container becomes a `grid grid-cols-2 grid-rows-2` and cards drop their absolute corner positioning + fixed `w-[14rem]`. Card title shrinks from `text-xl` → `text-sm` on mobile to fit the smaller cells. Desktop layout is fully preserved behind `md:` gates. `CORNER_POSITIONS` are now `md:`-only.
- The "Work" PixelTitle is hidden on mobile to avoid colliding with the 2x2 grid.

**Why these calls (locked via /grill-me):**

| Decision | Rationale |
|---|---|
| Alternation kept | Preserves the desktop choreography rhythm — what makes transitions feel choreographed, not just cross-faded |
| 50/50 split | Direct mirror of desktop. No timeline math branches, no per-module size variance |
| Pattern A (top/bottom/top/bottom) | Wins on about (text reads first up top) and work (cards in thumb-reach zone). Trades contact CTA being slightly out of thumb-reach as the only ergonomic loss |
| Vertical shear at 12% | Same `SLASH_PEAK_PCT` constant produces ~7° on mobile vs ~6° on desktop — visually equivalent intensity |
| 2x2 grid for work | Preserves the "contact sheet" gestalt over swipe-carousel's hide-3-of-4 cost |
| DPR 1.5 + AA off | Cheapest perf insurance; no shader changes needed. Tier 2-3 measures deferred until on-device profiling demands them |
| Scroll length unchanged | The timeline IS the experience; compressing it for "mobile feel" trades craft for nothing real |

**Verification:**

- `npm run typecheck` clean.
- `npm run lint` clean.
- Manual visual check on real mobile viewport pending — hand off to user. Expected: canvas alternates top↔bottom across hero/about/work/contact, vertical shear visible during transitions, all 4 work cards visible in 2x2 grid.

**Files touched:**

- `web/src/lib/useCanvasGate.ts` (drop viewport gate)
- `web/src/lib/useIsMobileViewport.ts` (new)
- `web/src/lib/moduleTimeline.ts` (mobile slot map + canvasTopPct)
- `web/src/components/sections/HomeSceneRoot.tsx` (viewport-conditional wrapper, vertical shear, DPR/AA cap)
- `web/src/components/sections/HeroOverlay.tsx`
- `web/src/components/sections/AboutOverlay.tsx`
- `web/src/components/sections/WorkOverlay.tsx`
- `web/src/components/sections/ContactOverlay.tsx`

---

# Hero + About Shader Morph Pass

Hero and about both gain scroll-driven keypoint morphing on the existing `BackgroundField.tsx` fragment shader. Hero: SDF morph through 4 silhouettes. About: line-field pattern morph through 4 patterns. Both share the design language (linger-then-whoosh easing, dissolve mid-segment, scroll-tied rotation rhythm) but differ in *what's morphing* and *what the dissolve texture is* (hero = FBM dissolve, about = stagger-based phase offset).

## Spine (locked)

| Branch | Decision |
|---|---|
| Hero engine | SDF blending (`mix(sdA, sdB, t)`) — pseudo-SDF, fine for ring rendering |
| Hero keypoints | 4: circle → triangle → square → hexagon. Triangle pre-rotated 30°, hexagon pre-rotated 30° — all four share a vertical symmetry axis. Inscribed-circle radii matched so apparent area stays constant through the morph |
| Hero segment select | Branchless: evaluate all 4 SDFs every pixel, pick A/B endpoints via `step()` masks. ~55 ops total, well under budget |
| Hero easing | `smoothstep(0.15, 0.85, segmentLocalT)` — 15% linger plateaus + 70% cubic ease-in-out. Asymmetric whoosh deferred (worth tuning post-MVP) |
| Hero morph activity | Double-smoothstep tent (zero derivative at keypoints, broad mid-segment peak) feeds FBM warp amplitude |
| Hero rotation | Scroll-driven, velocity gated by morph activity tent. Magnitude ~30–45° total drift, Leva-tunable |
| Hero radius arc | Drop the existing `uHeroRadiusIdle/Peak/Exit` system — keep ring at fixed radius so morph does the visual work |
| About engine | Weighted-axis `max()` compositing. Each pattern is a vector of axis weights; morph = lerp the weight vector |
| About axis set | 6 unique axes covering all 4 patterns: H, V, /, \, ◣ (60°), ◤ (120°). Each pattern is a 6-element weight vector |
| About keypoints | 4: Plus → X → Triangle → Asterisk |
| About dissolve | Per-axis stagger — small phase offset on each axis's coord input, modulated by morph activity tent. Differentiates mid-morph from destination keypoints (avoids the "Plus@50% + X@50% ≡ Asterisk" collision) |
| About wave amp | Tent-modulated to peak with morph activity, calm at keypoints |
| About rotation | ~10° drift, gated by morph activity (less than hero — Plus→X already encodes 45° rotation) |
| Scroll damping | New: lerp displayed scroll toward actual scrollYProgress at ~0.10. Prevents flick-scroll from blowing past keypoints. Lives in `BackgroundField` so only the shader-driven motion is damped (HTML overlay opacities still ride raw scroll) |

## Phase H — Hero shape morph

- [x] H1 Add SDF helpers to `BackgroundField.tsx` fragment: `sdCircle`, `sdEquilateralTriangle`, `sdBox`, `sdHexagon`. All sized by inscribed-circle radius. Pre-rotate triangle and hexagon for shared vertical symmetry axis.
- [x] H2 Add segment-select helpers: branchless via `step()` masks for `dA`, `dB`, segment-local `lt`.
- [x] H3 Add easing helpers: `linger(lt) = smoothstep(0.15, 0.85, lt)`, `tent(lt) = smoothstep(0.0, 0.5, lt) * smoothstep(1.0, 0.5, lt)`.
- [x] H4 Rewrite `modeHero(p, t)`: rotate `p` by accumulated rotation, segment-select, `mix` SDFs, FBM warp amplitude `= base + peak * tent(lt)`, render as `abs(d) - thickness` band.
- [x] H5 New uniforms: `uHeroShapeRadius`, `uHeroWarpBase`, `uHeroWarpPeak`, `uHeroRotRate`. Drop the 3-stop idle/peak/exit arcs for warp + radius.
- [x] H6 (HERO_PRESETS re-keyed too) Update Leva folder + `HERO_PRESETS` for new uniform schema.

## Phase A — About pattern morph

- [x] A1 Replace `uAboutPattern` int with 6-axis weight vectors. Static pattern-table constants for Plus / X / Triangle / Asterisk.
- [x] A2 Add `gridLine` calls along all 6 axes. Compose final field via weighted `max`.
- [x] A3 Implement scroll-driven blend across about window (`0.16 → 0.56`), segment-select between the 4 weight vectors, lerp via `linger(lt)`.
- [x] A4 Add per-axis stagger phase offset, modulated by `tent(lt)`. This is the dissolve mechanic that keeps mid-morph distinct from Asterisk-as-destination.
- [x] A5 Wave amp tent-modulated: `waveAmp = base + peak * tent(lt)`.
- [x] A6 Apply `mat2` rotation to `q` before pattern eval, capped at ~10° total drift.
- [x] A7 (ABOUT_PRESETS re-keyed too) Update Leva folder + `ABOUT_PRESETS` for new uniform schema.

## Phase S — Scroll damping

- [x] S1 In `BackgroundField`, damp scroll: `displayedScroll += (scrollRef.current - displayedScroll) * 0.10`. Feed `displayedScroll` to `uScroll`. HTML overlays keep raw scroll for opacity sync.

## Phase V — Verify

- [x] V1 (typecheck clean) `npm run typecheck`
- [x] V2 (lint clean) `npm run lint`
- [ ] V3 Manual: scroll slowly through hero — 4 distinct shapes with FBM dissolve between, subtle rotation. Then about — 4 distinct patterns with stagger dissolve.
- [ ] V4 Manual: flick scroll — damping should cause morphs to traverse keypoints visibly rather than snap to end state.
- [ ] V5 Manual: mobile-width — flag if keypoints are illegible at 50% canvas height.

## Out of scope (this pass)

- Asymmetric ease-out tuning (start with `smoothstep(0.15, 0.85)`, refine post-live)
- Mobile keypoint reduction (start with 4 across all viewports)
- Dither/blue-noise alternative dissolve texture (research flagged as more on-brand for brutalist-craft; defer)
- COMBO_PRESETS re-keying — single pass after Leva schema settles
- Work and contact modules

## Files to touch

- `web/src/components/sections/BackgroundField.tsx` (bulk: shader rewrites, uniform schema, Leva, scroll damping)
- `web/src/components/sections/backgroundPresets.ts` (HERO_PRESETS + ABOUT_PRESETS re-keyed)

## Morph Pass Review

**What changed:**

- **Hero shader (`modeHero`)** — replaced the radius-arc + warp-arc fluid ring with an SDF morph through 4 keypoints (circle → triangle → square → hexagon). Inigo Quilez canonical 2D SDFs (`sdCircle`, `sdEquilateralTriangle`, `sdBox`, `sdHexagon`); hexagon pre-rotated 30° for shared vertical-symmetry axis. Branchless segment select via `step()` masks. `mix(dA, dB, linger(lt))` blends the SDFs; `linger(lt) = smoothstep(0.15, 0.85, lt)` gives 15% plateau at each keypoint with cubic ease through the middle 70%. FBM warp amplitude tent-modulated by `tent(lt) = smoothstep(0,0.5,lt)*smoothstep(1,0.5,lt)` — calm at keypoints, turbulent mid-segment, so the shape *dissolves into noise* through transitions and *crystallizes* at each polygon. Scroll-driven rotation paced by the same `linger`/segment cadence so all three motion channels (geometry / texture / orientation) share one rhythm.
- **About shader (`modeAbout`)** — replaced the discrete `uAboutPattern` int with weighted-axis-max compositing across 6 unique axes (V, H, /, \, 60°, 120°). Each pattern is two `vec3` weight constants; morph = lerp the weight vectors via `linger(lt)`. Per-axis phase stagger (each axis gets `sin(t * 1.3 + i)` shifted into its coord, gated by `tent(lt)`) keeps the mid-morph state visually distinct from the Asterisk keypoint — addresses the "Plus@50% + X@50% ≡ Asterisk" collision flagged by the line-field research. Wave amplitude also tent-modulated. ~10° rotation drift gated by morph cadence (less than hero, since Plus→X already encodes a 45° axis rotation visually).
- **Scroll damping** — new in `BackgroundField`'s `useFrame`: `displayedScroll += (scrollRef.current - displayedScroll) * (1 - exp(-6 * dt))`. Frame-rate-independent exponential lerp (~0.10 at 60fps). Feeds `uScroll`. HTML overlays continue reading raw scroll for opacity sync, so only the shader timeline gets damped — flick-scrolling no longer skips through morph keypoints.
- **Leva schema** — Hero folder gains `heroShapeRadius`; ScrollArc sub-folder replaced by ShapeArc with `heroWarpBase` / `heroWarpPeak` / `heroRotRate`. About folder loses the pattern dropdown; gains `aboutGridScale`; AboutScrollArc replaced by AboutMorph with `aboutWaveBase` / `aboutWavePeak` / `aboutStaggerStrength` / `aboutRotRate`.
- **Presets** — `HeroPreset` + `AboutPreset` types re-keyed. All 5 presets per scene re-tuned to the new uniform schema with vibe-equivalent values (Halo stays delicate, Ferrofluid stays loud, etc.). `COMBO_PRESETS` reference preset names only, no changes needed.

**Cost note:** ~55 ALU ops per pixel for the hero SDF block (4 SDFs + segment select + mix + AA edge) — under one FBM call's worth and well under the 1080p@60fps budget. About goes from 4 conditional gridLine evaluations to 6 unconditional + weighted max — also negligible. The added rotation matrix mul is one `mat2 * vec2`. Branchless `step()` masks chosen explicitly because GPU branch predication is more expensive than the wasted ops.

**Out of scope (deferred):**
- Asymmetric ease-out (research recommended over symmetric `smoothstep`, but symmetric is easier to tune; revisit after live feedback)
- Mobile keypoint reduction (currently 4 keypoints across all viewports; reduce to 3 if illegible at 50%-height mobile canvas)
- Dither/blue-noise dissolve as alternative to FBM (motion research flagged as more on-brand for brutalist-craft; FBM stays as the v1)
- Re-tuning `COMBO_PRESETS` thresholds — they reference preset names only and combo selection re-fires per-scene preset onChange handlers, so they should still work

**Verification:**
- `npm run typecheck` clean
- `npm run lint` clean
- Manual visual + flick-scroll test pending — hand off to user

**Files touched:**
- `web/src/components/sections/BackgroundField.tsx`
- `web/src/components/sections/backgroundPresets.ts`

---

# Homepage Preset Family + About Plus-Grid Rework

Two coupled passes on `BackgroundField.tsx` + `backgroundPresets.ts`:
(1) Replace named presets across hero/work/contact with a coherent topographic family using the user's screenshot-tuned values as canonical.
(2) Hard-replace the About line-field shader with a tessellated plus-glyph SDF mosaic that morphs through 4 keypoints with radial spatial stagger.

Spine locked via /grill-me. No homepage trail visuals — preset names are internal/Leva labels only (saved to memory: `project_homepage_design_vocabulary.md`).

## Spine (locked)

| Branch | Decision |
|---|---|
| Preset strategy (hero/work/contact) | Rename + retune. Replace `Halo`/`Macro`/`Quiet Crossing` with `Switchback`/`Saddle`/`Crossing` using screenshot values. Old preset entries deleted from `backgroundPresets.ts`; not coexisting. |
| Preset strategy (about) | Hard-replace. All 5 line-field presets (`Linen`/`Swarm`/`Origami`/`Sonar`/`Halftone`) deleted. Two net-new presets: `Ridgeline` (default, dense) + `Bench` (sparse variant). |
| About shader engine | Per-cell SDF morph via domain repetition. Mirrors hero's idiom (4 keypoints, `linger(lt)` + `tent(lt)`) but tessellated. |
| About keypoints | 4: `Plus → X → Diamond → Circle`. Stroke-to-fill narrative: hairline cross → diagonal cross → solid diamond → soft disk. |
| About spatial stagger | Radial propagation. Per-cell phase offset `= length(cellCenter - radialCenter) * staggerStrength`. Focal point opposite the body copy (left-of-center on desktop). |
| About cell density | `aboutGridScale ≈ 14` cells across viewport width default; `Bench` preset uses ~8. |
| About copy/overlay | Untouched. `AboutOverlay.tsx` keeps current text and layout — this pass is shader-only. |
| Combo preset | `Recommended` re-keyed to point at new family names. |
| Reduced motion | No new fallback work — existing `useCanvasGate` already kills the canvas under reduced-motion. |

## Phase P — Preset family rename + retune (hero / work / contact)

- [ ] P1 `backgroundPresets.ts` — delete `Halo` from `HERO_PRESETS`. Add `Switchback` with values:
  - `heroRingThickness: 0.01` (was 0.018 in Halo)
  - `heroShapeRadius: 0.30` (was 0.42)
  - `heroDisturbanceLength: 4.5`
  - `heroWarpSpeed: 0.12`
  - `heroWarpBase: 0.015`, `heroWarpPeak: 0.10`, `heroRotRate: 0.5`
- [ ] P2 `backgroundPresets.ts` — delete `Macro` from `WORK_PRESETS`. Add `Saddle` with values:
  - `workDitherBias: 0.0`
  - `workContrast: 1.5`
  - `workDitherIdle: 12`, `workDitherPeak: 11.5`, `workDitherExit: 8.5`
  - **OPEN QUESTION:** Original `Macro` had `idle: 14, peak: 8, exit: 16` (peak < idle = dot shrinks at attention apex). Screenshot has `peak ≈ idle` (almost flat) and `exit < peak` (dots smaller at exit). This is a different motion pattern — confirm intentional before shipping. Default to screenshot values until confirmed.
- [ ] P3 `backgroundPresets.ts` — delete `Quiet Crossing` from `CONTACT_PRESETS`. Add `Crossing` with values:
  - `contactStripeScale: 19` (was 30)
  - `contactLineWidth: 0.08`
  - `contactRotSpeed: 0.01` (was 0.015)
  - `contactOffsetIdle: 0.18`, `contactOffsetPeak: 0.0`, `contactOffsetExit: 0.0`
- [ ] P4 `BackgroundField.tsx:569` — change `heroPreset: { value: 'Halo' }` → `'Switchback'`. Update Leva initial slider values to match `Switchback` exactly.
- [ ] P5 `BackgroundField.tsx:624` — change `workPreset: { value: 'Newsprint' }` → `'Saddle'`. Update Leva initial slider values.
- [ ] P6 `BackgroundField.tsx:649` — change `contactPreset: { value: 'Quiet Crossing' }` → `'Crossing'`. Update Leva initial slider values.
- [ ] P7 `backgroundPresets.ts` `COMBO_PRESETS` — update `Recommended` (and any other combo referencing the old names) to reference `Switchback` / `Ridgeline` / `Saddle` / `Crossing`. Audit other combos for stale references.

## Phase R — About plus-grid rework

- [ ] R1 `BackgroundField.tsx:239–320` — delete the entire `modeAbout()` line-field implementation (6-axis weighted-max composite, all 4 line-field keypoint constants, all stagger phase offset code).
- [ ] R2 Add new SDF helpers near hero's SDF block (BackgroundField.tsx ~147–176):
  - `sdPlus(p, armLen, armWidth)` — two crossed boxes via `min(sdBox(p, vec2(L,W)), sdBox(p, vec2(W,L)))`.
  - `sdX(p, armLen, armWidth)` — `sdPlus` with 45° rotated `p`.
  - `sdDiamond(p, halfDiag)` — `dot(abs(p), vec2(0.7071)) - halfDiag`.
  - `sdCircle` already exists — reuse.
- [ ] R3 Write new `modeAbout(p, t)`:
  - Domain repeat: `vec2 cell = p * uAboutGridScale; vec2 cellId = floor(cell); vec2 cellP = fract(cell) - 0.5;`
  - Per-cell radial phase offset: `float phase = length(cellId / uAboutGridScale - uAboutRadialCenter) * uAboutStaggerStrength;`
  - Per-cell scroll progress: `float lt = clamp((uScroll - aboutEnter + phase) / (aboutExit - aboutEnter), 0.0, 1.0);`
  - Segment select (3 segments) using same branchless `step()` pattern as hero (BackgroundField.tsx:184–237).
  - SDF endpoints: `dA = sdfForKeypoint(i, cellP)`, `dB = sdfForKeypoint(i+1, cellP)`. Inline 4 SDFs guarded by `step()` masks.
  - Morph: `float d = mix(dA, dB, linger(segLt));`
  - Render as `1.0 - smoothstep(0.0, edgeWidth, d)` for filled glyph, or `1.0 - smoothstep(uAboutStrokeWidth, uAboutStrokeWidth+edgeWidth, abs(d))` for stroked. Use stroke style — keypoints 1+2 (Plus, X) are inherently stroked; SDF magnitude controls fill, so `Diamond` and `Circle` keypoints will read as outlined glyphs too. (Alternative: use `d` directly with smoothstep for fill — confirm visual fit during dev.)
  - Subtle wave amp: `tent(segLt) * uAboutWaveAmp` warps `cellP` lightly so mid-morph isn't pixel-locked.
- [ ] R4 New uniforms in `BackgroundField.tsx`:
  - `uAboutGridScale` (float, default 14.0)
  - `uAboutStrokeWidth` (float, default 0.07)
  - `uAboutRadialCenter` (vec2, default `vec2(-0.35, 0.0)`)
  - `uAboutStaggerStrength` (float, default 0.30)
  - `uAboutWaveAmp` (float, default 0.05)
  - `uAboutRotRate` (float, default 0.10)
- [ ] R5 Delete old About uniforms no longer used: `uAboutLineWidth`, `uAboutWaveFreq`, `uAboutWaveSpeed`, `uAboutWaveBase`, `uAboutWavePeak`, `uAboutStaggerStrength` (rename if reusing). Verify uniform map cleanup against `uniforms` block.
- [ ] R6 `backgroundPresets.ts` — delete entire `ABOUT_PRESETS` array (`Linen`, `Swarm`, `Origami`, `Sonar`, `Halftone`). Re-key `AboutPreset` type to new uniform names. Add two presets:
  - `Ridgeline` (default): `aboutGridScale: 14`, `aboutStrokeWidth: 0.07`, `aboutRadialCenter: [-0.35, 0]`, `aboutStaggerStrength: 0.30`, `aboutWaveAmp: 0.05`, `aboutRotRate: 0.10`
  - `Bench` (sparse): `aboutGridScale: 8`, `aboutStrokeWidth: 0.10`, `aboutRadialCenter: [-0.35, 0]`, `aboutStaggerStrength: 0.45`, `aboutWaveAmp: 0.06`, `aboutRotRate: 0.10`
- [ ] R7 `BackgroundField.tsx` Leva folder for About — replace existing controls with new uniform schema. `aboutPreset: 'Ridgeline'` default. AboutMorph subfolder hosts `radialCenterX`, `radialCenterY`, `staggerStrength`, `waveAmp`, `rotRate`.
- [ ] R8 `BackgroundField.tsx` uniform-sync `useEffect` (lines 702–709) — replace About branch to push new uniform names. Verify `uHeroExit` / `uAboutExit` / `uWorkExit` / `uContactExit` still drive timeline correctly.

## Phase V — Verify

- [ ] V1 `npm run typecheck`
- [ ] V2 `npm run lint`
- [ ] V3 `npm run build` (catch shader compile errors at SSR-build time if any)
- [ ] V4 Manual: scroll slowly through About — discrete plus glyphs visible at scroll start, morph radially through `+ → X → Diamond → Circle` keypoints, focal point left-of-center. Glyphs distinguishable at every keypoint.
- [ ] V5 Manual: flick-scroll through About — keypoints traverse visibly (existing scroll damping handles this), no skipping.
- [ ] V6 Manual: hero/work/contact — `Switchback` / `Saddle` / `Crossing` preset names appear in Leva dropdown, default selection on load matches the screenshot tuning.
- [ ] V7 Manual: Leva combo dropdown — `Recommended` triggers the four new presets, no stale name errors.
- [ ] V8 Manual: mobile viewport — About plus-grid legible at 50%-height canvas. If cells too dense at compressed height, flag for follow-up.

## Files to touch

- `web/src/components/sections/BackgroundField.tsx` (bulk: shader rewrite for `modeAbout`, new SDF helpers, uniform schema, Leva folder, default preset names)
- `web/src/components/sections/backgroundPresets.ts` (delete + add presets across all 4 modules; re-key `AboutPreset` type)

## Out of scope (this pass)

- About overlay copy / layout (`AboutOverlay.tsx` untouched)
- Hero / Work / Contact shader logic (only preset values change, not the shader code)
- Module timeline windows (`moduleTimeline.ts` untouched)
- Mobile-specific About cell density (defer until manual verification flags it)
- Adding more than 2 About presets — `Ridgeline`/`Bench` is the shipping pair; further variants deferred
- Any Antigravity/CraftedKit-related changes
- Any test/Storybook scaffolding (no test framework in repo)

## Risk register

- **Plus-glyph SDF aliasing at high `gridScale`** — at ~14 cells across with thin strokes (~0.07 cell units), edges may shimmer on retina mobile. Mitigation: smoothstep edge width tied to `fwidth(d)` for analytic AA. Already standard in hero's SDF render.
- **Radial focal point on mobile** — desktop default `vec2(-0.35, 0.0)` puts focal point left-of-center, opposite the right-side copy. On mobile (per-existing M-phase work) the canvas is in a 50%-height slot and copy is in the OTHER half — focal point math needs to make sense regardless of which half is canvas. Mitigation: keep focal point in canvas-local coords, not viewport coords. Verify in V8.
- **Macro→Saddle peak/exit inversion (P2)** — the screenshot values invert the dither motion direction relative to original `Macro`. This may be intentional (user prefers dots shrinking on *exit* not *peak*) or an artifact of mid-tweak Leva state. Flagged for explicit confirmation before merging.
- **Combo preset references** — `Recommended` and possibly other `COMBO_PRESETS` reference the old names. Stale references will cause silent fallback to first available preset. Mitigation: P7 audits all combo entries; V7 confirms manually.
- **Diamond and Circle keypoints look near-identical at small cell sizes** — at `gridScale=14`, a stroked diamond and stroked circle are ~6px apart in apparent silhouette. Mitigation: ensure `Diamond` keypoint has slightly wider stroke or different fill style than `Circle` so the morph reads as a distinct keypoint, not a wash.

## Review

**What changed:**

- **Preset family rename + retune (hero / work / contact).** `Halo` → `Switchback`, `Macro` → `Saddle`, `Quiet Crossing` → `Crossing`. Old preset entries deleted from `backgroundPresets.ts`. New presets bake the screenshot-tuned values as canonical. Hero `Switchback`: `heroRingThickness 0.018→0.01`, `heroShapeRadius 0.42→0.30`, `heroWarpPeak 0.10`, `heroRotRate 0.5` (last two pulled from prior `Halo` since not in screenshot). Work `Saddle`: `workContrast 1.5`, `workDitherIdle 12 / Peak 11.5 / Exit 8.5`. Contact `Crossing`: `contactStripeScale 19`, `contactRotSpeed 0.01`. Leva initial slider values + uniform initial values updated to match.
- **About preset replace (hard).** All 5 line-field presets (`Linen`/`Swarm`/`Origami`/`Sonar`/`Halftone`) deleted. Replaced with two net-new presets driving the new plus-grid shader: `Ridgeline` (default, `gridScale 14`, `strokeWidth 0.07`, `staggerStrength 0.3`) + `Bench` (sparse, `gridScale 8`, `strokeWidth 0.10`, `staggerStrength 0.45`). `AboutPreset` type re-keyed.
- **About shader hard-replace.** Old line-field `modeAbout` (6-axis weighted-max composite) deleted entirely. New plus-grid SDF mosaic: domain repetition tessellates the canvas into cells via `floor(p * gridScale)` / `fract(p * gridScale) - 0.5`. Each cell hosts a glyph that morphs through 4 SDF keypoints — `Plus → X → Diamond → Circle` — using hero's exact `linger(lt)` + `tent(lt)` cadence. Branchless segment endpoint pick via `step()` masks (3 segments, 4 endpoints). Filled-glyph render via `1.0 - smoothstep(-fw, fw, d)`.
- **Per-cell radial phase offset.** Each cell's morph timeline lags by `length(cellCenter - uAboutRadialCenter) * uAboutStaggerStrength`. Result: morph wave radiates from focal point (default `[-0.35, 0]` = left-of-center, opposite the body copy on desktop). Per-cell timeline rescaled so peripheral cells still finish within the global about window: `(globalT01 - phase) / (1 - maxPhase)`.
- **New SDF helpers** added next to hero's SDF block: `sdPlus` (union of two boxes), `sdX` (`sdPlus` with rotated input), `sdDiamond` (L1 norm). `sdCircle` reused.
- **About uniform schema replaced.** Removed: `uAboutLineWidth`, `uAboutWaveFreq`, `uAboutWaveSpeed`, `uAboutWaveBase`, `uAboutWavePeak`. Added: `uAboutStrokeWidth`, `uAboutRadialCenter` (vec2), `uAboutWaveAmp`. Kept: `uAboutGridScale`, `uAboutStaggerStrength`, `uAboutRotRate`. Leva folder + uniform-sync `useEffect` updated.
- **`uAboutRotRate`** now drives a subtle progressive global rotation of the grid across the full about window (`globalAngle = uAboutRotRate * globalT01`), not the per-segment rotation pacing the old shader used.
- **Combo presets re-keyed.** `Recommended` references `Switchback / Ridgeline / Saddle / Crossing`. Other combos (`Loud`, `Editorial`, `Print`) audited and updated to use only valid preset names.

**Open questions / flags:**

- **`Saddle` peak/exit inversion (P2)** — original `Macro` had `idle 14, peak 8, exit 16` (dots shrink at attention apex). New `Saddle` has `idle 12, peak 11.5, exit 8.5` per screenshot — a different motion shape. Shipping screenshot values per user direction; confirm intentional during visual check.
- **About copy untouched.** `AboutOverlay.tsx` not modified — overlay text/layout unchanged. Confirm during V4 manual check.
- **Cell aspect on mobile** — at `gridScale 14` and 16:9 desktop, ~25 cells horizontally × 14 vertically. On mobile's 50%-height canvas slot, vertical cell count halves while horizontal stays — cells become tall rectangles unless aspect-correction shifts. Flagged in V8.

**Verification:**

- `npm run typecheck` clean.
- `npm run lint` clean.
- `npm run build` clean (Turbopack compile + 15 static pages).
- Manual V4–V8 pending — hand off to user via `npm run dev`.

**Files touched:**

- `web/src/components/sections/BackgroundField.tsx`
- `web/src/components/sections/backgroundPresets.ts`

---

# Case Study — Companion Canvas (B2 + 3B)

Replace four bespoke hero shaders + six chapter shaders with **one** unified black-and-white Moiré-family canvas that spawns full-size in the hero, docks to the bottom-right corner on scroll past hero, and snaps through five discrete states tied to chapter boundaries. Spine locked via /grill-me.

## Spine (locked)

| Branch | Decision |
|---|---|
| Frame | **B** — small persistent morphing companion canvas. No full-bleed chapter shaders |
| Hero behavior | **B2** — companion spawns at ~60vmin centered in hero, docks to corner on scroll past hero (sub-600ms ease-out) |
| Dock target | Bottom-right, **280px circle**, 24px viewport inset |
| Behavior model | **3B — chapter-snap**. Discrete state per chapter; ~800ms eased transition between states |
| Aesthetic | Black & white Moiré family (no brand color in shader output) |
| State grammar | 5 named states shared across all shaders: **Rings, Stripes, Spiral, Grid, Bloom** |
| Per-study | **4 sibling shaders** in the Moiré family — same 5-state grammar, different visual *dialect* per study |
| Shader → study | `ripple` → mission-bell · `concentric` → new-belgium · `stripe` → consume-and-create · `lattice` → craftedkit |
| Brand color preserved in | `DitheredImage` (image dither tints), Pixel typography accents — only hero+chapter shaders strip color |
| Reduced motion | Companion holds first state, starts docked, no scroll/time uniforms |

## Phase 5.1 — Foundation (additive, nothing removed)

- [x] 5.1.1 New `web/src/lib/companionStates.ts` — `ChapterStateName` type (`'rings' | 'stripes' | 'spiral' | 'grid' | 'bloom'`) + helper to map name → integer index for shader uniform.
- [x] 5.1.2 New `web/src/lib/companionStateLibrary.ts` — per-slug `Record<Slug, { shader: ShaderGenus; states: ChapterStateName[] }>`. Initial mapping:
  - `mission-bell`: shader `ripple`, states [Rings, Bloom, Stripes, Grid, Spiral]
  - `new-belgium`: shader `concentric`, states [Stripes, Spiral, Grid, Bloom, Rings]
  - `consume-and-create`: shader `stripe`, states [Spiral, Stripes, Grid, Rings, Bloom]
  - `craftedkit`: shader `lattice`, states [Grid, Spiral, Stripes, Bloom, Rings]
- [x] 5.1.3 New `web/src/lib/useChapterStateStore.ts` — Zustand store: `{ current, prev, transitionStart, setState(name) }`. `setState` snapshots current as `prev`, sets `transitionStart` to now. On rapid re-fire, snapshots interpolated state (not `current`) so flick-scroll doesn't reset visually.
- [x] 5.1.4 New `web/src/components/case-study/CompanionCanvas.tsx` — `position: fixed` wrapper with two phases (`.hero` / `.corner`). Hosts R3F `<Canvas>` + `<ScreenQuad>`. Selects shader by slug → `ShaderGenus` from library.
- [x] 5.1.5 **4 shader files** under `web/src/components/case-study/companionShaders/`:
  - `RippleMoire.tsx` — concentric ripples, soft radial. (Mission Bell)
  - `ConcentricMoire.tsx` — offset ring rosettes. (New Belgium)
  - `StripeMoire.tsx` — phase-warped stripe systems. (Consume & Create)
  - `LatticeMoire.tsx` — overlapping dot/line grids. (CraftedKit)

  Each implements all 5 named states as fragment-shader primitives + `mix(statePrev, stateCurrent, ease(transitionT))` blend. ~800ms transition. sRGB encode tail. Shared TS skeleton (registry + uniform sync) lives in `companionShaders/shared.ts`.
- [x] 5.1.6 Dock animation — wrapper has CSS classes `.companion--hero` (60vmin centered) and `.companion--corner` (280px bottom-right, 24px inset). Sentinel `<div>` at hero bottom; IntersectionObserver toggles class. CSS `transition: all 540ms cubic-bezier(0.22, 1, 0.36, 1)`.
- [x] 5.1.7 Reduced-motion: dock immediately on mount, lock state to `library.states[0]`, `uTime`/`uScroll` clamped to 0, no transitions.

## Phase 5.2 — Wire chapters

- [x] 5.2.1 Extend `ChapterBlock` (and `ChapterScreenBlock` if still used) in `projects.ts` with optional `companionState?: ChapterStateName`. If absent, derive from per-slug library by chapter index.
- [x] 5.2.2 `ChapterMark.tsx` — IntersectionObserver fires `useChapterStateStore.setState(block.companionState)` when chapter enters viewport. `rootMargin` tuned so transition starts mid-scroll-into-chapter, not at the moment of entry.
- [x] 5.2.3 Hero state = library[0]. Companion holds it from page load through dock; first chapter triggers first transition.

## Phase 5.3 — Cutover

- [ ] 5.3.1 `CaseStudyHero.tsx` — drop `<CaseStudyHeroShader>` mount. Hero becomes HTML-only (Pixel metadata, Fraunces title, lede, tags). Visual hook now provided by companion in its hero-phase position behind the title.
- [ ] 5.3.2 `BlockRenderer.tsx` — `chapter-screen` blocks downgrade to `chapter` blocks (number + title HTML). Companion handles the visual narrative beat.
- [ ] 5.3.3 Mount `<CompanionCanvas>` in `web/src/app/work/[slug]/layout.tsx` alongside existing DitheredImage canvas. Two persistent canvases (different roles: image dither vs page companion).
- [ ] 5.3.4 Verify all 4 studies render. `npm run guardrails`.

## Phase 5.4 — Delete deprecated shaders

- [ ] 5.4.1 Delete `web/src/components/case-study/heroShaders/*.tsx` (4 files).
- [ ] 5.4.2 Delete `web/src/components/case-study/chapterShaders/*.tsx` (6 files + `registry.tsx`).
- [ ] 5.4.3 Delete `web/src/components/case-study/CaseStudyHeroShader.tsx`.
- [ ] 5.4.4 Delete `ChapterScreen.tsx` + `ChapterScreenPinned.tsx` if no remaining references.
- [ ] 5.4.5 Remove `chapter-screen` from `ContentBlock` union in `projects.ts` if no remaining references; remove `useHeroUniforms` / `useChapterUniforms` if unused.
- [ ] 5.4.6 Final `npm run guardrails`.

## Out of scope (this pass)

- Changes to `DitheredImage` / `DitheredPlane` — image dither is a separate system, kept intact
- Changes to Pixel typography (Phase 1 work preserved)
- Mobile-specific companion sizing or alternate dock corner — default to bottom-right 280px at all sizes, iterate after manual review
- Per-state Leva debug controls (single Leva folder exposes current-state-name + transitionMs; per-state parameter tuning deferred)
- Brand-color reintroduction at the outcome chapter (Pudding/Bloomberg pattern — viable Phase 6 escape hatch if studies feel too uniform after ship)
- Modal route `@modal/work/[slug]` (doesn't exist yet; companion will adopt when it ships)
- Editing copy or chapter content

## Files to touch

**New:**
- `web/src/lib/companionStates.ts`
- `web/src/lib/companionStateLibrary.ts`
- `web/src/lib/useChapterStateStore.ts`
- `web/src/components/case-study/CompanionCanvas.tsx`
- `web/src/components/case-study/companionShaders/shared.ts` (registry + uniform skeleton)
- `web/src/components/case-study/companionShaders/RippleMoire.tsx`
- `web/src/components/case-study/companionShaders/ConcentricMoire.tsx`
- `web/src/components/case-study/companionShaders/StripeMoire.tsx`
- `web/src/components/case-study/companionShaders/LatticeMoire.tsx`

**Modified:**
- `web/src/data/projects.ts` (optional `companionState` field; possibly collapse `chapter-screen` → `chapter`)
- `web/src/components/case-study/CaseStudyHero.tsx` (drop shader mount)
- `web/src/components/case-study/ChapterMark.tsx` (IO state wire)
- `web/src/components/case-study/BlockRenderer.tsx` (chapter-screen → chapter)
- `web/src/app/work/[slug]/layout.tsx` (mount CompanionCanvas)

**Deleted (Phase 5.4):**
- `web/src/components/case-study/heroShaders/{ConsumeCreate,Craftedkit,MissionBell,NewBelgium}Hero.tsx`
- `web/src/components/case-study/chapterShaders/{CCPerformanceBraid,CKHeroGrid,CKNodeReceding,CKPipelineFlow,CKSilhouette,NBIdentityPrism}.tsx`
- `web/src/components/case-study/chapterShaders/registry.tsx`
- `web/src/components/case-study/CaseStudyHeroShader.tsx`
- `web/src/components/case-study/{ChapterScreen,ChapterScreenPinned}.tsx`

## Risk register

- **Chapter state thrash on flick-scroll** — rapid setState during in-progress transition could glitch. Mitigation: on new setState mid-transition, snapshot the current interpolated state into `prev` and re-launch transition from there. No visible reset.
- **5 states across 5+ chapters** — NB and CK each have 6 chapters. State sequence wraps (chapter 6 reuses chapter 1's state). Acceptable as "musical return"; flag during V check, expand to 6 states only if it reads as a bug.
- **Loss of brand color is the biggest narrative bet** — each study loses its color signature. Mitigated by DitheredImage tints + Pixel typography accents preserving the brand. If studies still feel too uniform after live review, Phase 6 escape hatch: tint the *outcome* chapter's companion with brand color (Pudding/Bloomberg "earned color" pattern).
- **Two canvases live during 5.1–5.3** — DitheredImage canvas + CompanionCanvas. Expected fine on desktop. Mobile mitigation: cap CompanionCanvas DPR at 1.5, AA off, same as homepage.
- **Dock-trigger placement** — sentinel at hero bottom; current hero is 78–88vh, so trigger fires near end of hero scroll, which is correct. Verify on mobile where hero may compress.

## Shipping order

**PR 1: Foundation + first shader (mission-bell, ripple).** Phase 5.1 (with only `RippleMoire.tsx` implemented; the other three stubbed to a black `ScreenQuad`) + Phase 5.2 wiring. Mission-bell goes live with the companion alongside its existing hero shader (additive, no removal). Lets us validate the dock animation, transition timing, and ripple shader before committing to the other three shaders.

**PR 2: NB + CC shaders.** Implement `ConcentricMoire.tsx` (new-belgium) + `StripeMoire.tsx` (consume-and-create). Both go live alongside existing per-study shaders.

**PR 3: CK shader + cutover + delete.** Implement `LatticeMoire.tsx` (craftedkit). Phase 5.3 cutover + Phase 5.4 delete in the same PR.

## Review

(filled after work completes)

---

# Cross-Route Hero Transition (Home → Case Study)

Recreate the homepage's on-scroll right→left scene swap *across the route boundary* into a case study hero. Companion canvas + chapter shaders are torn out; per-project hero shaders fold into a single persistent `BackgroundField`-style canvas that lives above both routes. Spine locked via /grill-me.

## Spine (locked)

| Branch | Decision |
|---|---|
| Strategy | **A** — Persistent canvas in shared layout. Canvas never unmounts on route change between `/` and `/work/[slug]`. |
| During-slide visual | **ii** — Crossfade work-mode shader → case-study hero shader *during* the slide. Same idiom as `BackgroundField` cross-mode crossfade. |
| Direct entry to `/work/[slug]` | **a** — Cold load renders directly in destination state (scene on left, content on right). Slide only fires when `previousPathname === '/'`. |
| Back navigation | **a** — No reverse slide. Snap canvas to home scroll's current slot + brief shader crossfade (~250ms). |
| Right column | **b** — Full hero. Title + meta + overview headline + body + tags + visit link all stack in the right half. ~100svh hero. |
| Mobile | **d** — No slide on mobile. Direct render in destination state regardless of source. |
| Cleanup | Delete `CompanionCanvas` + companion lib + chapter shaders + `ChapterScreen*`. Keep per-project hero shaders, but fold their GLSL into `BackgroundField` (no separate canvas). |
| Per-project hero shader source slot | Work module's `right` slot at scroll progress 0.56–0.64 is the canonical source — outside that range, slide just starts from "wherever the canvas currently is" (no re-snapping pre-slide). |

## Phase X1 — Cleanup (delete companion + chapter shaders)

- [ ] X1.1 Delete `web/src/components/case-study/CompanionCanvas.tsx`.
- [ ] X1.2 Delete `web/src/components/case-study/companionShaders/` (RippleMoire, ConcentricMoire, StripeMoire, LatticeMoire, shared.ts).
- [ ] X1.3 Delete `web/src/lib/companionStateLibrary.ts`, `web/src/lib/companionStates.ts`, `web/src/lib/useChapterStateStore.ts`.
- [ ] X1.4 Delete `web/src/components/case-study/chapterShaders/` (CCPerformanceBraid, CKHeroGrid, CKNodeReceding, CKPipelineFlow, CKSilhouette, NBIdentityPrism, registry.tsx if present).
- [ ] X1.5 Delete `web/src/components/case-study/ChapterScreen.tsx` + `ChapterScreenPinned.tsx`.
- [ ] X1.6 `BlockRenderer.tsx` — remove `chapter-screen` case + imports for `ChapterScreen`/`ChapterScreenPinned`. Remove `companionState` prop pass to `ChapterMark`.
- [ ] X1.7 `ChapterMark.tsx` — remove all `useChapterStateStore` wiring, IntersectionObserver-driven setState, and `companionState` prop. Component becomes pure HTML chapter heading.
- [ ] X1.8 `data/projects.ts` — remove `chapter-screen` from `ContentBlock` union; delete all `chapter-screen` block entries (NB ch02, C&C ch03, ck ch02/03/04/05). Either restore as `chapter` blocks or delete entirely (defer judgment to user during verify).
- [ ] X1.9 `web/src/app/work/[slug]/page.tsx` — remove `<CompanionCanvas slug={slug} />` line.
- [ ] X1.10 `npm run typecheck` to confirm cleanup is consistent.

## Phase X2 — Lift Canvas into shared layout (persistent)

- [ ] X2.1 New `web/src/components/SceneCanvas.tsx` — client component. Owns the `<motion.div>` slot wrapper + `<Canvas>` + `<BackgroundField>`. Uses `usePathname()` to gate visibility (renders only on `/` and `/work/[slug]`). Reads `useIsMobileViewport()` for mobile sizing.
- [ ] X2.2 New `web/src/lib/useSceneStore.ts` — Zustand store: `{ scrollProgress, setScrollProgress, previousPathname, setPreviousPathname, slideProgress, setSlideProgress }`. Used by `SceneCanvas` (reader) and `HomeSceneRoot` (writer for scroll progress) to communicate without prop-drilling.
- [ ] X2.3 `web/src/app/layout.tsx` — mount `<SceneCanvas />` once at the root level, above `{children}`. Position: fixed, behind page content (z-index strategy: canvas at z=0, page content at z=10, overlays at higher).
- [ ] X2.4 `web/src/components/sections/HomeSceneRoot.tsx` — remove the local `<Canvas>` + slot `<motion.div>` wrapper entirely. Keep the `useScroll` machinery; instead of feeding a local canvas, pipe `scrollYProgress` into `useSceneStore` via `useMotionValueEvent`. Keep all 4 overlays as-is.
- [ ] X2.5 `web/src/app/work/[slug]/page.tsx` — remove `<CaseStudyCanvas />` line.
- [ ] X2.6 Delete `web/src/components/case-study/CaseStudyCanvas.tsx` (no longer referenced).
- [ ] X2.7 `npm run typecheck && npm run lint` to confirm refactor is clean.

## Phase X3 — Extend BackgroundField with per-project case-study hero modes

- [ ] X3.1 `BackgroundField.tsx` — port the 4 hero shader fragments (`MissionBellHero`, `NewBelgiumHero`, `ConsumeCreateHero`, `CraftedkitHero`) into the unified fragment as 4 new packed mode functions: `modeCSHero0`, `modeCSHero1`, `modeCSHero2`, `modeCSHero3`. Use the same Color uniform → sRGB encode pattern.
- [ ] X3.2 Add uniforms to `BackgroundField`:
  - `uCSHeroIndex` (int, 0–3, picks which case-study mode to render)
  - `uCSHeroWeight` (float, 0–1, blends case-study mode against the home-mode composite)
- [ ] X3.3 Final pixel composite: `col = mix(homeComposite, csHeroAtIndex, uCSHeroWeight)`. Keep existing sRGB encode tail.
- [ ] X3.4 `SceneCanvas` reads `usePathname()` to derive `csHeroIndex` from slug (`mission-bell`→0, `new-belgium`→1, `consume-and-create`→2, `craftedkit`→3) and pushes it as a uniform.
- [ ] X3.5 Delete `web/src/components/case-study/CaseStudyHeroShader.tsx`.
- [ ] X3.6 Delete `web/src/components/case-study/heroShaders/` (4 files now folded into `BackgroundField`).
- [ ] X3.7 `npm run typecheck && npm run lint`.

## Phase X4 — Cross-route slide choreography

- [ ] X4.1 In `SceneCanvas`, track previous pathname via ref + `usePathname()` effect. On every pathname change, capture old → new and decide which transition to play.
- [ ] X4.2 **Forward (`/` → `/work/[slug]`)**: animate `slideProgress` 0→1 over 700ms `cubic-bezier(0.22,1,0.36,1)`. Drives:
  - canvas `left` from current `canvasLeftPct(scrollProgress)` → 0 (left slot)
  - `uCSHeroWeight` from 0 → 1
  - The home-side composite reads its own scroll-driven mode crossfade as usual; case-study weight overlay fades in on top.
  - Disabled on mobile (`useIsMobileViewport()` true → snap immediately).
- [ ] X4.3 **Back (`/work/[slug]` → `/`)**: snap canvas `left` to `canvasLeftPct(scrollProgress)` instantly. Animate `uCSHeroWeight` 1→0 over 250ms ease-out. No slide animation. Same on mobile.
- [ ] X4.4 **Direct entry to `/work/[slug]`** (cold load, `previousPathname === null`): set canvas `left = 0`, `uCSHeroWeight = 1` with no animation on first frame.
- [ ] X4.5 **Direct entry to `/`** (cold load): default state — `uCSHeroWeight = 0`, canvas slot driven by scroll as today.
- [ ] X4.6 **Slug→slug** (e.g., user navigates from one case study to another): instant swap of `uCSHeroIndex` (no animation). The destination's hero shader crossfades in via `uCSHeroWeight` already pinned at 1.

## Phase X5 — Refactor `CaseStudyHero` for right-column-only layout

- [ ] X5.1 `CaseStudyHero.tsx` — restructure to a 100svh two-column layout (`md:grid-cols-2`):
  - Left column: empty (canvas occupies it visually).
  - Right column: vertical stack — meta line (year/role/client), title (Fraunces, scaled to fit half-width — try `md:text-7xl lg:text-8xl`), overview "Overview" label, italic headline, body paragraph, tag chips, "Visit live" link.
  - Right column scrolls internally if content overflows, OR hero grows past 100svh on tall content (defer to dev pass).
- [ ] X5.2 Mobile: collapse to single column, full-width vertical stack, no canvas slot reservation. The shared `SceneCanvas` is hidden on mobile per the no-slide decision (Phase X4 gate).
- [ ] X5.3 Remove `<CaseStudyHeroShader>` mount from `CaseStudyHero` (already deleted in X3.5).
- [ ] X5.4 Title + meta entrance choreography: framer-motion fade/slide-in keyed off `slideProgress` from `useSceneStore`. Title fades in 0.5–0.8 of slide; meta cascades 0.8–1.0. On direct entry, both render with no animation.

## Phase X6 — Verification

- [ ] X6.1 `npm run typecheck` clean.
- [ ] X6.2 `npm run lint` clean.
- [ ] X6.3 `npm run build` clean.
- [ ] X6.4 Manual: `/` → click each of 4 work cards. Slide plays right→left, shader crossfades to case-study hero, title fades in on right. From multiple scroll positions inside the work module window.
- [ ] X6.5 Manual: direct entry to each `/work/<slug>` URL. No animation, lands in destination state.
- [ ] X6.6 Manual: back navigation (← Index link + browser back). Snap + brief shader crossfade. Lands at restored homepage scroll.
- [ ] X6.7 Manual: case-study → case-study via NextProject card. Hero shader swaps cleanly.
- [ ] X6.8 Manual: mobile (<768px). Forward + back are both warps; case study renders directly in destination layout.
- [ ] X6.9 Manual: reduced-motion. Static fallback h1 on home; case study renders without slide on direct entry.

## Out of scope (this pass)

- Restoring chapter-screen visual treatments (deleted; user said "for now")
- Restoring `CompanionCanvas` (deleted)
- Per-project hero shader visual iteration (just porting GLSL into BackgroundField as-is)
- Modal route `@modal/work/[slug]` (route exists in plan but not in this pass)
- View Transitions API path (rejected — strategy A chosen)
- Reverse-slide on back navigation (rejected — warp-back chosen)
- Slide on mobile (rejected — direct render chosen)
- Auto-play slide on direct entry (rejected — destination state chosen)
- Right-column entrance animation polish beyond title/meta cascade

## Files to touch

**New:**
- `web/src/components/SceneCanvas.tsx`
- `web/src/lib/useSceneStore.ts`

**Modified:**
- `web/src/app/layout.tsx`
- `web/src/components/sections/HomeSceneRoot.tsx`
- `web/src/components/sections/BackgroundField.tsx`
- `web/src/app/work/[slug]/page.tsx`
- `web/src/components/case-study/CaseStudyHero.tsx`
- `web/src/components/case-study/BlockRenderer.tsx`
- `web/src/components/case-study/ChapterMark.tsx`
- `web/src/data/projects.ts`

**Deleted:**
- `web/src/components/case-study/CompanionCanvas.tsx`
- `web/src/components/case-study/companionShaders/` (whole dir)
- `web/src/lib/companionStateLibrary.ts`
- `web/src/lib/companionStates.ts`
- `web/src/lib/useChapterStateStore.ts`
- `web/src/components/case-study/chapterShaders/` (whole dir)
- `web/src/components/case-study/ChapterScreen.tsx`
- `web/src/components/case-study/ChapterScreenPinned.tsx`
- `web/src/components/case-study/CaseStudyHeroShader.tsx`
- `web/src/components/case-study/CaseStudyCanvas.tsx`
- `web/src/components/case-study/heroShaders/` (whole dir, 4 files)

## Risk register

- **Lifting Canvas to root layout pays cost on every route.** Mitigation: `SceneCanvas` returns `null` for any pathname not in `['/'].concat(workSlugs)`. Single React tree check; near-zero cost on `/lab/*` etc.
- **`BackgroundField` fragment grows from ~5 modes to ~9.** Compiled fragment may exceed practical token count for low-end mobile GPUs. Mitigation: confirm shader compile + draw call cost during X6 verification on mobile. Escape hatch: keep case-study hero shaders as a *second* shader material in the same `<Canvas>` (still shared canvas, separate material) — costs slightly more JS but keeps each fragment small.
- **Slug→slug navigation** (X4.6) — when user clicks a NextProject card, both pages have `uCSHeroWeight=1`, and only `uCSHeroIndex` changes. An instant int swap may flash; if so, add a 250ms crossfade through `uCSHeroWeight` 1→0→1 with index swap at the trough.
- **Deleting `chapter-screen` blocks loses real content** (NB ch02 "Identity Prism", CC ch03 "Perf-Motion Braid", ck ch02/03/04/05). User said "the other shaders for now" — interpreted as "delete the shader treatments, restore as plain `chapter` blocks (number + title only)". X1.8 will need user pass to confirm which blocks to keep as plain chapter marks vs delete entirely.
- **`HomeSceneRoot` still owns scroll state** — but the canvas it drives is now in a sibling layout component reading from a Zustand store. Risk: store updates fire 60×/sec from `useMotionValueEvent`; at scale that's fine but be sure to use `setScrollProgress(v)` directly without intermediate React state. Mitigation: Zustand's `set` is non-reactive at the consumer level when consumers read via `getState` in `useFrame` rather than subscribing — pattern matches existing `useChapterStateStore` (about to be deleted) usage.

## Shipping order

Single PR. Phases X1 (cleanup) and X2 (lift canvas) are interdependent — both need to land together to avoid a broken intermediate state where the page references deleted components. X3 / X4 / X5 layer on top. X6 verifies.

## Review

**What changed:**

- **X1 cleanup.** Deleted `CompanionCanvas`, `companionShaders/` (4 shader files + shared.ts), `companionStateLibrary`, `companionStates`, `useChapterStateStore`, `chapterShaders/` (6 shader files + registry), `ChapterScreen`, `ChapterScreenPinned`, `useChapterUniforms`. `BlockRenderer` lost the `chapter-screen` case. `ChapterMark` lost its IntersectionObserver-driven companion store wiring. `projects.ts` lost `ChapterScreenBlock` from the union, lost the `companionState` field on `ChapterBlock`, and the 6 `chapter-screen` block entries (NB ch02, CC ch03, ck ch02/03/04/05) downgraded to plain `chapter` blocks (number + title + eyebrow preserved). `page.tsx` lost the `<CompanionCanvas>` mount.
- **X2 lift canvas.** New `web/src/lib/useSceneStore.ts` (Zustand store: scrollProgress, previousPathname, canvasSlide, csHeroWeight, csHeroIndex). New `web/src/components/SceneCanvas.tsx` — client component, mounted once in `app/layout.tsx`, owns the slot wrapper + `<Canvas>` + `<BackgroundField>` + `<CaseStudyHeroLayer>`. Gated by `usePathname()` to render only on `/` and `/work/[slug]`, and hidden on mobile case-study routes. `BackgroundField` lost its `scrollRef` prop — reads `scrollProgress` from the store inside `useFrame`. `HomeSceneRoot` lost its local `<Canvas>` + slot wrapper; now pipes `scrollYProgress` to the store via `useMotionValueEvent`. `CaseStudyCanvas.tsx` deleted. `page.tsx` lost the `<CaseStudyCanvas>` mount.
- **X3 fold hero shaders.** New `web/src/components/CaseStudyHeroLayer.tsx` — single combined fragment with all 4 per-project hero shaders (Mission Bell ink-bleed + thumbnail mask, NB double-domain-warp FBM, C&C Voronoi + needle, CK 7-node SDF + edge pulses) dispatched by `uIndex`. Mounted as a sibling of `BackgroundField` inside the shared canvas, transparent ScreenQuad, alpha = `uWeight` (drives crossfade overlay). `discard` when weight is below threshold. Mission Bell texture loaded once at module scope and cached. Deleted `heroShaders/` (4 files), `useHeroUniforms.ts`, `CaseStudyHeroShader.tsx`. `CaseStudyHero` lost its `<CaseStudyHeroShader>` mount.
- **X4 cross-route slide.** `SceneCanvas` listens for `usePathname()` changes and dispatches choreography via `framer-motion`'s `animate()`. **Forward (/ → /work/[slug])**: `canvasSlide` and `csHeroWeight` both animate 0→1 over 700ms with `cubic-bezier(0.22, 1, 0.36, 1)`. Canvas position interpolates from `canvasLeftPct(scrollProgress)` → 0% (left slot); the parallelogram lean fades out via `(1 - canvasSlide)` scaling. **Back (/work/[slug] → /)**: `canvasSlide` snaps to 0 instantly (canvas teleports to home's current slot); `csHeroWeight` animates 1→0 over 250ms ease-out. **Direct entry**: snap. **Slug→slug**: only `csHeroIndex` updates; both driver values stay at 1. **Mobile**: any animation snaps instantly (the canvas isn't even visible on mobile case-study, so this is mostly a no-op for case-study mobile; covers home mobile direction changes).
- **X5 right-column hero.** `CaseStudyHero` restructured to a `md:grid-cols-2` two-column layout, `min-h-[100svh]`. Left column reserved/empty (canvas occupies it visually). Right column houses everything: meta line (year/role/client) → title (Fraunces, scaled down to `md:text-6xl lg:text-7xl` to fit half-width) → "Overview" label → italic headline (Instrument Serif) → body paragraph → tag chips → "Visit live" link. Mobile collapses to a single full-width vertical stack since the canvas isn't shown.
- **X6 verify.** `npm run typecheck` clean. `npm run lint` clean. `npm run build` clean — all 15 static pages generated. Manual visual verification still pending — hand off to user.

**Open items / flagged for visual review:**

- **`CaseStudyDebugPanel`** retained as-is. Its Leva controls used to bind to per-hero shader components which are now deleted; it should still render an empty Leva panel for `?leva` URLs but no controls beyond the global `BackgroundField` ones (which Leva picks up automatically via `useControls`). May be worth deleting, but harmless as-is.
- **Title typography on the right column at narrow desktop widths.** Reduced from `lg:text-[10rem]` to `lg:text-7xl` to fit half-width. May want to bump back up at `xl:` for very wide displays.
- **Lab links** (`/work/[slug]/lab`) inherit the canvas if user navigates there — but pathname `/work/[slug]/lab` doesn't match `WORK_PATH = /^\/work\/([^/]+)$/`, so canvas hides. Lab pages presumably bring their own scene as designed.
- **Mission Bell texture path** hardcoded in `CaseStudyHeroLayer` as `/work/mission-bell.webp`. If the project thumbnail path changes in `projects.ts`, this needs to update too.

**Files touched:**

New:
- `web/src/components/SceneCanvas.tsx`
- `web/src/components/CaseStudyHeroLayer.tsx`
- `web/src/lib/useSceneStore.ts`

Modified:
- `web/src/app/layout.tsx`
- `web/src/components/sections/HomeSceneRoot.tsx`
- `web/src/components/sections/BackgroundField.tsx`
- `web/src/app/work/[slug]/page.tsx`
- `web/src/components/case-study/CaseStudyHero.tsx`
- `web/src/components/case-study/BlockRenderer.tsx`
- `web/src/components/case-study/ChapterMark.tsx`
- `web/src/data/projects.ts`

Deleted:
- `web/src/components/case-study/CompanionCanvas.tsx`
- `web/src/components/case-study/companionShaders/` (5 files: RippleMoire, ConcentricMoire, StripeMoire, LatticeMoire, shared.ts)
- `web/src/lib/companionStateLibrary.ts`, `companionStates.ts`, `useChapterStateStore.ts`, `useChapterUniforms.ts`, `useHeroUniforms.ts`
- `web/src/components/case-study/chapterShaders/` (7 files including registry.tsx)
- `web/src/components/case-study/ChapterScreen.tsx`, `ChapterScreenPinned.tsx`
- `web/src/components/case-study/CaseStudyHeroShader.tsx`
- `web/src/components/case-study/CaseStudyCanvas.tsx`
- `web/src/components/case-study/heroShaders/` (4 files)
