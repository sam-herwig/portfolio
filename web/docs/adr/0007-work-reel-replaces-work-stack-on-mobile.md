# Work reel replaces Work stack on mobile

The mobile leg of ADR 0004 — the **Work stack** (a 5-card vertical column
translating upward via `translate-Y` across the 100 svh Work IDLE beat) —
is wrong on mobile for two independent reasons:

- **(a) Translate-Y feels wrong under thumb-scroll.** Cards drift past the
  user as they scroll; the user never quite stops on a card to read it,
  and the perceived locus of motion ("what is my scroll actually doing?")
  is ambiguous.
- **(c) The 5-on-one-runway concept is wrong on mobile.** A phone wants
  one project at a time, with full attention and a full visual frame.
  Compressing 5 cards into one continuous translating column is a desktop-
  shaped solution scaled down, not a mobile-native idea.

Replace it with the **Work reel**: a pinned card-pinner pattern in which
each card occupies the bottom half of the viewport in turn while the Work-
mode shader holds the top half.

## What the reel is

- **Top half (50 vh)** — the existing Work-mode shader continues to render
  inside `MODULE_CANVAS_SLOT_MOBILE.work` (`{w:100, h:50}`, already correct
  in `moduleTimeline.ts`). Across the mobile Work IDLE beat the shader
  cycles through its three Work presets (`Spread → Stack → Index`) on its
  own clock, decoupled from card index. No shader code changes.
- **Bottom half (~50 vh)** — exactly one project card visible at a time.
  Cards crossfade in/out at the same Y position, no Y-translate. The
  user's scroll advances *which* card is shown; the card itself does not
  move.
- **Per-card chrome unchanged.** Same `WorkCard` component as today:
  saturate-on-hover video tell (desktop-only), timecode + year, title with
  `↗︎`, bottom legibility gradient. No progress indicator, no per-project
  brief — the card stays small in vocabulary even though the frame got
  bigger.
- **No mobile `PixelTitle`.** The chemistry-warp into Work + the shader
  preset cycle + the project cards declare the section. The title curtain
  was considered (Q7) and rejected to save runway and avoid the title
  competing with the shader's top half.
- **Cursor magnet disabled on mobile.** The pointer listener that writes
  `mouseTarget` to `useSceneStore` is gated behind `(pointer: fine)`, so
  touch devices never feed the warp. Hover effects on cards remain on
  cursor-equipped devices via `:hover` / `onMouseEnter` semantics; the
  `onTouchStart` video-tell handler on `WorkCard` is the touch-side
  equivalent.

## Pacing and the mobile timeline fork

The reel needs ~340 svh of mobile Work IDLE beat (5 × 60 svh per-card
dwell + 4 × 10 svh crossfade boundaries), versus 100 svh today on desktop.
The mobile and desktop module-window math therefore fork:

- `MODULE_WINDOWS` and `TIMELINE_HEIGHT_SVH` stay at today's values; the
  desktop **Work grid** is unchanged end-to-end.
- New parallel constants — `MODULE_WINDOWS_MOBILE` and
  `TIMELINE_HEIGHT_SVH_MOBILE` — encode the longer mobile Work IDLE beat.
  Mobile baseline: 160 + 144 + 128 + 144 + **340** + 144 + 232 = **1292 svh**
  (scaled with the same global pace multiplier as desktop). `HomeSceneRoot`
  picks the viewport-appropriate set; downstream consumers (overlay
  opacity, shader uniforms, `canvasSlot`) read from the same import
  contract so no callsite forking is required.

This forks at the same boundary the codebase already forks for
`MODULE_CANVAS_SLOT_*` — viewport-specific constants, single helper that
selects between them.

## Considered alternatives

- **Keep Work stack, fix the leaks.** Tighten overlay-opacity windows so
  adjacent modules don't bleed into Work mid-translate. Rejected on Q1 —
  diagnosis is (a) + (c), not module-window leak. Treats the symptom only.
- **Pinned card-pinner with directional slide between cards.** Each card
  slides up from beneath the prior. Rejected on Q3 — reintroduces the
  exact "content moving under your thumb" failure mode that motivated
  picking option 1 over the translate-Y stack in the first place.
- **Hard cuts between cards (no crossfade).** Cleaner editorial reading,
  but iOS momentum scroll flickers the threshold as the position decays
  past and back. Rejected on Q3 — short crossfade (~10 svh) absorbs the
  bounce without re-introducing translate.
- **Natural vertical scroll with `position: sticky` shader on top half.**
  Drops the homepage's pinned-Canvas idiom for the Work module only.
  Rejected on Q2 — the architectural fork ("everything pins except Work")
  is more expensive to maintain than the unified pin model.
- **CSS scroll-snap.** Native, free, ergonomic. Rejected on Q2 — doesn't
  compose with the chemistry-warp at module boundaries; would need to
  exit snap mode at the edges, which is fragile.
- **Z-stacked crossfade (cards literally on top of each other, no
  movement).** Cinematic but harder to tune and overlaps with the
  pinned-card-pinner mechanic semantically. Rejected on Q2 in favor of
  the conceptually cleaner option 1.
- **Internal scroll inside a single 100 svh pinned region.** Don't expand
  the homepage timeline; advance cards via touch-driven internal logic
  inside a pinned outer scroll. Rejected on Q6 — nested scroll on iOS is
  fragile (rubber-banding, momentum cancellation), and the codebase
  already has viewport-forked constants elsewhere so the fork has prior
  art.
- **Long dwell (100 svh per card, total ~540 svh).** Generous, but makes
  the Work module ~50% of the entire mobile homepage. Rejected on Q6 —
  pushes other modules into the shadow of Work.
- **Short dwell (40 svh per card, total ~240 svh).** Tight; user would be
  reading the card during the crossfade rather than at rest. Rejected on
  Q6 — defeats the "stop and read each project" goal that motivated the
  redesign.
- **Per-project hero shader morph in the top half.** Each card pairs with
  the case-study hero shader for that project. Rejected on Q4 —
  architecturally expensive (`CaseStudyHeroLayer` mounting in the home
  Canvas) and steals the case-study page's reveal moment.
- **Work-mode shader tinted per project.** Cheaper version of the above.
  Rejected on Q4 — user wanted the shader untouched.
- **Top-half cycles all four module modes (Hero / About / Work / Contact)
  during the mobile Work IDLE beat.** Rejected on Q5 — violates the
  "Module owns one shader mode" rule from `CONTEXT.md` and conflicts with
  the chemistry-warp at module boundaries.
- **Top-half preset cycle coupled to card transitions.** Card crossfades
  and preset crossfades align. Rejected on Q5 — every transition crowds
  at the same scroll position; decoupled rhythms are more cinematic.
- **Title curtain — `PixelTitle "Work"` appears for ~30 svh at the start
  of the Work IDLE beat then exits.** Rejected on Q7 — the title was
  dropped on mobile entirely. Chemistry-warp + shader cycle + cards
  declare the section without explicit labeling.
- **Persistent title pinned alongside the shader in the top half across
  all 5 cards.** Rejected on Q7 — was what's broken in the current
  screenshot (cards collide with the persistent title). Competes with the
  shader's top-half breathing room.
- **Add a brief / mini-meta to each card** (one-liner, role + client +
  tag chips). Rejected on Q8 — content debt; case-study page already
  serves that purpose on click-through.
- **Add a progress indicator (`01 / 05` or dot pagination).** Rejected on
  Q8 — user picked (a) "same chrome, scaled up" without progress
  affordance. Cards stand on their own.
- **Pinned card-pinner with hard cuts under reduced-motion.** Even hard
  cuts are a motion event semantically. Rejected on Q9 — reuse the
  existing `StaticWorkLayout` (normal vertical scroll, no pinning) for
  `prefers-reduced-motion` users instead.

## Consequences

- **Supersedes the mobile leg of ADR 0004.** The desktop **Work grid**
  (3+2 static layout) is unchanged end-to-end; only the mobile branch of
  `WorkOverlay.tsx` swaps from `MobileWorkLayout` (translating stack) to
  a new `MobileWorkReel`.
- **`moduleTimeline.ts` gains `MODULE_WINDOWS_MOBILE` and
  `TIMELINE_HEIGHT_SVH_MOBILE`.** Desktop constants retain their current
  exports; mobile constants are derived from the longer Work IDLE beat.
  `HomeSceneRoot` picks the viewport-appropriate set at runtime;
  downstream consumers (overlay opacity transforms, `BackgroundField`
  uniforms, `canvasSlot`) accept module windows as input rather than
  hard-importing, so the fork is contained to the timeline module.
- **`useWorkIdleU` is replaced by a discretized version.** Today it maps
  0..1 across the Work IDLE beat to drive a continuous translate. The
  reel needs a "card index + within-card progress" pair derived from the
  same range — a small helper, same module.
- **Cursor magnet is gated behind `(pointer: fine)` in `HomeSceneRoot`.**
  The pointer listener becomes a no-op on touch devices. Magnet/Repel/
  Swirl/Ripple/Lens modes are unchanged on desktop.
- **CONTEXT.md glossary updated.** `Work stack` is marked deprecated and
  references this ADR; `Work reel` is added; `Work IDLE beat` notes the
  viewport fork; `Cursor magnet` notes the `(pointer: fine)` gate.
- **At ~8 projects we revisit (still).** ADR 0004's "revisit at 8 projects"
  trigger still applies to the desktop **Work grid**; the **Work reel**
  scales more naturally with catalog growth (it's already sequential),
  so the catalog-growth review is now a desktop-only concern.
- **iOS-specific risk: card crossfade flicker during momentum-scroll
  decay.** Mitigation is in the 10 svh crossfade width — generous enough
  to absorb position bounce — but worth verifying on real device before
  shipping.
