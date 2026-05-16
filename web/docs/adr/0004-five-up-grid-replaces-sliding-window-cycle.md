# 5-up grid replaces sliding-window cycle for the Work module

The sliding-window channel-flip cycle (ADR 0002) was a clever fix for a
4-corner desktop layout that grew to 5 case studies. In practice it reads
as a contrivance at this catalog size: each slot does exactly one flip
ever across the 168 svh IDLE beat, which is too few flips to register as
a system. The mechanism would justify itself at 8–10 projects (multiple
flips per slot, "stream" instead of "one-shot fix"); at 5 it's wallpaper
over the actual question, which is "what's the right layout for 5?"

Replace it with a static 5-up grid:

- **Desktop**: title in a top band (relocated from dead-center), 3 cards
  on top + 2 cards centered on the bottom row, all cards the same size,
  shader visible in the bottom-row margins. No cycling, no animation
  during the IDLE beat — cards arrive together via the existing overlay
  opacity transform, sit static for 100 svh, exit together.
- **Mobile**: full-width vertical stack of all 5 cards, ~40 vh each. The
  stack translates upward (`translate-Y` driven by the same `workIdleU`
  helper that drove the cycle) so each card gets prime screen time as
  the user scrolls through the Work IDLE beat. Equivalent to a "longer
  mobile IDLE" without forking the timeline math.
- **Work IDLE beat shrinks** from 168 svh → 100 svh. The cycle math no
  longer dictates the dwell; the homepage tightens by 68 svh end-to-end
  (`TIMELINE_HEIGHT_SVH` 1120 → 1052) and `MODULE_WINDOWS` recompute
  against the new total.
- **Card chrome strips back**. The scanline overlay, chromatic-aberration
  borders, and `00:00 / 00:04` timecode badge were earning their keep as
  CRT-channel-flip vocabulary. Without the flip they read as decoration
  attached to nothing — drop them. Hover-to-saturate, video tell on
  hover, title/meta overlay, bottom legibility gradient, and the `↗`
  corner glyph all stay; they're independent of the CRT idiom.

## Why

- **The cycle didn't earn itself at 5.** Single-flip-per-slot doesn't
  register as choreography — it registers as a one-shot workaround for a
  layout that doesn't accommodate the catalog.
- **Anti-ranking preserved.** All 5 cards are the same size on desktop;
  on mobile every card gets equivalent translate-Y prime time. The
  original ADR 0002 constraint (no featured/non-featured distinction)
  survives without the cycle.
- **Layout-as-system instead of mechanism-as-system.** The 3+2 grid is a
  generic editorial pattern that scales to 6 (3+3) or 7 (3+4 / 4+3)
  without redesign. At ~8–10 we revisit; cycling re-enters the menu then.
- **Editorial vocabulary aligns the home with the case studies.** The
  case-study pages already lean magazine/zine (pure-magazine,
  magazine-plus, zine tiers in CONTEXT.md). Dropping the CRT chrome on
  the home Work module means the viewer's visual frame doesn't shift on
  click-through.
- **Homepage tightens.** 68 svh of recovered scroll is real — the cycle
  needed the 168 svh runway and the static grid does not. Net 1120 → 1052.

## Considered alternatives

- **Quincunx (4 corners + 1 dead-center, title moves to vertical edge).**
  Most geometrically rigorous solution for exactly 5. Rejected on Q4:
  preferred the editorial-spread vocabulary over the dice-face
  symmetry; the 3+2 also scales to 6+ without re-litigating layout.
- **2+3 (3 cards on the bottom row, 2 on top).** Visually heavier at the
  bottom; less natural reading flow. Rejected on Q6.
- **Varied card widths to fill rows edge-to-edge.** Forces implicit
  ranking (wider card reads as featured); contradicts anti-ranking.
- **Sequential / parade ("one project at a time, scroll moves through
  all 5").** Each project gets the full canvas at once, but viewers lose
  the at-a-glance comprehension and the homepage would read as five mini
  case studies rather than a portfolio summary. Rejected on Q3.
- **Keep cycling, smooth the flip aesthetic.** Polishes the symptom
  (animation fidelity) without addressing the diagnosis (contrivance at
  N=5). Rejected on Q1.
- **Curate to top 3 + "see all →" link to a /work index.** Cleanest
  layout problem, opens design space. Rejected on Q2 — anti-ranking
  still load-bearing.

## Consequences

- **Supersedes ADR 0002.** `SlotCycle`, `SLOT_FLIP_CENTERS`,
  `SLOT_FLIP_HALF_WIDTH`, and the `StaticWorkLayout` reduced-motion
  fallback's role as a code-divergent backup are all gone — the live
  desktop path IS effectively the static layout now. `useWorkIdleU`
  stays because mobile translate-Y uses it.
- **CONTEXT.md glossary updated.** "Sliding window cycle" and
  "Channel-flip snap" entries removed; "Slot" entry replaced by "Work
  grid" + "Work stack" (mobile). "Work IDLE beat" entry updated
  (duration + role).
- **`moduleTimeline.ts` recomputes all module-window boundaries** —
  every downstream consumer (`{Hero|About|Work|Contact}Overlay.tsx`,
  `BackgroundField.tsx` shader uniforms, `HomeSceneRoot.tsx` section
  height) picks up the change for free via the existing import contract.
- **Card chrome regression note**: if the editorial card visuals start
  to feel anonymous on the home (no texture, no chromatic borders, no
  videoplayer-as-metaphor), the fix is to add a single distinguishing
  detail (e.g., a hover-revealed eyebrow or a project-specific accent
  color) — not to reintroduce the CRT vocabulary, which was channel-flip
  vocabulary, not portfolio vocabulary.
- **At ~8 projects we revisit.** The cycle wasn't wrong in concept; it
  was wrong at this count. When the catalog grows past the 3+2 grid's
  comfortable ceiling, reopen this decision.
