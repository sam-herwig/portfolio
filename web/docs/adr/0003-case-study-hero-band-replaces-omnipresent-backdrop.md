# Case-study hero shader runs only in a Hero band, not as an omnipresent backdrop

The bespoke per-project hero shader (`CaseStudyHeroLayer`) renders as an
omnipresent left-half backdrop (desktop) / top 1:1 strip (mobile) for the full
case-study scroll. With `cycles = 3` per project, each saved keypoint (K0–K3)
is repeated three times across the article. Page layout is forced into a 2-col
grid with all body content packed into the right column so the shader can hold
the left.

We're replacing that with a **Hero band**: a ~200svh pinned scroll region at
the top of the page where the canvas pins (sticky left-half desktop / top 1:1
strip mobile), the HTML hero (title, overview, tags) scrolls naturally past
it, and the shader runs **cycles = 1** — K0→K1→K2→K3 traversed exactly once.
At the band's end the canvas unsticks and scrolls off the top of the viewport.
Below the Hero band, body content reflows into a centered single-column **Body
column** with wider media and full-bleed media blocks still permitted. Shader
DNA below the Hero band comes from two sources only: **per-region scoped
canvases** hosting bespoke **chapter transitions** at the narrative pivots
specified by the 3-tier spine (mission-bell 0, new-belgium 1, consume-and-
create 1, craftedkit 4), and the existing per-image dither shader. The
homepage→case-study slide-in choreography is preserved because the hero shader
stays inside the global persistent Canvas; only its lifecycle (now gated to
the Hero band) and `cycles` (now 1) change.

## Why

The omnipresent backdrop was doing two jobs poorly. As a showcase it under-
sold each shader by repeating every saved keypoint three times — the K0–K3
states were designed as deliberate moments and the runway buried them inside
a 12-state loop. As a reading surface it competed with body copy, forced the
2-col layout, and made the case-study page feel "noisy as you scroll."
Curating the shader down to one deliberate moment per page — one full pass
through K0–K3, then exit — sharpens both jobs. Each saved state earns its
viewport. Body content gets a centered reading column with room for type-scale
headroom and full-width media. Chapter transitions remain the place where
shader voice returns inside the article, but only at the pivots the 3-tier
spine already identified as "earned."

The 3-tier spine itself (locked 2026-05-05) survives unchanged: the spine
specified which projects deserve chapter screens at which pivots; the
omnipresent backdrop was a separate decision sitting underneath it. This ADR
removes the backdrop only. The renamed concept ("chapter transition" in place
of "chapter screen") reflects the new role — they are now the only sustained
shader surface in the article body, no longer competing with a constant
background.

## Considered alternatives

- **Hero-only (no chapter transitions).** Cleanest, but drops case-study
  ambition a tier — the index would carry all the shader weight and case
  studies would feel like a step down. Rejected: the redesign goal is more
  room for content, not less shader DNA where it's earned.
- **Hero + footer bookends (no chapter transitions).** Shader returns above
  the credits / Next-project handoff. Rejected: the closing moment is when
  users are leaving the page; a shader there is seen briefly and adds little.
  Chapter transitions earn their dwell better at narrative pivots.
- **Every chapter break gets a shader transition (homepage-style frequency).**
  Reintroduces shader fatigue at smaller scale — defeats the goal. Rejected.
- **Full-bleed hero (shader covers the whole viewport for the Hero band, HTML
  overlays on top).** Bigger showcase moment but forces redesigning the
  home→case-study slide-in (canvas would have to expand from the right-side
  hero slot into full-bleed, not into the left half). Rejected: the slide-in
  is a signature transition; preserve it.
- **Tear down the global persistent Canvas on case-study pages, mount a
  scoped canvas for the Hero band instead.** Architecturally cleaner per-page
  but breaks the home→case-study slide-in (no canvas continuity across the
  navigation). Rejected for the same reason as the full-bleed option.
- **Cram chapter transitions into the global persistent Canvas as additional
  `uIndex` modes.** Avoids a second canvas pattern but bloats
  `CaseStudyHeroLayer.tsx` (already 1533 lines) into a 3000-line monster with
  ten+ modes. Rejected: per-region scoped canvases already exist for
  image-dither; chapter transitions can reuse that pattern (transparent
  Canvas + IntersectionObserver-gated frameloop) without new infrastructure.

## Consequences

- `CaseStudyHeroLayer.tsx` lifecycle changes: its `<ScreenQuad>` no longer
  occupies the canvas slot for the full case-study scroll. The
  `setCsHeroWeight` choreography in `SceneCanvas.tsx` ties the shader's
  visibility to a new Hero-band scroll progress (0→1 across ~200svh starting
  at page top) rather than the full case-study runway.
- All hero shader `cycles` defaults drop from 3 to 1 in `CaseStudyHeroLayer`'s
  Leva sets (`mbCycles`, `nbCycles`, `ccCycles`, `ckCycles`, `plCycles`). One
  full traversal of K0→K3 per Hero band.
- `app/work/[slug]/page.tsx` layout splits into two regions: a 2-col Hero
  section that hosts `<CaseStudyHero>` in the right column (left column reserved
  for the pinned canvas), then a new centered Body container that holds
  `<BlockRenderer>` output, credits, and `<NextProject>`. The current
  "everything inside the right column of one 2-col grid" structure goes away.
- New scoped-canvas component for chapter transitions (likely
  `ChapterTransitionBlock.tsx` + per-project shader files). Mounts a
  transparent `<Canvas>` inside the block, gated by IntersectionObserver
  frameloop, same lifecycle pattern as `DitheredPlane`. A new
  `ChapterTransitionBlock` variant joins the `ContentBlock` discriminated
  union with `scrollMode: 'reveal-dissolve' | 'pinned-scrub'`.
- Mobile case-study layout (`isMobileCaseStudy` branch in `SceneCanvas.tsx`)
  changes from a permanently-fixed 1:1 top strip to a Hero-band-scoped sticky
  strip. The strip pins during the band's scroll runway and scrolls off the
  top at the band's end, matching desktop's choreography.
- `CONTEXT.md` updated with case-study vocabulary (Hero band, Body column,
  chapter transition, image dither, case-study hero shader).
- The 2026-05-05 spine memory's "GLSL surface scope" is partially superseded:
  the omnipresent-backdrop assumption is gone; the chapter-screen plan is
  retained (renamed to chapter transitions) with mechanics
  reveal-dissolve / pinned-scrub now formalized in CONTEXT.md.
- Mission-bell loses shader presence in the article body — image-dither alone
  carries shader DNA below the Hero band. Acceptable per its pure-magazine
  tier in the spine.
- Real production cost remains: 1 chapter-transition shader for NB (ch02),
  1 for C&C (ch03), 4 for CK (ch02 / ch03 / ch04 / ch05). Can ship in pieces
  — Hero-band runway compression is the immediate prerequisite; chapter
  transitions can land project-by-project.
