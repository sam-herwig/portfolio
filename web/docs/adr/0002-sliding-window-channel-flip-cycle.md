# Sliding-window channel-flip cycle for the Work module

**Status: Superseded by [ADR 0004](./0004-five-up-grid-replaces-sliding-window-cycle.md) (2026-05-16).** The cycle read as a contrivance at 5 case studies — single-flip-per-slot doesn't register as choreography. Replaced by a static 5-up grid (3+2 desktop, vertical stack mobile). Reasoning preserved below for the catalog-growth revisit (~8 projects).

The portfolio grew from 4 to 5 case studies, but the home Work module's
desktop layout is hard-anchored to 4 corner slots with the "Work" title
floating dead-center. Rather than restructure to a 5-up grid (which would
break the symmetric corner aesthetic) or pick a featured project (which
would impose a ranking), we ride the existing 168 svh of Work scroll: each
of the 4 corner slots cycles ONCE from project N to project N+1 across the
Work IDLE beat, staggered in reading order (TL early → BR latest). At Work
entry the slots show projects [1,2,3,4]; at Work exit they show [2,3,4,5].
Every project gets equal screen time; scroll position dictates which.

The crossfade itself is a **channel-flip snap**: as scroll approaches a
slot's flip center, the card's `scaleY` collapses to 0 (CRT power-down),
a brief white flash punctuates the moment, then `scaleY` expands back to 1
with the next project visible. Pure scroll-driven (no time-based
animation), so the snap is fully scrubbable backward and stays in sync
with whatever scroll cadence the user has.

## Why

- **Symmetry preserved.** The 4-corner desktop layout was tuned to leave
  the centered title and the surrounding shader visible. A 5-up grid would
  re-litigate that geometry; cycling does not.
- **No project ranking forced.** Every featured project gets equal time in
  a slot. The order of appearance is a function of `data/projects.ts`'s
  `order` field, not a featured/non-featured distinction.
- **Reads with the home page's identity.** The home is scroll-driven
  everywhere else (module crossfades, shader chemistry, slot-rect
  interpolation); the Work cycling is in the same vocabulary.
- **CRT-aesthetic match.** `FrameHoldCard` already uses scanline overlays
  and chromatic-aberration borders. The `scaleY → 0` collapse + flash
  reads as a TV channel change — same vocabulary, no new visual idiom.

## Considered alternatives

- **Quincunx (4 corners + 1 dead-center, title moves to vertical edge).**
  Most elegant single-shot fix; preserves all 5 simultaneously. Rejected:
  rotating/relocating the centered "Work" title disrupts the existing
  module's typographic anchor.
- **Featured + 4 grid (one large hero card, four smaller around).**
  Forces a content-ranking decision (which case study is hero?) and
  creates a different visual hierarchy than the rest of the homepage.
- **Asymmetric 5-up grid (3 + 2 with title between).**
  Most editorial-feeling but biggest layout lift; loses corner symmetry.
- **Pure opacity crossfade for the slot transition.**
  Cheapest, but reads as anonymous against a page that has visual
  identity in every other transition. The channel-flip is in dialogue
  with the existing scanline/CRT vocabulary.

## Consequences

- `WorkOverlay.tsx` now owns the `SlotCycle` component, the
  `useWorkIdleU` helper, and the `SLOT_FLIP_CENTERS` schedule. `.slice(0, 4)`
  is dropped — all featured projects flow through.
- Reduced-motion / no-progress path renders a `StaticWorkLayout` —
  vertical stack of all 5 cards, no cycling. Distinct code path for that
  fallback, intentional: cycling without scroll has no signal.
- The Work IDLE beat duration (currently 168 svh of the 1120 svh total) is
  now load-bearing — if it shrinks below ~120 svh the staggered flips
  start crowding each other. Document this in CONTEXT.md.
- Each slot renders two `FrameHoldCard` images (well, one at a time via
  `useState`-swap) plus listens to a single `MotionValue` event. Cheap.
