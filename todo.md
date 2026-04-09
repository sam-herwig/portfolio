# Case Study Page Redesign

Craft-forward scrollytelling case studies with trail-themed framing and bespoke spotlight slots.

## Phase 1: Foundation (DONE)

- [x] 1. Define typed block data model in `projects.ts`
- [x] 2. Migrate existing project content into the new block structure
- [x] 3. Kill the modal intercept route, add scroll position preservation on return
- [x] 4. Build the shared case study skeleton component (scrollytelling framework)
- [x] 5. Capture video recordings and screenshots for all projects
- [x] 6. Compress/convert assets (MP4 <5s, WebP statics)
- [x] 7. Write and humanize copy for all 4 projects
- [x] 8. Wire blocks, assets, and copy into `projects.ts`
- [x] 9. Frostier glass panels (bumped to bg-background/93)

## Phase 2: Atmosphere & Hero (CURRENT)

- [x] 10. **E — Velocity-reactive paper texture atmosphere**
  - PaperAtmosphereMaterial GLSL shader (simplex noise, fBm, fiber texture)
  - CaseStudyScene R3F canvas, fullscreen quad at z=-10 (depth-scaled)
  - Scroll velocity drives directional ripple + grain stretch
  - Per-project accent color watercolor seep from edges
- [x] 11. **H — Generative trail hero (parallax scroll-through)**
  - 130vh header, 3 parallax layers (bg/mid/fg) with depth-aware sizing
  - Per-project biomes: NB, CK, MB, CC with unique landmark compositions
  - WoodcutMaterial + uPaperOpacity for transparent paper, per-layer ink opacity
  - Desktop: mouse hover watercolor + gentle ambient sway
  - Mobile: scroll-velocity wind + scroll-position watercolor
  - Sticky title at top-[55vh], timestamp-seeded daily layout variation
  - **Needs visual tuning pass** (element positions, opacity balance)

## Phase 3: Media & Navigation

- [x] 12. **A — Woodcut border dissolve on media blocks**
  - WoodcutBorder component: torn-edge mask, scroll-driven dissolve inward
  - Tinted with `--cs-accent`, applied to MediaBlockRenderer only
- [x] 13. **F — Topographic elevation profile progress indicator**
  - ElevationProfile component: SVG path from block density, glowing dot, chapter waypoints
  - Accent-colored active portion, fixed right sidebar (desktop only)

## Phase 4: Transitions

- [ ] 14. **D — Watercolor bleed chapter wipes**
  - Overlay flow, no scroll pinning
  - Accent color bleeds across viewport as fixed overlay
  - Content continues scrolling beneath the wash
  - Per-chapter hue variation from project palette
  - Velocity-responsive: fast scroll = quick wash, slow = lingers
- [x] 15. **B — Ink wash page transition (homepage → case study)**
  - InkWashTransition component: click-origin radial spread, 0.7s enter / 0.6s exit
  - ink-wash-horizontal.webp as CSS mask, tinted with project accent color
  - Zustand transition state (entering/exiting), router.push on enter complete
  - BackToTrail reverse transition with dark ink
  - Graceful fallback: native Link still works if JS fails

## Phase 5: Spotlight Slots

- [ ] 16. New Belgium theme-switcher interactive demo
- [ ] 17. CraftedKit pipeline diagrams (Claude workflow — need to create net new)
- [ ] 18. Mission Bell spotlight (GSAP transition replay/scrubber)
- [ ] 19. C&C spotlight (performance metrics visualization)

## Phase 6: Polish

- [ ] 20. Homepage canvas teardown on case study navigate, rebuild on return
- [ ] 21. Progressive enhancement (capability detection, fallbacks)
- [ ] 22. Per-project color palettes fully applied

## Assets

All 24 case study illustration assets processed and ready:
- `web/public/assets/graphics/case-study/` — transparent WebP, ~3.4MB total
- Shared nature elements (12): rocks, ridgelines, clouds, terrain, trees, trail marker
- Per-project themed (8): NB hop vine + cabin, CK crystals + fern, MB mesa + tower, CC cliff + lighthouse
- Transition textures (2): ink wash horizontal + vertical
- Border masks (2): organic edge + torn edge
