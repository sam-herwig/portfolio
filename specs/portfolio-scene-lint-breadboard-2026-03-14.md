# Portfolio Scene Lint Cleanup — Breadboard

Date: 2026-03-14
Depends on: `portfolio/specs/portfolio-scene-lint-shape-2026-03-14.md`

## Objective
Turn the remaining scene-system lint failures into thin, testable slices.

---

## System Map

### Runtime layers
1. **Page composition**
   - `HomeClient.tsx`
   - mounts scene modules and content sections

2. **Scene modules**
   - `ForestModule.tsx`
   - `CampModule.tsx`
   - `AlpineModule.tsx`
   - `SummitModule.tsx`
   - each owns one phase of the scroll journey

3. **Shared visual infrastructure**
   - `PostProcessingStack.tsx`
   - `DeepForest.tsx`
   - shader materials / texture helpers

4. **Case-study/content layer**
   - now mostly clean
   - not the current blocker

---

## Failure Clusters by File

### Slice 1 — Camp purity slice
**File:** `src/components/CampModule.tsx`

**Problems**
- `Math.random()` used in star generation during render-time memo creation
- `any` refs/props
- camera mutation lint

**Plan**
- create deterministic `buildStarfieldPositions(count, seed)` helper
- type the `Points` ref/material surface more narrowly
- decide/standardize how camera mutation is handled in `useFrame`

**Done when**
- Camp purity errors are gone
- starfield still renders

---

### Slice 2 — Forest camera slice
**File:** `src/components/ForestModule.tsx`

**Problems**
- `WoodcutShader as any`
- camera mutation lint
- minor unused import cleanup

**Plan**
- remove dead imports
- type what can be typed cheaply
- apply the same camera-mutation policy proven in Camp

**Done when**
- Forest lint falls to zero or only justified shader typing remains

---

### Slice 3 — Alpine texture + camera slice
**File:** `src/components/AlpineModule.tsx`

**Problems**
- repeated `any` props
- repeated `clonedTex.offset.x` mutations
- repeated camera mutation pattern
- dead helper components may be removable

**Plan**
- introduce shared tuple prop types for `position` and `scale`
- replace repeated loose material refs with typed refs where realistic
- standardize texture-offset mutation handling
- remove unused helpers if truly dead

**Done when**
- Alpine becomes the reference pattern for sprite/texture mutation

---

### Slice 4 — Summit parity slice
**File:** `src/components/SummitModule.tsx`

**Problems**
- same family as Alpine, plus several broad `any` props
- stale eslint-disable noise

**Plan**
- apply proven Alpine patterns
- remove stale disables
- type only the hot paths needed for lint compliance

**Done when**
- Summit no longer introduces novel lint classes

---

### Slice 5 — Optional image optimization slice
**File:** `src/components/CaseStudyContent.tsx`

**Problems**
- raw `<img>` warnings only

**Plan**
- swap to `next/image` only if it does not complicate the gallery/hero behavior

**Done when**
- warnings reduced, no visual regression

---

## Policy Decisions Needed Before Coding

### A. How to treat Three.js object mutation in `useFrame`
We need one consistent answer:
- direct mutation with lint-safe structuring, or
- explicit narrowly-scoped suppression where the imperative pattern is genuinely required

Recommendation: prefer **narrow, documented exceptions** over fake functional rewrites that make the code worse.

### B. How far to push typing
Recommendation:
- type props/refs/tuples/materials where cheap and clear
- do not burn hours trying to perfectly type custom shader internals if a narrow cast is the honest answer

### C. What counts as launch-clean
Recommendation:
- build green
- all scene lint errors cleared
- warning-only image optimization can be last

---

## Execution Order
1. Camp
2. Forest
3. Alpine
4. Summit
5. CaseStudyContent (optional)

---

## Verification Loop Per Slice
1. edit one file / one class of issue
2. run `npm run lint`
3. run `npm run build`
4. quick smoke in browser if motion/render path changed

---

## Exit Condition
Portfolio is considered launch-clean when:
- the AI pipeline case study is wired (done)
- build passes (done)
- scene-system lint cluster is resolved or intentionally narrowed to a documented final exception set
- final homepage + one case-study smoke pass still look correct
