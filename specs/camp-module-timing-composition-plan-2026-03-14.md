# Camp Module — Timing + Composition Plan

Date: 2026-03-14
Area: `portfolio/web` camp checkpoint (`HomeClient.tsx`, `GearRack.tsx`, `UnifiedScene.tsx`)

## Goal
Make Camp feel like an intentional checkpoint in the journey instead of a nice skills block dropped on top of a cool background.

## Current Truth
- Camp scene is live on the global scroll band: `0.44 -> 0.71`
- Camp foreground content is currently driven by `whileInView`, not the global band
- Foreground composition is a centered `GlassPanel` containing:
  - heading
  - 3 lead cards
  - skill pills
- Background atmosphere is strong:
  - starfield
  - embers
  - campfire video ledge

## Core Problems
1. **Timing mismatch**
   - Scene uses global timing
   - Foreground uses local viewport timing
   - Result: checkpoint lacks cinematic coordination

2. **Composition too generic**
   - Centered glass card + 3-up cards is readable but familiar
   - Feels assembled, not composed

3. **Interaction hierarchy is weak**
   - Desktop hover hides useful supporting text
   - Mobile is clearer than desktop in some cases, which is backwards

4. **Motion language is not camp-specific**
   - Foreground motion feels generic spring UI
   - Background motion feels environmental

## Design Direction
Camp should feel like:
- a **basecamp briefing**
- a temporary warm shelter between harder climbs
- a place where the work becomes legible without breaking the world

That means:
- readable and grounded
- warmer and denser than Hero/Forest
- less symmetric than current
- less "premium glass UI"
- more "field notes / expedition board / firelit station"

## Timing Plan
Bind all foreground camp content to the same global camp band.

### Global camp band
- Full camp visibility: `0.44 -> 0.71`

### Proposed sub-bands
1. **Arrival / darkening** — `0.44 -> 0.49`
   - scene comes alive
   - foreground panel rises in
   - heading appears first

2. **Primary capability reveal** — `0.49 -> 0.58`
   - lead cards reveal in sequence
   - one deliberate stagger, not a cascade circus

3. **Tooling bed / hold state** — `0.58 -> 0.66`
   - essentials/pills settle in
   - section remains readable while scene peaks

4. **Departure / fade to alpine** — `0.66 -> 0.71`
   - foreground softens and lifts out
   - leave enough time for the next climb to feel earned

## Composition Plan
### Current
- One centered container
- Inner 3-column grid
- Pills below

### Proposed
Keep one primary shell for now, but change the composition language:

#### Option A — safest / likely best first pass
- Keep one main panel
- Shift it **slightly off-center** on desktop
- Introduce stronger internal asymmetry:
  - heading and intro copy aligned left
  - cards in a 2+1 rhythm instead of pure 3-up sameness
  - essentials as a denser lower field

#### Option B — bolder second pass
- Split into two zones:
  - left: section framing copy + one anchor skill
  - right: stacked capability modules
- This is stronger but riskier; not the first move unless Option A still feels generic

## Foreground Structure Recommendation
### Top row
- Eyebrow: small camp marker label
- Heading: `The Gear.`
- 1-2 sentence framing copy explaining the skills as expedition tools, not random tags

### Middle row
Lead capabilities as the primary reading path:
1. Three.js / WebGL
2. GLSL Shaders
3. AI Agent Pipelines

But avoid identical card energy.
Recommended rhythm:
- Card 1 larger / anchor card
- Cards 2 and 3 slightly subordinate

### Bottom row
Essentials stay secondary:
- smaller
- tighter
- less hover reliance
- treat like supporting kit, not headline content

## Motion Plan
### Keep
- atmospheric background motion
- slight card lift / depth response

### Change
- reduce generic spring-card feel
- replace with subtler "settle into camp" motion:
  - fade + low vertical drift
  - slight warmth pulse only where meaningful
  - avoid too many simultaneous hover effects

### Rule
Foreground motion should feel like it belongs to the firelight, not a SaaS pricing section.

## Content / Interaction Plan
1. **Do not hide important taglines behind hover only**
   - on desktop, supporting text should be visible or at least partially persistent
2. **Reduce dependence on hover glow as meaning**
3. **Make scan order obvious in under 2 seconds**

## Priority Order
### Pass 1 — structural sync
- Move camp foreground to global timing bands
- Add heading/copy/card/pills band logic
- Keep current content mostly intact

### Pass 2 — composition cleanup
- Reduce centered generic feel
- create asymmetry inside the panel
- establish anchor-card hierarchy

### Pass 3 — motion polish
- tune camp-specific motion
- remove any movement that feels decorative rather than useful

## Success Criteria
Camp is successful when:
- it feels like a deliberate pause between Forest and Alpine
- foreground and background rise/fall together
- the section reads fast on laptop and mobile
- it no longer feels like a generic glass feature grid dropped into a cinematic page
- users can understand the skill stack without needing hover discovery

## Recommended Next Build Slice
If we implement this, start with:
1. global timing for camp foreground
2. visible support copy for lead cards
3. internal asymmetry inside the current panel

Do **not** start with icon redesigns or fancy new effects. That is how we waste an hour and call it progress.
