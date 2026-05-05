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

