# Portfolio Scene Lint Cleanup — Shape

Date: 2026-03-14
Repo: `/Users/ironclad/clawd/portfolio/web`

## Goal
Get the portfolio into a launch-clean state by eliminating the remaining lint failures concentrated in the 3D scene system, without breaking the live visual experience.

## Current Truth
- `npm run build` ✅ passes
- `npm run lint` ❌ fails
- Remaining lint debt is concentrated in scene modules, not the case-study/content layer.

## Files in Scope
1. `src/components/AlpineModule.tsx`
2. `src/components/CampModule.tsx`
3. `src/components/ForestModule.tsx`
4. `src/components/SummitModule.tsx`
5. `src/components/PostProcessingStack.tsx` (already stabilized for build; only revisit if needed)
6. `src/components/CaseStudyContent.tsx` (warning-only, optional final pass)

## Problem Categories

### 1) Over-broad `any` typing
Seen across Alpine / Camp / Forest / Summit helper components.

Examples:
- texture/material refs typed as `any`
- props like `position`, `scale`, `scrollProgress` loosely typed
- shader material aliasing via `as any`

### 2) React immutability lint vs Three.js mutation patterns
The code mutates objects inside `useFrame`, which is normal for Three.js, but the lint rules currently flag it.

Examples:
- `camera.position.x = ...`
- `camera.position.y = ...`
- `camera.rotation.x = ...`
- `clonedTex.offset.x = ...`

This is the biggest structural friction point.

### 3) Impure render-time generation
`CampModule` creates star positions with `Math.random()` inside render-time memo setup, which React lint flags as impure.

### 4) Dead code / unused values
Examples:
- unused imports
- unused local helpers (`FogLedge`, `BirdFlock`, `PanoramaLedge`, etc.)
- stale eslint-disable directives

### 5) Warning-only presentation debt
Not launch blockers, but cleanup candidates:
- `CaseStudyContent.tsx` still uses raw `<img>` instead of `next/image`

## Root Cause
These scene files were authored in a valid real-time graphics style, but the current lint stack is enforcing React purity/immutability expectations more aggressively than older Three.js code patterns assumed.

So this is not random slop — it is a mismatch between:
- imperative WebGL scene updates
- stricter React/TypeScript lint rules

## Constraints
- Do not break the visual feel of the portfolio scenes.
- Do not rewrite the whole scene architecture unless forced.
- Prefer minimal, mechanical fixes that preserve behavior.
- Keep build green throughout.

## Strategy

### Lane A — Mechanical cleanup first
- remove unused imports/values/helpers
- replace obvious `any` with real tuple/ref/material types where easy
- remove stale eslint-disable directives
- isolate warning-only files

### Lane B — Three.js mutation policy
Pick a single consistent approach for scene mutations:
1. either type them correctly and keep direct mutation where lint can tolerate it
2. or explicitly isolate/annotate the known-safe imperative sections

Do **not** mix ad-hoc hacks file-by-file.

### Lane C — Purity fixes
- move random star generation into a deterministic seeded helper or stable one-time initializer
- make render-time object creation explicit and stable

## Success Criteria
- `npm run build` passes
- `npm run lint` passes, or remaining failures are reduced to a single intentionally deferred class with justification
- scene behavior still renders correctly in local smoke test

## Recommended Order
1. `CampModule.tsx` — clearest purity fix target
2. `ForestModule.tsx` — smallest camera mutation surface
3. `AlpineModule.tsx` — largest file, repeated texture mutation pattern
4. `SummitModule.tsx` — finish strong after shared patterns are proven
5. `CaseStudyContent.tsx` — warning-only cleanup if energy remains

## Risks
- “Fixing” lint by neutering scene motion
- introducing texture lifecycle bugs while changing refs/types
- overengineering types for custom shader material wiring

## Non-Goals
- redesigning scene choreography
- replacing the rendering approach
- changing portfolio copy/content
