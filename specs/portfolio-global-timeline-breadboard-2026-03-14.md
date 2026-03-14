# Portfolio Global Timeline Cleanup — Breadboard (2026-03-14)

## Objective
Translate the shape doc into a buildable execution plan that rewires module ownership for the homepage without redesigning the whole portfolio.

## Core diagnosis
The bug is not just timing values. The bug is **timing governance**.

Current state:
- Scene visibility mostly uses global `scrollYProgress`
- HTML overlays/cards use a mix of `heroSectionProgress`, `forestSectionProgress`, and global ranges
- Result: previous and next modules can both think they are active

The breadboard solution is:
1. define one global timeline
2. pipe every content-bearing layer through it
3. tune only after governance is unified

---

## Proposed implementation slices

### Slice A — establish the timeline contract
**Goal:** Create one reusable source of truth for module windows.

#### Work
- Add a shared timing constant/helper in one of these forms:
  - inline near top of `HomeClient.tsx`, or
  - extracted helper file if cleaner
- Define windows for:
  - hero
  - forest
  - camp
  - alpine
  - summit
- Include enough structure for:
  - module ownership
  - enter fade
  - exit fade
  - optional child sequencing windows

#### Done when
- No key timing windows are hardcoded across multiple unrelated locations without reference to the shared contract

---

### Slice B — move HTML/content layers onto the contract
**Goal:** Make content obey the same module ownership model.

#### Targets
1. Hero overlay
   - currently: `heroSectionProgress`
   - target: global timeline contract

2. Forest narrative cards
   - currently: `forestSectionProgress` + local ranges `[0.08..0.92]`
   - target: derive from forest global ownership band

3. Camp / Skills shell
   - currently driven from global progress but not explicitly tied to shared module contract
   - target: camp module ownership band

4. Alpine cards
   - currently `alpineRanges` in raw global values
   - target: alpine ownership band + internal stagger inside that band

5. Summit CTA/footer
   - currently raw global transforms near `0.975..1`
   - target: summit ownership band + intentional child sequencing

#### Notes
- Internal stagger is allowed, but only within the parent module's window
- No child beat should start before its parent module is active

#### Done when
- All major visible text content reads from one contract and no section-local scroll tracker decides cross-module handoff behavior

---

### Slice C — move scene group visibility onto the same contract
**Goal:** Scene ownership and content ownership stop disagreeing.

#### Targets in `UnifiedScene.tsx`
1. HeroSceneGroup visibility
2. ForestSceneGroup visibility
3. CampSceneGroup visibility
4. AlpineSceneGroup visibility
5. SummitSceneGroup visibility

#### Current raw windows
- Hero: `< 0.25`
- Forest: `0.24 -> 0.58`
- Camp: `0.44 -> 0.71`
- Alpine: `0.64 -> 0.91`
- Summit: `> 0.84`

#### Target
Replace raw visibility checks with references to the shared contract so scene and content share the same boundaries.

#### Done when
- Scene groups consume the same module windows as the HTML/content layers

---

### Slice D — re-sequence intra-module beats
**Goal:** Preserve rhythm after governance is fixed.

#### Forest
- card 1/2/3/4 should sequence inside forest ownership window
- if useful, align to tree/sprite beats, but only after module timing is clean

#### Camp
- shell, rack, and any supporting motion should sequence cleanly inside camp window

#### Alpine
- cards should stage inside alpine window
- bird sprite should feel like supporting motion, not early proof content

#### Summit
- cinematic reveal first
- CTA next
- footer/supporting links last

#### Done when
- transitions feel intentional rather than simultaneous or muddy

---

## Proposed target windows (starting draft)
These are a planning draft. Kyle can tune if needed, but should keep the same overall structure.

```ts
hero   = { enter:[0.00,0.06], own:[0.00,0.22], exit:[0.16,0.22] }
forest = { enter:[0.22,0.28], own:[0.22,0.44], exit:[0.38,0.44] }
camp   = { enter:[0.44,0.50], own:[0.44,0.64], exit:[0.58,0.64] }
alpine = { enter:[0.64,0.72], own:[0.64,0.84], exit:[0.78,0.84] }
summit = { enter:[0.84,0.92], own:[0.84,1.00], exit:[0.96,1.00] }
```

### Internal child sequencing examples
```ts
forestCards within forest own window:
- card1: 0.24 -> 0.29
- card2: 0.29 -> 0.34
- card3: 0.34 -> 0.39
- card4: 0.39 -> 0.44

alpineCards within alpine own window:
- card1: 0.66 -> 0.71
- card2: 0.71 -> 0.76
- card3: 0.76 -> 0.81
- card4: 0.81 -> 0.84
```

These are illustrative. Maintain the principle even if the exact numbers move.

---

## Code-level guardrails for Kyle
1. **Do not redesign the portfolio** — timing/ownership cleanup only
2. **Do not rewrite module visuals from scratch**
3. **Do not remove sections/content**
4. Prefer shared helpers/constants over repeated raw literals
5. Remove or stop using section-local progress for cross-module ownership decisions
6. Preserve build + lint cleanliness

---

## Validation checklist
- [ ] Hero overlay fully faded before forest cards become meaningfully visible
- [ ] Forest cards do not appear while hero still owns the screen
- [ ] Camp content does not enter while forest still owns
- [ ] Alpine cards wait until camp ownership has ended
- [ ] Summit reveal waits until alpine has meaningfully exited
- [ ] Scene visibility windows match content ownership windows
- [ ] `npm run build` passes in `portfolio/web`
- [ ] `npm run lint` has 0 errors

---

## Dispatch framing for Kyle
Kyle should implement the structural timing cleanup and stop at a clean buildable checkpoint. He does **not** need to do final aesthetic perfection on this pass.

Priority order:
1. shared contract
2. content ownership
3. scene ownership
4. sequencing sanity
5. build/lint verification

If timing still needs visual polish after this, that becomes a short follow-up pass instead of another architectural firefight.
