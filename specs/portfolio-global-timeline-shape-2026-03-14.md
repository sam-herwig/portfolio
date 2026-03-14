# Portfolio Global Timeline Cleanup — Shape (2026-03-14)

## Goal
Replace the portfolio homepage's mixed scroll/timing model with one canonical global module timeline so each major section owns the screen in a clean sequence:

1. Hero
2. Forest
3. Camp / Skills
4. Alpine / Work
5. Summit / CTA

The immediate product goal is to stop visual/content overlap like:
- forest cards appearing while hero still owns the screen
- alpine content hinting before camp has exited
- scene visibility and HTML overlays following different timing systems

## Why this work exists
The current page is using **two competing timing systems**:

### Scene timing (global page progress)
`web/src/components/UnifiedScene.tsx`
- Hero scene visible while `p < 0.25`
- Forest scene visible `0.24 -> 0.58`
- Camp scene visible `0.44 -> 0.71`
- Alpine scene visible `0.64 -> 0.91`
- Summit scene visible `p > 0.84`

### Content timing (mixed clocks)
`web/src/components/HomeClient.tsx`
- hero overlay uses `heroSectionProgress`
- forest narrative cards use `forestSectionProgress`
- camp content uses global `scrollYProgress`
- alpine cards use global ranges
- summit content uses global ranges

This split makes module handoffs unreliable because content and scenery are not obeying the same ownership rules.

## Current symptoms
1. Hero still present while forest cards appear
2. Handoffs feel muddy instead of intentional
3. Timing tweaks can improve one section while making another worse
4. The code encourages local range patches instead of a global contract

## Product principle
**One module owns the screen at a time.**

Each module has three states:
- **Dormant** — not visible, not hinting
- **Owning** — primary content + supporting scene visible
- **Exiting** — intentional fade/transition before next module can begin meaningful reveal

Rule: meaningful content for module N+1 should not render until module N has completed its exit window, unless overlap is explicitly designed and documented.

## Proposed architecture
Create a shared module timeline contract that all content and scene layers consume.

### Example shape
```ts
export const MODULE_TIMELINE = {
  hero: {
    ownStart: 0.00,
    ownEnd: 0.22,
    enterStart: 0.00,
    enterEnd: 0.06,
    exitStart: 0.16,
    exitEnd: 0.22,
  },
  forest: {
    ownStart: 0.22,
    ownEnd: 0.44,
    enterStart: 0.22,
    enterEnd: 0.28,
    exitStart: 0.38,
    exitEnd: 0.44,
  },
  camp: {
    ownStart: 0.44,
    ownEnd: 0.64,
    enterStart: 0.44,
    enterEnd: 0.50,
    exitStart: 0.58,
    exitEnd: 0.64,
  },
  alpine: {
    ownStart: 0.64,
    ownEnd: 0.84,
    enterStart: 0.64,
    enterEnd: 0.72,
    exitStart: 0.78,
    exitEnd: 0.84,
  },
  summit: {
    ownStart: 0.84,
    ownEnd: 1.00,
    enterStart: 0.84,
    enterEnd: 0.92,
    exitStart: 0.96,
    exitEnd: 1.00,
  },
} as const;
```

These are starting numbers, not sacred numbers.

## Scope
### In scope
- Introduce one shared timeline contract
- Move HTML/content overlays onto global ownership windows
- Move scene visibility to the same contract
- Sequence child beats *inside* module windows rather than across unrelated local clocks
- Hero/Forest/Camp/Alpine/Summit all included in the contract

### Out of scope
- new copy
- major visual redesign of the page
- replacing the 3D scene system wholesale
- general codebase cleanup unrelated to module timing
- case study detail page changes

## Success criteria
1. No forest card becomes meaningfully visible while hero is still in its ownership window
2. No camp content becomes meaningfully visible while forest still owns
3. No alpine content becomes meaningfully visible while camp still owns
4. Summit CTA/footer feels like a clean final reveal, not an early echo
5. Scene groups and HTML overlays consume the same timeline source
6. Build passes
7. Lint remains at 0 errors (existing non-blocking warnings can remain unless touched)

## Implementation strategy
Do this as a **global cleanup with staged rollout**, not one-off range tuning.

Recommended order:
1. Define shared timeline contract
2. Move all HTML/content layers to the contract
3. Move scene visibility windows to the contract
4. Tune intra-module pacing after the structure is correct

## Risks
- Over-correcting numbers and making the page feel too rigid
- Accidentally changing section pacing too much while fixing ownership
- Touching too many module-specific animations in the same pass

## Guardrails
- Keep changes focused to timeline + visibility logic
- Prefer introducing helpers/constants over scattered magic numbers
- Preserve the current narrative structure and content order
- Document overlap intentionally if any remains

## Files likely involved
- `portfolio/web/src/components/HomeClient.tsx`
- `portfolio/web/src/components/UnifiedScene.tsx`
- possibly a new shared timing helper file if that materially improves clarity

## Decision
Do the cleanup. The current timing model is structurally confused, and continued range tweaking is just paying interest on the same bug.
