# Codebase Audit Remediation

## Todo List

### Phase 1: Delete Dead Code
- [x] Delete `WatercolorCursorMaterial.ts` (unused)
- [x] Delete `InteractiveHero.tsx` (unused)
- [x] Delete `RefractionMaterial.ts` (only imported by InteractiveHero)
- [x] Delete orphaned e2e test files (card-diag, firefox-debug, layout-diag, real-render, webgl-test)

### Phase 2: Error Boundary
- [x] Create `src/app/error.tsx` with retry button

### Phase 3: Accessibility
- [x] Fix cursor hiding for keyboard users (pointer: fine + focus-visible restore)
- [x] Make ElevationBar waypoints keyboard-accessible (button elements, aria-labels, 44px touch targets)
- [x] Add `aria-hidden="true"` to decorative Canvas wrapper
- [x] Boost contrast on low-opacity text (/45 → /60, /40 → /60)
- [x] Add reduced-motion support (UnifiedScene reactive listener, scroll indicator, pulse animation)
- [x] Add aria-labels to icons and links (GearRack SVGs, CaseStudyCard links, mailto links)
- [x] Add section IDs for deep linking (about, skills, contact)

### Phase 4: Performance
- [x] Gate console.warn in PostProcessingStack behind NODE_ENV

### Phase 5: Code Quality
- [x] Replace blanket `eslint-disable` with targeted rule suppressions in DeepForest + UnifiedScene
- [x] Add section IDs for deep linking

## Verification
- [x] `npm run build` — passes clean, no TypeScript/build errors
- [x] `npm run lint` — no new warnings from modified files (remaining are pre-existing e2e + CaseStudyContent)

## Review

### Files Deleted (8)
- `src/components/shaders/WatercolorCursorMaterial.ts` — unused, 75 lines
- `src/components/InteractiveHero.tsx` — unused, 232 lines
- `src/components/shaders/RefractionMaterial.ts` — only used by InteractiveHero
- 5 orphaned e2e test files (card-diag, firefox-debug, layout-diag, real-render, webgl-test)

### Files Created (1)
- `src/app/error.tsx` — Next.js error boundary, catches runtime errors with "Try Again" button

### Files Modified (8)
1. **`globals.css`** — Cursor hiding now requires `(pointer: fine) and (hover: hover)`, restores cursor during keyboard nav via `:has(:focus-visible)`
2. **`ElevationBar.tsx`** — Waypoints changed from `<div>` to `<button>` with aria-labels and 44px touch targets (17px padding around 10px dot). Pulse animation disabled in reduced-motion.
3. **`HomeClient.tsx`** — aria-hidden on Canvas wrapper, section IDs (about/skills/contact), reduced-motion check on scroll indicator bounce, aria-labels on mailto links, contrast boost on subtitle text (/45→/60, /40→/60)
4. **`GearRack.tsx`** — `aria-hidden="true"` on all decorative SVG icons, contrast boost on labels (/45→/60, /40→/60)
5. **`CaseStudyCard.tsx`** — `aria-label="View {title} case study"` on card links
6. **`UnifiedScene.tsx`** — Reduced-motion detection now reactive via `matchMedia` change listener (responds to OS setting toggle). Blanket eslint-disable replaced with targeted rules.
7. **`PostProcessingStack.tsx`** — `console.warn` gated behind `process.env.NODE_ENV === 'development'`
8. **`DeepForest.tsx`** — Blanket eslint-disable replaced with targeted rules
