# Chemical reaction replaces the letter moment in homepage transitions

The homepage's three inter-module transitions used a dedicated shader entity
(`LetterFillField`) that took the canvas fullscreen and rendered the next
module's name as a six-beat letterform choreography (reveal → HOLD → dissipate)
across ~63 svh of dwell per transition. We're deleting that and putting the
shader-on-shader **chemical reaction** in its place: both module shaders run
fullscreen during HOLD with their luminance reciprocally distorting each
other's UV, direction flipping at the HOLD midpoint. HOLD shrinks from
~63 svh → ~30 svh per transition (~100 svh total scroll reclaimed). The
transition **armature** (overlay-out → rect-expand → HOLD → rect-contract →
overlay-in) is preserved; only the HOLD content changes.

## Why

The letter moment was doing two jobs — typographic punctuation between modules
AND visual handoff between shader modes. The visual handoff already happens
for free in `BackgroundField.tsx:635-647` (additive weight blend across module
modes); the letter moment was painting opaque black on top of it during HOLD,
hiding the existing crossfade. We get more design payoff from making the
underlying handoff visible and dramatic than from the typographic announcement
the letters were providing — module identity is already carried by each
module's HTML overlay copy. Each module's overlay headline IS the announcement.

## Considered alternatives

- **Drop the fullscreen armature, modules cross-blend in their slots.**
  Reclaims more scroll but loses the deliberate "moment between chapters"
  punctuation. Rejected: the rect-expand-to-fullscreen mechanic gives the
  transition its weight and we want to keep that.
- **Keep linear additive blend, just animate the existing weight curves.**
  Smaller change, smaller payoff. Rejected: the additive sum reads as
  "two patterns at half opacity," not as a designed handoff.
- **Spatial split with moving boundary.** Rejected: reads as a slideshow
  transition trope; less interesting than chemical reaction.
- **Tiny corner nameplate to preserve module labeling.** Rejected: introduces
  competing typographic voices during transition; clean tearout is preferable.

## Consequences

- `LetterFillField.tsx` deleted; `<LetterFillField />` removed from
  `SceneCanvas.tsx`; `LETTER_FILL_PRESETS` and `TRANSITION_PRESETS` pruned
  from `backgroundPresets.ts`.
- `MODULE_WINDOWS` percentages in `moduleTimeline.ts` rewritten against new
  shorter total (1440 svh → ~1340 svh).
- `BackgroundField.tsx` fragment shader gains chemistry-warp logic — each
  active module mode is sampled twice during HOLD (raw, then at warped UV
  driven by the other module's luminance). ~2× the per-pixel mode evaluations
  during HOLD only; cheap fallback (signature-pattern proxy) available if
  iOS perf is tight.
- `useSceneStore` cursor-warp fields stay (still drive `BackgroundField`); only
  the LetterFillField mirroring goes away.
- `CLAUDE.md` updated: stale `TextMaskScene` reference removed, chemical-
  reaction description added.
