# Portfolio — Scroll Timeline Context

The vocabulary used to describe the long-scroll, single-Canvas homepage AND the
case-study pages. Each homepage "module" is a chapter (Hero / About / Work /
Contact); transitions between modules are first-class entities with their own
choreography and shader work. Case-study pages reuse some of this vocabulary
(Hero, Transition, HOLD beat) but apply it to a different surface — see the
"Case study" section below.

## Language

**Module**:
A homepage chapter — Hero, About, Work, or Contact. Each owns a slot rect, an
HTML overlay, and a shader mode inside the single fullscreen `BackgroundField`.
_Avoid_: section, scene, page

**Module slot**:
The viewport-percentage rectangle a module's shader normally renders into when
not transitioning (e.g., Hero = right half on desktop). Defined in
`MODULE_CANVAS_SLOT_DESKTOP` / `MODULE_CANVAS_SLOT_MOBILE`.
_Avoid_: window, region, frame

**Module window**:
The scroll-progress range over which a module is the dominant on-screen module,
expressed as `enterStart/enterEnd/exitStart/exitEnd` in `MODULE_WINDOWS`.
Adjacent modules share boundaries — the overlap IS the transition.
_Avoid_: scroll range, scroll segment

**Transition**:
The scroll span between two adjacent modules where the canvas leaves one
module's slot, expands fullscreen, hosts a handoff, then contracts into the
next module's slot. Three exist: `hero→about`, `about→work`, `work→contact`.
_Avoid_: crossfade (too narrow), interlude (too soft)

**Armature**:
The structural beats inside a transition — overlay-out → rect-expand → HOLD →
rect-contract → overlay-in. Constants live in `moduleTimeline.ts`. The armature
is preserved across redesigns; what fills HOLD is the design variable.

**HOLD beat**:
The middle dwell of a transition where the shader sits at fullscreen. Currently
hosts the letter moment; post-redesign hosts the chemical reaction.
_Avoid_: pause, dwell-only (HOLD has shader content)

**Letter moment** _(deprecated, being removed)_:
The current HOLD-beat content — the next module's name (`About`/`Work`/
`Contact`) rendered as a stylized letterform via `LetterFillField`, with a
six-beat reveal/HOLD/dissipate choreography. Being replaced by the chemical
reaction.
_Avoid_: letterfields (was used colloquially, ambiguous with the field shader)

**Chemical reaction** _(new)_:
The HOLD-beat content that replaces the letter moment. Both the outgoing and
incoming module shaders run at fullscreen with a mix factor sweeping 0→1, and
each one's luminance distorts the other's UV — outgoing→incoming early in
HOLD, incoming→outgoing late in HOLD. Phased asymmetric warp.
_Avoid_: crossfade, blend (both undersell the warp)

**Cursor magnet**:
The pointer-driven UV warp layered on `BackgroundField`'s output. Modes:
Magnet / Repel / Swirl / Ripple / Lens. State lives in `useSceneStore`.
Independent of the chemical reaction; both warps compose.

**Work grid**:
The Work module's desktop layout — a 5-up grid with the "Work" title in a
top band and the case studies arranged as 3 cards on top + 2 centered on
the bottom row. All cards are the same size; the bottom row's flanking
margins let the shader peek through. No cycling, no ranking; all 5 case
studies are equally on screen for the full **Work IDLE beat**.

**Work stack** _(mobile)_:
The Work module's mobile layout — a vertical full-width stack of all 5
cards. The stack translates upward (`translate-Y`) across the Work IDLE
beat so each card gets prime screen time as the user scrolls through the
module. Distinct from the desktop static **Work grid** in motion, same
in content.

**Work IDLE beat**:
The dwell inside the Work module between the end of the about→work
transition and the start of the work→contact transition. 100 svh of the
1052 svh total (was 168 of 1120 under the deprecated **Sliding window
cycle**). Hosts the static **Work grid** on desktop and the translating
**Work stack** on mobile.

## Relationships

- A **Module** owns one **Module slot** and one **Module window**
- Two adjacent **Modules** are bridged by one **Transition**
- A **Transition** runs an **Armature** of beats; the **HOLD beat** is the
  designable middle
- The **Chemical reaction** is the content that fills the **HOLD beat**

## Example dialogue

> **Dev:** "What's living in the HOLD beat after we kill the letter moment?"
> **Sam:** "The chemical reaction. Outgoing module's shader and incoming
> module's shader both run fullscreen, and each warps the other — outgoing
> imprinting on incoming first, then incoming disturbing outgoing as it leaves."
> **Dev:** "And the armature stays the same?"
> **Sam:** "Yeah, rect-expand and rect-contract both stay. Just HOLD shrinks
> from ~63 svh to ~30 svh per transition."

## Case study

**Case-study hero shader**:
The bespoke per-project shader at the top of a `/work/[slug]` page. One per
project (mb/nb/cc/ck/pl), driven by `CaseStudyHeroLayer` inside the **global
persistent Canvas**. Post-redesign (decided 2026-05-15) it no longer runs as
an omnipresent backdrop — it lives in the **Hero band** and exits there.
The hero shader is the only case-study shader that lives in the global
canvas — chapter transitions and image-dither both use **per-region scoped
canvases** instead.
_Avoid_: case-study background (implies omnipresent), case-study scene.

**Hero band**:
The case-study page's opening region — a ~200svh pinned scroll region that
hosts the project title, overview, and the case-study hero shader. Layout is
2-col on desktop: left half = shader (sticky canvas), right half = HTML
divided into two stacked `min-h-[100svh]` rectangles — the **Hero slot** on
top, the **Brief slot** below. The right column scrolls naturally past the
pinned canvas. On mobile the shader pins as a 1:1 top strip and the HTML
hero + brief stack beneath it sequentially. The shader runs **cycles = 1**
here, traversing K0→K1→K2→K3 once across the band's scroll runway — Hero
slot paces K0→K1, Brief slot paces K2→K3. At the band's end the canvas
unsticks and scrolls off the top of the viewport; below the Hero band, body
content reads on clean HTML in the centered **Body column**.

**Hero slot**:
The top half (`min-h-[100svh]`) of the **Hero band**'s right column on
desktop. Hosts `CaseStudyHero` — `project.year` / `project.role` /
`project.client`, the project title, the overview headline + body, the tag
chips, and the "Visit live ↗" CTA. On mobile, the hero slot is the first
content block beneath the pinned 1:1 strip (no rigid `min-h` since there's
no slot to fill against a parallel shader runway). Owned by `CaseStudyHero.tsx`.
_Avoid_: hero header, hero section.

**Brief slot**:
The bottom half (`min-h-[100svh]`) of the **Hero band**'s right column on
desktop. Hosts chapter-01 content sliced from `project.blocks[]` — by
convention, the "01 The Brief" chapter mark plus its first text-block.
The slice ends at the first `chapter === '02'` mark (everything before it
flows into the Brief slot, everything from it onward stays in the **Body
column**). Renders the same `ChapterBlock` / `TextBlock` types as the body
but via the `variant: 'brief'` render path — shrunken DNA (smaller chapter
number, smaller title, vertical-stack text-block, narrower reading column).
On mobile, brief blocks stack into the natural flow beneath the Hero slot
and their `variant: 'brief'` styles collapse to body-equivalent. Owned by
`CaseStudyBrief.tsx`.
_Avoid_: brief beat (no — it's a slot, not a transition middle), intro
panel, brief column.

**Body column**:
The case-study layout region that lives below the **Hero band** — wider,
centered, larger reading type. Distinct from today's right-half column where
all body content currently lives. Width / type scale / media-breakout rules
TBD (Q4 in the 2026-05-15 grilling session).

**Chapter transition** _(case study)_:
A full-bleed, shader-driven interlude between two adjacent **case-study
chapters**, modeled on the homepage **HOLD beat**. Each is bespoke per project
(its own shader, not a hero-shader replay). Only the "earned" narrative pivots
from the 3-tier spine host one — pure-magazine (mission-bell) = 0;
magazine-plus (new-belgium, consume-and-create) = 1 at the pivot;
zine (craftedkit) = 4. A plain HTML chapter break does NOT get a transition
unless it's one of the earned pivots.

Two scroll mechanics in use:
- **reveal-dissolve** (~80–100svh, no pin): shader section scroll-scrubs as you
  read past it. Used for lighter chapter punctuations
  (NB ch02, CK ch02 / ch03 / ch05).
- **pinned-scrub** (~200–300svh, sticky): shader stays pinned to viewport
  while you scroll through its keyframe sequence. Used for "centerpiece"
  pivots (C&C ch03 Perf-Motion Braid, CK ch04 Pipeline Flow).

_Avoid_: chapter break (the HTML chapter marker is a separate thing); chapter
screen (the prior name — kept in the spine memory for continuity but
deprecating in favor of "chapter transition").

**Image dither**:
The shader applied to media-block images on case-study pages
(`DitheredImage` / `DitheredPlane`). Per-block lifecycle, not omnipresent.
Survives the runway redesign — unaffected.

## Navigation transitions

**Slide-in** _(home → case-study)_:
The desktop choreography from `/` to `/work/[slug]`. Two-phase: (1) the canvas
wrapper's clip-path contracts from the **slide origin** (the rect the user saw
at click) to `CS_SLOT_DESKTOP` (left half) over 600ms easeOutCubic, then (2)
`csHeroWeight` fades 0→1 over 500ms easeInOut starting at +450ms, morphing the
Work-mode `BackgroundField` into the bespoke **case-study hero shader** inside
the now-settled slot. The 150ms overlap hides the seam. Mobile, direct entry,
slug→slug navigation, and reduced-motion all **snap** (no animation). See
`web/docs/adr/0006-home-to-case-study-slide-in-two-phase.md`.
_Avoid_: page transition (too generic), case-study reveal (overloads "reveal-
dissolve" from chapter transitions).

**Slide origin**:
The `CanvasSlot` snapshot captured in `SceneCanvas.tsx` at the moment a
forward slide starts — `{ top, left, w, h }` read from the rAF-driven
MotionValues so it reflects what was visually on screen, not what the store
says. Held in a `useRef` until the contract animation completes; while
non-null, `computeTargetSlot` uses it as `home` instead of
`canvasSlot(scrollProgress)`. Necessary because case-study `ScrollProgress`
clobbers `scrollProgress` shortly after mount.
_Avoid_: source rect, click rect.

## Flagged ambiguities

- "**Letterfield**" was used by Sam to mean both the `LetterFillField` shader
  AND the letter-moment beat — resolved: the shader is being deleted, the beat
  is being replaced by the **Chemical reaction**, the term is retired.
- "**Interaction between modules**" was ambiguous between (a) the visual
  handoff mechanic, (b) cursor reactivity, and (c) cross-module bleed —
  resolved: in this codebase, it means (a) the **Transition** mechanic.
