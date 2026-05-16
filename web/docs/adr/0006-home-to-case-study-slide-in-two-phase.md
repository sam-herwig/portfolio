# Home → case-study slide-in is two-phase, origin-pinned, with reduced-motion snap

The desktop navigation from home to `/work/[slug]` is a two-phase choreography:
**phase 1** contracts the canvas wrapper's clip-path from the slot rect the user
was looking at when they clicked into `CS_SLOT_DESKTOP` (left half, 50×100), and
**phase 2** fades `csHeroWeight` from 0→1 to morph the Work-mode shader into the
bespoke case-study hero shader inside the now-settled slot. Phase 1 runs 600ms
with `easeOutCubic`; phase 2 runs 500ms with `easeInOut` starting 450ms into
phase 1, so the last 150ms of contract overlaps the first 150ms of morph. Total
~1.05s. Origin = a snapshot of the wrapper's MotionValue rect (`topRaw.get()` /
etc.) taken inside `SceneCanvas`'s pathname effect at slide-start, stored in a
`slideOriginRef` and held until the contract animation's `onComplete`. While
the ref is non-null, `computeTargetSlot` uses it as `home`; otherwise it falls
back to `canvasSlot(scrollProgress)` as before. `prefers-reduced-motion: reduce`
forces both phases to snap. Mobile, direct entry, slug→slug, and back-nav are
unchanged.

## Why

Before this ADR, the slide was a single 1.1s parallel animation: `canvasSlide
0→1` blending `home = canvasSlot(scrollProgress)` with `CS_SLOT_DESKTOP`, and
`csHeroWeight 0→1` crossfading the hero shader on top. Two things were wrong.

First, two store fields were being clobbered out from under the slide:

1. `scrollProgress` — case-study `ScrollProgress.tsx` was writing this on
   every `useScroll` change event AND resetting it to 0 on unmount. Once the
   new page mounted, the home-timeline value (e.g., ~0.5 for Work IDLE) was
   replaced with the case-study's local 0, which (a) jumped
   `canvasSlot(scrollProgress)` to Hero's right-half slot, and (b) flipped
   `BackgroundField`'s `uScroll` uniform from Work mode to Hero mode, leaking
   the hero-circle shader through phase 1 of the slide. Fix: case-study
   `ScrollProgress` no longer writes `scrollProgress` at all — that field is
   the home timeline's, the case study uses its own `csHeroBandProgress`.
2. The "home" slot reference inside `computeTargetSlot` was re-derived from
   `scrollProgress` every rAF tick. Even with fix (1) in place, snapshotting
   the rect at click-time is more honest than re-deriving from a global —
   the snapshot captures what the user actually saw, including any pending
   smoothing lag. Fix: `slideOriginRef` (a `useRef<CanvasSlot | null>`) pins
   `home` to the visual rect for the duration of the slide.

Once clobbered, `canvasSlot(0)` returned Hero's right-half slot, the rAF
lerp's `k=30` smoothing collapsed the delta in ~80ms, and the wrapper
appeared to "snap into a half-sized asset" before any meaningful animation
ran. The 1.1s animation completed, but on a tiny residual delta no eye
could resolve. The mode-flip in `BackgroundField` was a related symptom
that surfaced only after the rect-snap was fixed (with the rect held stable
during phase 1, the eye could now see what was being rendered inside it —
and it was Hero circles, not Work).

Second — and this is the deeper problem the redesign exposed — the Work
module's canvas slot is now fullscreen (`{ top:0, left:0, w:100, h:100 }`),
the 5-up grid layout that replaced the old sliding-window cycle. With the
origin fixed to Work-fullscreen, the natural slide is a *contraction*
(fullscreen → left-half), not an expansion. That's the inverse of how every
other module transition reads (expand into more viewport at HOLD, then contract
into the next slot). Running a parallel shader morph during a contraction
produces two layered shaders inside a moving clip — reads muddy at the
midpoint. Separating geometry and identity into sequential beats lets each
animation play against a stable backdrop.

The two-phase split mirrors the homepage transition language. Homepage
transitions are: rect-expand → HOLD (chemical-reaction identity morph) →
rect-contract → overlay-in. The home→case-study slide is the same beat
structure compressed into a navigation: rect-contract → morph-in. Geometry
settles first; identity speaks second.

## Considered alternatives

- **Patch the origin only, keep parallel composition (option A in grilling).**
  Snapshot the rect at slide-start, keep the single 1.1s parallel animation.
  Cheapest fix. Resolves the snap. Rejected because the parallel composition
  reads busy when both animations now actually run — the eye can't track a
  shrinking-and-morphing rect simultaneously without losing one of them.
- **Identity-first then geometry (option C in grilling).** Morph fullscreen
  Work→hero shader for ~500ms, then contract from fullscreen to left-half.
  Announces the case study before the rect settles. Rejected: the
  fullscreen identity morph competes with the case-study HTML mounting in
  the right half of the viewport — user sees a fullscreen shader change AND
  HTML appearing, two foreground events instead of one.
- **FLIP from the clicked card.** Capture the clicked card's
  `getBoundingClientRect()` and animate the wrapper from that rect to
  `CS_SLOT_DESKTOP`. Highest spatial commitment. Rejected for launch:
  the card video and the hero shader are different textures, requiring a
  crossfade inside a moving rect — fiddly to land, with new failure modes
  (aspect-ratio mismatch, video pause/play timing). Worth revisiting
  post-launch if the two-phase reads under-committed.
- **Click handler on `WorkOverlay` writes origin to store** (option B in
  Q3 grilling). Slide origin sourced at the click site instead of in
  `SceneCanvas`'s effect. Rejected: spreads the slide logic across two
  files for no behavioral gain. The MotionValue snapshot can't lie about
  what the user saw.
- **Hard-code Work-fullscreen as the slide origin** (option C in Q3). One
  constant, no ref. Rejected: doesn't generalize. Next-project navigation
  (slug→slug) and any future entry point would all need their own
  hard-coded origin.
- **Reverse-choreograph back-nav.** Mirror the two-phase animation when
  navigating from `/work/[slug]` back to `/`. Rejected: back-nav is "I'm
  done here," not a signature moment. Reversing doubles maintenance for
  marginal craft.

## Consequences

- `web/src/components/case-study/ScrollProgress.tsx` no longer writes
  `scrollProgress` (neither on change nor on unmount). The home timeline's
  `scrollProgress` is now owned exclusively by `HomeSceneRoot`; case-study
  pages leave it alone, so `BackgroundField` keeps rendering whatever mode
  the user was on when they navigated. `csHeroBandProgress` writes are
  unchanged.
- `SceneCanvas.tsx` owns the slide origin via a `useRef<CanvasSlot | null>`.
  The ref is set in the pathname effect's forward branch and cleared on
  contract completion, back-nav, slug→slug, direct entry, and any cancel.
  `computeTargetSlot` takes an `originOverride` parameter; rAF tick reads
  `slideOriginRef.current` and passes it through.
- Two new constants replace `FORWARD_DURATION` / `FORWARD_EASE`:
  `FORWARD_CONTRACT_DURATION = 0.6`, `FORWARD_CONTRACT_EASE`
  (`[0.22, 1, 0.36, 1]`), `FORWARD_MORPH_DURATION = 0.5`,
  `FORWARD_MORPH_DELAY = 0.45`. The forward animation in the pathname
  effect splits into two `animate` calls with the morph carrying `delay`.
- Reduced-motion snap path added inside the forward branch (before the
  animate calls): `window.matchMedia('(prefers-reduced-motion: reduce)')`
  short-circuits to `setCanvasSlide(1)` + `setCsHeroWeight(1)`.
- The MotionValue declarations move above the pathname effect so the
  effect can `.get()` them at slide-start. The duplicated declarations
  that used to live further down were removed; the rAF effect now reads
  the same MotionValues.
- Mobile remains a snap (forward and back). Direct entry, slug→slug, and
  back-nav are unchanged. Only the desktop home → `/work/[slug]` path
  receives the two-phase choreography.
- `CONTEXT.md` gains a **Slide-in** entry under a new **Navigation
  transitions** subsection.
- Slug→slug navigation between case studies continues to snap. ADR is
  silent on it; if a future redesign wants a case-study↔case-study
  transition, `slideOriginRef` already gives the right primitive — the
  rect snapshot survives any source pathname.

## Verification

- `npm run typecheck` — green
- `npm run lint` — green
- Browser QA pending: scroll into Work IDLE on home, click each of the 5
  cards, confirm the wrapper contracts smoothly (no snap) and the hero
  shader fades in after the contract settles. Repeat with reduced motion
  forced on; confirm both phases snap. Repeat on mobile; confirm snap.
