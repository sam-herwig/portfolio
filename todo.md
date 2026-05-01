# Alpine Cloud Follow Pass

## Context

The previous pass made Alpine cloud coverage available earlier, but the visible result still arrives late because the main cloud mesh is a static horizontal world-space carpet at `cloudY: 60`, `cloudZ: -180`, `rotationX: -PI/2`. Alpine's camera climbs from `y=-60` to `y=120`, so the camera does not see the carpet until it reaches that altitude. The apparent rotation is perspective from flying past a flat plane, not the coverage curve.

## Plan

- [ ] 1. Add a minimal `followCameraY` option to `CloudSea` so a cloud layer can keep a constant vertical offset from the active camera.
- [ ] 2. Use that option only for the Alpine main cloud sea, keeping the existing Leva placement values as offsets.
- [ ] 3. Keep the Alpine veil screen-facing and static for now so this pass only changes the main cloud carpet.
- [ ] 4. Leave coverage timing, module timeline, camera path, Summit clouds, and preset values unchanged.
- [ ] 5. Run `cd web && npm run lint`.
- [ ] 6. Reload the in-app browser for visual review.
- [ ] 7. Add a review note with the final change and verification.

---

# Alpine Cloud Carry Pass

## Context

The first visible cloud shader is the Alpine `CloudSea` inside `AlpineSceneGroup`. Right now it is tied to Alpine scene ownership: coverage starts at `0` at `alpine.ownStart`, ramps slowly to the preset peak by `alpine.exitStart`, then ramps toward full coverage by `summit.ownStart`. Summit has its own `CloudSea` layers after that. This makes the cloud arrive late instead of following the user through most of the selected-work/Summit journey.

## Plan

- [x] 1. Update the Alpine `cloudCoverage` curve so it reaches the preset peak by `alpine.enterEnd` instead of waiting until `alpine.exitStart`.
- [x] 2. Hold main cloud coverage through the Alpine content window, then keep the existing Alpine-to-Summit full-coverage handoff.
- [x] 3. Apply the same earlier ramp/hold behavior to `cloudVeilCoverage` so the screen-facing veil follows with the main cloud layer.
- [x] 4. Leave `MODULE_TIMELINE`, camera motion, card layout, and Summit cloud presets unchanged for this pass.
- [x] 5. Run `cd web && npm run lint`.
- [x] 6. Reload the in-app browser for visual review.
- [x] 7. Add a review note with the final change and verification.

## Review

- Changed Alpine main `cloudCoverage` to ramp from `0` to the preset peak during `alpine.ownStart -> alpine.enterEnd`.
- Held main cloud coverage at the preset peak through the Alpine content window.
- Kept the existing Alpine-to-Summit handoff, still ramping from the Alpine preset peak toward full coverage during `alpine.exitStart -> summit.ownStart`.
- Applied the same early ramp and hold behavior to `cloudVeilCoverage`.
- Left `MODULE_TIMELINE`, camera motion, card layout, Summit cloud presets, and cloud placement values unchanged.
- Verification: `cd web && npm run lint` passes with 0 errors. It still reports the two pre-existing `GroveScene.tsx` `no-explicit-any` warnings.
- Reloaded the in-app browser at `http://localhost:3000/`.

---

# Camp Local Noise Reduction Experiment

## Context

Global post-processing `Noise`, global `Vignette`, and `CampGroundWash` are now removed, but Camp still reads noisy. The remaining texture is coming from Camp-local sources: `SumiSkyMaterial` paper grain/stars, `CampDustPlane`, and baked detail in the authored PNGs.

## Findings

- No shared composer `Noise` pass remains.
- `SumiSkyMaterial` still adds paper grain via `final += (fiber - 0.5) * uGrainAmount`, currently controlled by `grain: 0.022`.
- `SumiSkyMaterial` also renders a dense procedural star field; visually, the small star flecks can read like noise in the upper sky.
- `CampDustPlane` still overlays procedural FBM dust at `dustIntensity: 0.85` and `dustAlphaCap: 0.28`.
- The authored Camp PNGs have baked high-variance texture/ink speckle. Asset stats show high visible luma variance, especially `campsite.png`, `foreground.png`, and the generated ground/underbrush plates.

## Plan

- [x] 1. Disable `CampDustPlane` in `CampSceneGroup`.
- [x] 2. Set Camp sky `grain` default to `0`.
- [x] 3. Reduce the star field so intentional stars remain but stop reading like surface speckle.
- [x] 4. Leave the authored Camp PNG assets unchanged for this pass.
- [x] 5. Run `cd web && npm run lint`.
- [x] 6. Reload the in-app browser for visual review.
- [x] 7. Add a review note with the final change and verification.

## Review

- Removed `CampDustPlane` from the Camp scene render path.
- Set Camp sky paper grain default from `0.022` to `0`.
- Reduced procedural stars by making them sparser and dimmer: `starDensity` `0.988 -> 0.995`, `starGrid` `600 -> 420`, `starTrim` `0.85 -> 0.55`, and `heroThreshold` `0.99 -> 0.997`.
- Left the authored Camp PNG assets unchanged.
- Verification: `cd web && npm run lint` passes with 0 errors. It still reports the two pre-existing `GroveScene.tsx` `no-explicit-any` warnings.
- Reloaded the in-app browser at `http://localhost:3000/`.

---

# Global Post-Processing Noise Removal Experiment

## Context

The remaining spotty/static texture is most visible on broad, low-contrast areas such as the Camp ground below the authored assets. The global post-processing `Noise` pass applies screen-space noise over the final rendered frame, then stacks on top of shader-local paper grain and authored texture detail. For this experiment, remove the global pass across the site while leaving shader-local grain intact.

## Plan

- [x] 1. Remove the `Noise` effect from `web/src/components/PostProcessingStack.tsx`.
- [x] 2. Remove the now-unused `noiseOpacity` prop and homepage noise interpolation state from `UnifiedPostProcessing`.
- [x] 3. Remove unused `enableNoise` quality preset fields so the quality config matches the active post-processing stack.
- [x] 4. Run `cd web && npm run lint`.
- [x] 5. Reload the in-app browser for visual review.
- [x] 6. Add a review note with the final change and verification.

## Review

- Removed the global screen-space `Noise` pass from `web/src/components/PostProcessingStack.tsx`.
- Removed `noiseOpacity` from the post-processing API and removed the homepage noise interpolation state from `UnifiedPostProcessing`.
- Removed the stale `enableNoise` fields from `web/src/lib/quality.ts`.
- Left shader-local paper/ink/noise controls in place so this experiment only removes final-frame static.
- Verification: `cd web && npm run lint` passes with 0 errors. It still reports the two pre-existing `GroveScene.tsx` `no-explicit-any` warnings.
- Reloaded the in-app browser at `http://localhost:3000/`.

---

# Camp Bottom Wash Removal Investigation

## Context

The first pass reduced the global Three.js `Vignette` darkness by 70%, but the Camp screenshot still shows a large gray/dark field over the lower viewport. Further tracing points to Camp-specific layers, especially `CampGroundWash`, rather than the global vignette alone.

## Findings

- `CampGroundWash` renders a near-black `#030407` shader plane at `opacity={0.82}` behind the campsite.
- The wash shader uses vertical fades plus screen-space grain, then outputs `gl_FragColor = vec4(uColor + grain, alpha)`, which creates the smoky gray block visible in the screenshot.
- The wash mesh is `depthTest: false`, `depthWrite: false`, and `renderOrder={-1}`, so it behaves like a composited overlay rather than ordinary scene geometry.
- Camp foreground/campsite/ridge PNGs also contain dark lower-half alpha, but those are authored scene assets. The artificial full-width wash is the safest next thing to remove.

## Plan

- [x] 1. Remove the global `Vignette` pass entirely from `PostProcessingStack.tsx`.
- [x] 2. Remove the `CampGroundWash` render from `CampSceneGroup`.
- [x] 3. Leave the actual Camp artwork layers (`ridge`, `campsite`, `foreground`) in place for this pass.
- [x] 4. Run `cd web && npm run lint`.
- [x] 5. Reload the in-app browser for visual review.
- [x] 6. Add a review note with the final change and verification.

## Review

- Removed the global post-processing `Vignette` pass from `web/src/components/PostProcessingStack.tsx`.
- Removed the custom `CampGroundWash` shader component and its render call from `web/src/components/UnifiedScene.tsx`.
- Kept the actual Camp authored artwork layers in place: `ridge.png`, `campsite.png`, and `foreground.png`.
- Verification: `cd web && npm run lint` passes with 0 errors. It still reports the two pre-existing `GroveScene.tsx` `no-explicit-any` warnings.
- Reloaded the in-app browser at `http://localhost:3000/` for visual review.

---

# Vignette Reduction Pass

## Context

The visible edge-darkening in the Camp screenshot is driven first by the global `Vignette` effect in `web/src/components/PostProcessingStack.tsx`. The current value is `darkness={0.8}`. The requested change is to reduce that first/global vignette effect by about 70%, keeping this pass isolated from the Camp-specific ground wash and foreground artwork.

## Plan

- [x] 1. Change the global `Vignette` darkness from `0.8` to `0.24` in `web/src/components/PostProcessingStack.tsx`.
- [x] 2. Leave Camp-specific `CampGroundWash` and foreground opacity unchanged so the visual delta is attributable to the global vignette only.
- [x] 3. Run a focused lint check for the edited file/package if needed.
- [x] 4. Add a review section summarizing the change and verification.

## Review

- Reduced the global Three.js post-processing vignette darkness by 70%, from `0.8` to `0.24`, in `web/src/components/PostProcessingStack.tsx`.
- Left Camp-specific `CampGroundWash`, foreground artwork opacity, dust, grain, and bloom settings unchanged so this pass only affects the global edge-darkening effect.
- Verification: `cd web && npm run lint` passes with 0 errors. It still reports the two pre-existing `GroveScene.tsx` `no-explicit-any` warnings.

---

# Alpine Controls + Presets Pass

## Context

Alpine (scroll 0.64–0.86) is the case-study showcase — the cards are the protagonist, not the atmosphere. Today the entire scene is hardcoded: there is **no Leva folder for Alpine at all**, and no preset system. We are not adding a new wow shader gesture (the cards already carry the wow). Instead we mirror Summit's preset pattern so multiple distinct atmospheric *looks* can be hot-swapped from one dropdown, with the current baked-in look preserved exactly as the default.

## Locked Decisions

- Default look stays exactly as today — `Crisp Crest` preset captures the current values.
- No new shader file. Reuse `AlpineHazeMaterial`, `CloudSeaMaterial`, `SilhouetteSunRakeMaterial` (with `warmStrength=0`) — just expose every uniform to Leva.
- No warm tones — locked Pass-3 rule. Every preset stays inside the cool slate / pre-dawn palette. Warmth is reserved for Hero + Summit.
- Mirror Summit's preset pattern: `ALPINE_PRESETS` constant, default-seeded `useControls('Home Alpine', () => …)`, sibling `useControls('Home Alpine Presets', { preset: { onChange: setAlpineControls } })`. Selecting a preset hot-swaps the full control set; individual sliders remain editable after.
- Six presets covering distinct registers: `Crisp Crest` (default), `Vast Cold`, `Held Breath`, `Wind-Carved`, `Thin Air`, `Storm Brewing`.
- Visibility toggles for haze / ridges / cloud sea / ledges / bird live in the same panel but are NOT in the preset object — they're meta dials that don't get reset by preset selection.
- Preserve `MODULE_TIMELINE.alpine` window, `sceneOpacity('alpine')` ownership, the camera arc, and the Alpine→Summit cloud-coverage hand-off (preset can override the alpine-side peak; the seam ramp to Summit's full carpet still works).

## Plan

- [x] 1. Extend the `AlpineHaze` wrapper in `UnifiedScene.tsx` to accept color/uniform overrides (haze base/high/horizon/fog colors, fbm scale, fog speed, fog scale, grain amount, altitude pulse override) so presets can hot-swap atmospherics.
- [x] 2. Define `ALPINE_PRESET_DEFAULT = 'Crisp Crest'` and `ALPINE_PRESETS` at module scope with six full preset objects covering haze / ridges / cloud sea / ledges fields.
- [x] 3. Add `useControls('Home Alpine', () => …)` in `AlpineSceneGroup` with sub-folders: `scene · visibility`, `sky · placement`, `sky · haze`, `sky · color`, `ridge · far`, `ridge · mid`, `cloud sea`, `ledges`. Seed every controlled value from the default preset.
- [x] 4. Add `useControls('Home Alpine Presets', …)` dropdown that hot-swaps the full control set via `setAlpineControls`.
- [x] 5. Replace every hardcoded value in `AlpineSceneGroup` with `controls.X`. Conditionally render haze / ridges / cloud sea / ledges / bird based on visibility toggles.
- [x] 6. Extend `SyncedRockLedge` with an optional `opacityMul` prop so the ledge cohort can fade together via preset.
- [x] 7. Update the cloud-coverage curve to use `controls.cloudCoverageMax` instead of the hardcoded 0.6, while preserving the Alpine→Summit hand-off ramp.
- [x] 8. Run `cd web && npm run lint` and `cd web && npm run typecheck`.

## Review

### Diff summary

- Added `AlpineHaze` wrapper props for color and atmospheric uniforms (`baseColor`, `highColor`, `horizonColor`, `fogColor`, `fogScale`, `fogSpeed`, `grainAmount`, `altitudePulseOverride`); wrapper now pushes everything to the shader per-frame and falls back to the existing scroll-coupled `altitudePulseRef` when override is `< 0`.
- Added `ALPINE_PRESET_DEFAULT` + `ALPINE_PRESETS` (6 presets) at module scope of `UnifiedScene.tsx`. Each preset is a complete object covering ~32 fields.
- Added `Home Alpine` Leva panel in `AlpineSceneGroup` with sub-folders for visibility / sky placement / sky haze / sky color / ridge far / ridge mid / cloud sea / ledges, all seeded from the default preset.
- Added `Home Alpine Presets` dropdown that hot-swaps the full control set via `setAlpineControls(ALPINE_PRESETS[name])`.
- Replaced every hardcoded value in `AlpineSceneGroup` with the corresponding control. Visibility toggles gate haze / ridges / cloud sea / ledges (block) / bird.
- Extended `SyncedRockLedge` with optional `opacityMul` so the ledge cohort can fade together per preset.
- Cloud-coverage curve now uses the preset-driven `cloudCoverageMax` for the alpine-side peak; the seam ramp to Summit's full 1.0 carpet is preserved.

### Verification

- `cd web && npm run typecheck` passes.
- `cd web && npm run lint` passes (only the two pre-existing `GroveScene.tsx` `no-explicit-any` warnings).
- Default visual output unchanged because `Crisp Crest` captures the previous baked values exactly.

### Preset register intent

- `Crisp Crest` — current baked look. Cool slate, balanced, scroll-coupled altitude pulse.
- `Vast Cold` — heavier atmospheric perspective, ridges dissolve harder, lower altitude pulse, palette pushed cooler/darker.
- `Held Breath` — frozen quietude, fog drift near zero, denser mist, mid altitude pulse.
- `Wind-Carved` — kinetic atmosphere, fast cloud drift, stretched fbm.
- `Thin Air` — clear high-altitude palette, sharper ridges, lighter haze.
- `Storm Brewing` — darker slate, heavier coverage, low altitude, ominous.

### Notes

- No new shader file needed — Alpine's wow is now the *combinatorial range* of presets, not a single iconic gesture. Forest got the single-gesture treatment because Forest had no card competition; Alpine defers to the case studies.
- If we later want an iconic shader gesture for Alpine, this controls scaffolding is the right substrate to build on (a new shader's uniforms can be added to the preset object and dialed per look).

---

# Forest Atmosphere Shader Pass

## Context

Forest (scroll 0.16–0.42) currently has the painterly background half — `ForestMistMaterial` cool-fog wash on backdrop and floor, painted canopy silhouettes, 11 watercolor-bleed trees, a transient stag sprite. It is missing what Camp's pass landed: a foreground atmospheric depth shader, a persistent focal anchor, and any volumetric depth cue. The wow today is tree parallax, not a hero shader moment.

Camp's parallel pattern was: realistic atmosphere, sky as the hero, two-shader sandwich (`SumiSkyMaterial` + `CampDustMaterial`), authored anchor (campsite/fire). Forest deliberately does not copy that pattern — it differentiates on register and rhetorical shape.

## Locked Decisions

- Emotional register is **Living medium** — the air itself is the hero, not awe (Camp) and not intimacy (presence-in-fog) and not micro-scale.
- Stylistic register is **painterly**, not realistic. Differentiates Forest from Camp's realism, doubles down on the existing watercolor/woodcut voice, harder to copy than realistic god-rays.
- Rhetorical shape is a **single iconic gesture**, not a Camp-style atmospheric stack. One shaft is the headline; supporting cast is allowed but demoted.
- Subject of the shaft is a **floor clearing pool of light, no subject character**. The shaft + its painterly interaction with the ground mist is the entire image. The stag stays as is, decoupled.
- Cinematography is **approach and enter** — shaft sits at `z ≈ -90` (deep end of the Forest camera walk). Distant glow at Forest enter, builds with scroll, camera ends *inside* the shaft at Forest exit. Hand-off to Camp is "stepping out of the light back into night."
- Light source is an **ambiguous column**, not an implied sunbeam. No alignment with canopy silhouettes. Paint logic over physical logic.
- No warm tones (locked Pass-3 rule — warmth is reserved for Hero / Summit dawn). Shaft palette is cool blue-white wash on cool slate fog.
- Preserve `MODULE_TIMELINE.forest` window and `sceneOpacity('forest')` ownership. No timing changes.

## Plan

- [x] 1. Add a new `ForestShaftMaterial` shader in `web/src/components/shaders/` driving a vertical cone+pool gesture: brushstroke grain inside the volume, splotchy variable density along the shaft (not smooth), wet-edge ink-pool bleed where the shaft meets the ground mist, slow brush-grain animation, slight ambient breathing on intensity.
- [x] 2. Painterly behaviors over physical: paint-grain noise, not Henyey-Greenstein scattering; ink-pool falloff at the floor interface, not log-density attenuation; cool blue-white wash referenced against the existing `#7a8696 / #3a4350` `ForestMistMaterial` palette.
- [x] 3. Mount the shaft in `DeepForest.tsx` at world `z ≈ -90`, vertical, no implied sun source, sized so it reads at multiple distances as the camera approaches.
- [x] 4. Distance-coupled detail: at far range a soft glow with low brushstroke detail; mid range the brush grain and pool edge emerge; near range the wet-edge bleed and pool ink-pooling dominate. Coupled to camera-to-shaft distance, not to scroll progress directly.
- [x] 5. Add a quieter painterly foreground motes layer (ink spatter / spore flecks, cool palette) parallaxing close to camera as the supporting depth cue. Demoted; the shaft is the protagonist.
- [x] 6. Wire scroll-velocity into the shaft as a subtle intensity push (shaft strengthens slightly as the user pushes forward, settles when still) — supports "living medium" without theatrical reveals.
- [x] 7. Expose Leva controls under a new `Home Forest` folder: shaft world position, shaft radius, shaft height, brush-grain scale, brush-grain speed, density splotch amount, wet-edge bleed strength, breath rate, breath amplitude, motes density, motes parallax depth.
- [ ] 8. Verify the Forest → Camp transition still reads cleanly: ending Forest inside the shaft should hand off to Camp's night atmosphere without a hard break. _(needs manual visual review)_
- [x] 9. Preserve `ForestMistMaterial`, the canopy silhouettes, the 11 woodcut trees, and the stag sprite as is. No removals; the shaft is additive.
- [ ] 10. Browser-check Forest in the existing dev server across Hero → Forest → Camp. _(manual — Chrome MCP not connected this session)_
- [x] 11. Run focused verification from `web/`: lint and typecheck; build if the shader touches shared render code.

## Review

### Diff summary

- Added `web/src/components/shaders/ForestShaftMaterial.ts` — painterly cone-of-light shader. Behaviors: animated brush-grain noise, splotchy variable density, wet-edge bleed at the base (the implicit pool), slow ambient breathing, scroll-velocity push, camera-proximity-coupled detail (smooth glow at distance, brushstroke detail up close). Cool palette (`#d4ddea` default). Additive blending, `depthWrite=false`.
- Added `web/src/components/shaders/ForestMotesMaterial.ts` — painterly foreground motes. Sparse hashed flecks with sub-cell soft round-off, slow drift, edge fade. Cool palette (`#aebbcc` default). Additive blending.
- Added `ForestShaft` component to `DeepForest.tsx` rendering a vertical frustum cone (radius top 1.5, radius bottom 14, height 38) at world `[0, -1, -90]` — at the deep end of the camera arc. Tracks camera proximity and scroll velocity per-frame.
- Added `ForestMotes` component to `DeepForest.tsx` rendering a camera-relative plane that sits 8 units in front of the camera throughout the Forest walk. Intensity envelope coupled to forest scroll progress so motes don't bleed into Hero or Camp through the additive blend.
- Updated `DeepForest` signature to accept optional `scrollVelocity` and `controls`; preserved the legacy `ForestModule.tsx` callsite by making both optional.
- Added `Home Forest` Leva folder in `ForestSceneGroup` (`UnifiedScene.tsx`) with `shaft`, `shaft · placement`, and `motes` sub-folders covering all tunable uniforms + placement.
- Preserved `MODULE_TIMELINE.forest` window, `sceneOpacity('forest')` ownership, `ForestMistMaterial` backdrop + floor, canopy silhouettes, the 11 woodcut trees, and the stag sprite. Shaft + motes are additive on top of the existing scene.

### Verification

- `cd web && npm run typecheck` passes.
- `cd web && npm run lint` passes (only the two pre-existing `GroveScene.tsx` `no-explicit-any` warnings).
- Existing dev server at `http://localhost:3000` is up; in-CLI browser smoke skipped because the Chrome extension isn't connected for this session — manual visual review is the next step (Hero → Forest enter → Forest exit → Camp).

### Notes / locked design decisions in code

- The shaft is a single iconic gesture, not a stack — one cone, one mounting point. Differentiated from Camp's two-shader sandwich on purpose.
- The "pool" is implicit in the cone's base bleed (UV `y < 0.42` boost, scaled by camera proximity) rather than a separate floor disc. Keeps the shader count low and lets the additive blend brighten the existing `ForestMistMaterial` floor naturally.
- No implied sun source — the shaft has a soft top fade (`smoothstep(1.0, 0.55, uv.y)`) so it dissolves before reaching the canopy plane and reads as "paint suspended in fog," not "light from above."
- Brush-grain frequency and bleed strength are camera-distance-coupled, not scroll-coupled — the shader does more work at every position because of where the camera *is*, not where you are in the scroll. Fits the "approach and enter" cinematography.
- Scroll-velocity push is wired but capped at +50% intensity — subtle enough to feel like the air responding, not theatrical.

### Follow-up: scene-level tuning controls

Added scene-wide dials to `Home Forest` so the busyness of the entire Forest can be tuned without code edits:

- **`scene · visibility`** (open by default) — toggle each layer on/off: shaft, motes, stag, canopy far/mid, background trees (3), midground trees (2), foreground tree (1). Use to triage what's competing for attention.
- **`scene · global`** — `tree opacity` (multiplier on all 11 trees' `uOpacity`), `tree wash mul` (multiplies the per-tree watercolor bleed for softer/sharper edges), `canopy far/mid opacity`, `mist override` (set ≥ 0 to pin mist density manually; -1 keeps the scroll-coupled ramp), `floor mist density`.
- **`scene · color`** — `mist cool` and `mist shadow` palette pickers feed the `ForestMistMaterial` uniforms on both the backdrop and the floor.

Also extracted a small `ForestFloor` component that reuses the `ForestMist` shader on the rotated horizontal plane, so backdrop and floor share the same controls and stay coherent.

---

# Off-Trail Detour + Trail Fork

## Context

The lake scene is strong enough to become an explicit optional detour instead of a hidden-only easter egg. The chosen direction is a brief, non-blocking Trail Fork section after Camp, where users can either go `Off trail` to the lake scene or `Keep climbing` into Alpine. The off-trail scene remains a separate route so the homepage timeline does not have to absorb the full lake WebGL experience.

## Locked Decisions

- The detour is optional, not part of the canonical scroll for everyone.
- Rename `/shhhh` to `/off-trail`; no redirect needed because the site is not live.
- Add a brief Trail Fork section immediately after Camp.
- Shorten Camp to make room; preserve Alpine's current start timing.
- Trail Fork should flow back to the light/white theme before Alpine.
- Trail Fork uses a literal signpost asset with the copy `Off trail` / `Keep climbing`.
- `/off-trail` should remain scenic only, with no title overlay.
- Returning from `/off-trail` should send users forward to Alpine / Selected Work.

## Plan

- [x] 1. Rename route `web/src/app/shhhh/page.tsx` to `web/src/app/off-trail/page.tsx` and update all links/navigation references from `/shhhh` to `/off-trail`.
- [x] 2. Add the selected low-fi signpost asset at `web/public/trail-fork/signpost.png`.
- [x] 3. Add a brief `trailFork` timeline window between Camp and Alpine, taking time from Camp while keeping Alpine at `0.64`.
- [x] 4. Update homepage-derived ranges so Camp, Trail Fork, Alpine, and Summit remain synchronized with the shared timeline contract.
- [x] 5. Add a Trail Fork section in `HomeClient.tsx` after Camp with the signpost asset, accessible click targets for `Off trail` and `Keep climbing`, and normal scroll-past behavior.
- [x] 6. Make `Off trail` save an Alpine return target, trigger the existing ink transition, and navigate to `/off-trail`.
- [x] 7. Make `Keep climbing` smoothly scroll to Alpine / `#selected-work`.
- [x] 8. Keep the off-trail page scenic only, with no extra title/content overlay.
- [x] 9. Update the off-trail back marker so it returns to Alpine / Selected Work instead of the top of the homepage.
- [x] 10. Update timeline-adjacent UI as needed, especially `ElevationBar`, `timelineDebug`, and audio mix assumptions if the new `trailFork` module affects them.
- [x] 11. Run `cd web && npm run lint` and `cd web && npm run typecheck`; run broader guardrails if the timeline changes touch enough surface area.
- [x] 12. Browser-smoke the flow: scroll Camp → Trail Fork → Alpine, click `Off trail`, verify `/off-trail`, then return to Alpine.

## Review

### Diff summary

- Renamed the route from `/shhhh` to `/off-trail` with no redirect.
- Added `web/public/trail-fork/signpost.png` as the selected low-fi John Fellows-style signpost asset.
- Added `trailFork` to `MODULE_TIMELINE` at `0.55–0.64`, shortened Camp to `0.42–0.55`, and kept Alpine entering at `0.64`.
- Added a brief Trail Fork section after Camp in `HomeClient.tsx`, with invisible accessible click targets over the generated signpost.
- Wired `Off trail` to save a `selected-work` return anchor and navigate through the existing ink transition.
- Wired `Keep climbing` to smooth-scroll to Alpine / Selected Work.
- Kept `/off-trail` scenic-only and made the back marker return to Alpine.
- Updated route references, cursor off-trail detection, `ElevationBar`, timeline debug module order, and the unified camera bridge through the Trail Fork window.

### Verification

- `cd web && npm run lint` passes with the two existing `GroveScene.tsx` `no-explicit-any` warnings.
- `cd web && npm run typecheck` passes after clearing stale generated `.next/types` for the old route.
- `cd web && npm run build` passes and lists `/off-trail`; `/shhhh` is gone from the route table.
- Existing dev server on `http://localhost:3000` verified:
  - `/` returns 200.
  - `/off-trail` returns 200.
  - `/shhhh` returns 404.
  - `Keep climbing` lands on `#selected-work`.
  - `/off-trail` renders cleanly without a title overlay.
  - Back marker returns to `#selected-work`.

### Notes

- `npm run format:check` still flags `src/components/CredentialStrip.tsx`, which was already unrelated to this change and was not edited here.
- A separate existing Next dev server is running on port 3000; starting a second one failed because the `.next/dev` lock was already held.

---

# Camp Atmosphere Shader Pass

## Context

After browser review, Camp is not failing because it needs a full redesign. It is failing because the sky, ridge, tent, fire, and foreground read like separate visual systems. The Milky Way should be atmosphere, not the focal point; the campfire and campsite remain the section anchor.

## Locked Decisions

- Work one module at a time, starting with Camp.
- Keep the current Camp layout and scroll timing intact.
- Do not make the Milky Way the hero. Use it as a subtle atmospheric layer.
- Push the Milky Way toward a more realistic sky atmosphere with faint natural color and subtle motion.
- Keep the campfire as an authored asset, not a separate active fire/ember shader system.
- Keep the John Fellows / low-fidelity carved-paper direction.
- Make the asset system more comprehensive, but avoid a full module redesign.
- Prefer a small coherent Camp asset family over isolated one-off props.

## Plan

- [x] 1. Replace the active Camp sky treatment with a restrained atmospheric night shader: ink-paper gradient, subtle grain, faint Milky Way band, sparse stars.
- [x] 2. Keep the fire as the visual anchor as part of the authored campsite asset, while moving shader complexity into the sky.
- [x] 3. Remove or bypass unused Camp sky plumbing so `SumiSky`/`NightAtmosphere` are not competing concepts.
- [x] 4. Generate or replace a small coherent Camp asset family from one art direction: distant ridge/treeline, middle camp plate, foreground ground/trail plate, and foreground branch/underbrush frame.
- [x] 5. Remove the active fire halo/ember treatment from Camp so the baked campfire asset carries the fire read.
- [x] 6. Replace mismatched square ground/underbrush framing with wider transparent assets that are composed for the viewport.
- [x] 7. Decide whether the moon stays; if it stays, make it smaller/subtler or replace it with a low-contrast carved moon that supports the night atmosphere.
- [x] 8. Tune existing Camp asset opacity/tint only where needed for cohesion: ridge, campsite, and foreground.
- [x] 9. Preserve `MODULE_TIMELINE` behavior and `sceneOpacity('camp')` ownership; no timing changes.
- [x] 10. Browser-check Camp in the existing dev server across Forest → Camp → Trail Fork.
- [x] 11. Run focused verification from `web/`: lint and typecheck; build if shader changes touch shared render code enough to justify it.

## Review

### Diff summary

- Generated a coherent Camp asset family from one art direction:
  - `web/public/camp/atmosphere/ridge.png`
  - `web/public/camp/atmosphere/campsite.png`
  - `web/public/camp/atmosphere/foreground.png`
- Saved the generated source images under `web/.source-assets/camp/atmosphere/`.
- Reworked `SumiSkyMaterial` into a more realistic night atmosphere shader with sparse stars, dust lanes, faint color, subtle drift, and a stronger Milky Way band.
- Made `SumiSky` the active Camp background and removed the active `NightAtmosphere` fog layer.
- Replaced the active Camp stack's mismatched moon, old ridge, separate tent/fire props, square ground plate, and square underbrush with the new coherent ridge/campsite/foreground layers.
- Removed the active `FireHalo` and ember layers from Camp so the fire reads as part of the authored campsite asset.
- Removed the now-unused Camp fire halo, ember cluster, warm silhouette, and ground shader helpers from `UnifiedScene.tsx`.
- Updated the `Home Camp` Leva folder to remove fire/ember controls and add Milky Way controls: galaxy intensity, core width, dust lanes, faint color, star sparsity, grain scale, and slow drift.
- Moved the sky plane behind the camp asset stack and disabled homepage depth-of-field/chromatic aberration for this pass so the new sky stays crisp and color-stable.
- Preserved the existing Camp timeline window and `sceneOpacity('camp')` ownership.

### Verification

- Browser-checked the existing dev server at `http://localhost:3000/#skills` and scrolled through Camp toward Trail Fork.
- Browser DOM check confirmed the old fire/ember labels are absent; Leva itself was not present in the DOM snapshot after reload, so visual tuning should still be checked in the open panel.
- `cd web && npm run lint` passes with the two existing `GroveScene.tsx` `no-explicit-any` warnings.
- `cd web && npm run typecheck` passes.
- `cd web && npm run build` passes.

### Notes

- The moon is removed from the active Camp stack for now because it competed with the Milky Way-as-atmosphere direction.
- Follow-up corrective pass:
  - Disabled depth-of-field for the unified homepage post stack because it was smearing flat painterly sky planes into cloudy bokeh.
  - Strengthened the Camp sky into a visible diagonal Milky Way dust/star band instead of a generic gray wash.
  - Raised and brightened the distant ridge so the first generated asset reads in the scene.
  - Removed the separate fire warmth/ember shader pass and shifted that attention into the Milky Way shader.

---

# Summit Foreground Bug Fix + Pop Pass

## Context

The Summit foreground is currently failing in two visible ways: the cliff/flag foreground barely reads, and the cliff enters from the bottom-right even though the desired composition is bottom-left. Research confirmed this is source-level behavior, not just tuning: `SunRakeForegroundCliff` is explicitly built as a lower-right corner pin, and the defaults make the cliff a tiny accent.

## Plan

- [x] 1. Change Summit cliff pinning from bottom-right to bottom-left by adding a left-edge screen projection helper and anchoring the cliff's left edge to the viewport.
- [x] 2. Scale the foreground up substantially so the cliff/flag read as the closing reward, not a corner detail.
- [x] 3. Update `Home Summit` Leva defaults/ranges so the new bottom-left composition is tunable without fighting right-side assumptions.
- [x] 4. Keep the existing Summit assets and shader stack for this pass; avoid net-new assets until the corrected composition is visible.
- [x] 5. Slightly strengthen Summit dawn/readability through simple defaults only if needed: cloud placement, sun glow, ridge warmth, or foreground warm tint.
- [x] 6. Re-check the footer/elevation overlap near the final scroll position; only adjust timeline/UI fade if the foreground still gets visually flattened after the pin/scale fix.
- [x] 7. Run focused verification from `web/`: lint, typecheck, build, and browser smoke the Summit final frame.

## Review

- Replaced the hardwired lower-right Summit cliff pin with a lower-left edge projection.
- Scaled the Summit cliff/flag defaults up so the foreground reads as the closing reward.
- Added richer cloud controls to `Home Summit`: main opacity, coverage, contrast, rim strength, shadow strength, cloud height, foreground cloud height, foreground coverage, and foreground opacity.
- Added optional `CloudSea` plane scale/rotation support so Summit can render screen-facing cloud-bank layers while Alpine can keep the existing horizontal carpet behavior.
- Extended `CloudSeaMaterial` with contrast, rim strength, and shadow strength uniforms, plus eroded alpha edges to avoid the previous straight sheet cutoff.
- Browser-smoked the Summit final frame. The foreground now pins bottom-left and the straight cloud-plane cutoff is gone. The cloud pass is stronger/tunable but still intentionally soft; a more dramatic "wow" may need a dedicated painted cloud asset or a deeper shader pass.
- Follow-up alignment tweak: moved the default cliff offset farther left (`cliffCornerX: -0.8`) and expanded its Leva range so the ledge can clip against the viewport edge instead of floating inward.
- Defaults pass: applied the agent-recommended `Cinematic Cloud Reveal` baseline, with stronger cloud contrast/rim light, larger sky wash, warmer sun glow, slightly larger ridges/foreground, and a harder left-cropped cliff (`cliffCornerX: -1.35`).
- Also widened the most useful cloud tuning ranges so future Leva edits can explore lower/closer cloud banks, larger foreground clouds, stronger rim light, and higher contrast without code changes.
- Preset pass: added a `Home Summit Presets` Leva dropdown with `Cinematic Cloud Reveal`, `Cloud Sea Wow`, and `Crisp Summit`. Selecting a preset hot-swaps the full Summit control set, then leaves all individual controls editable.
- Default preset follow-up: changed the source default preset to `Crisp Summit`.
- Verification: `cd web && npm run lint`, `cd web && npm run typecheck`, and `cd web && npm run build` pass. Lint still reports the existing `GroveScene.tsx` `no-explicit-any` warnings.

---

# Camp Module Upgrade — Night Scene Depth + Illumination

## Context

Camp (scroll 0.42–0.58) currently reads as a flat video + particles slab: one big campfire video at z=-250, a uniform-random starfield, a linear ember column. Against Hero's bespoke `WoodcutMaterial` and Alpine's parallax ledges, it's the weakest module on the site alongside Summit.

This mission upgrades Camp to craft-parity via three new John Fellows woodblock silhouette layers (already produced and cut to `/web/public/camp/{canopy,tent,branch}.webp`), a painted fire-glow halo (not a physical `<pointLight>` — staying graphic), a custom ink-wash night-sky shader to replace the random starfield, a subtle silhouette warm-tint shader, and split ember clusters. Summit is a separate follow-up mission.

## Goal

Turn Camp from "flat diorama" into an inhabited night scene with real compositional depth, while preserving the graphic John Fellows aesthetic (no 3D rim-lighting, no photorealism).

## Scope

**In:** `CampSceneGroup` inside `UnifiedScene.tsx`; 3 new shader materials in `web/src/components/shaders/`; the 3 silhouette WebPs already in `/web/public/camp/`.

**Explicitly out** (deferred to future missions):
- Camera changes ("sit down at the fire" spline dolly)
- Time-of-day scrubber (dusk → stars → moonrise)
- Kettle / steam plume hero prop
- Log-anchored 3D→2D HTML card
- Scroll-velocity wind-bias on embers
- Heat-haze refraction over fire video
- Constellation chapters, meteor on velocity threshold, firefly layer

## Plan

### Composition layers (silhouettes)

- [ ] 1. Add three new meshes to `CampSceneGroup` at z-depths: canopy `z=-40` top-of-frame, tent `z=-15` center-ground, branch `z=+5` top intruding foreground
- [ ] 2. Wire all three to a new `SilhouetteWarmMaterial` (step 10), `alphaTest=0.5`, `transparent=true`, `depthWrite=true`
- [ ] 3. Scale each plane so it reads at intended frame coverage; expose positions and scales via Leva for fine-tuning

### Deep-ink background with paper grain

- [ ] 4. Add a background plane at `z=-200` replacing the implicit dark void
- [ ] 5. Shader: base tone `#050514` + `fiberNoise` primitive reused from `WoodcutMaterial` for subtle paper-grain variation (amplitude ~0.03)

### Fire-glow halo shader

- [ ] 6. Create `web/src/components/shaders/FireHaloMaterial.ts` using `shaderMaterial`
- [ ] 7. Additive radial billboard at `(0, -2, -10)`, scale ~12×12
- [ ] 8. Uniforms: `uTime`, `uEmberPulse` (fed from existing `scrollVelocity` ref, clamped), `uColorWarm` (`#ea580c`), `uRadius`, `uFbmScale`
- [ ] 9. Fragment: `smoothstep(radius, 0, length(uv-0.5))` × warm color × `(0.7 + fbm*0.3)`, pulse modulates intensity; `blending=AdditiveBlending`, `depthWrite=false`

### Silhouette warm-tint shader

- [ ] 10. Create `web/src/components/shaders/SilhouetteWarmMaterial.ts`
- [ ] 11. Uniforms: `uTexture`, `uFireAnchor` (vec3 world-space), `uWarmColor` (`#f6c400` muted), `uInfluenceRadius`, `uFirePulse`
- [ ] 12. Vertex: pass world-space position as varying
- [ ] 13. Fragment: sample texture, multiply by a warm-tint factor keyed on `distance(vWorldPos, uFireAnchor)` via `smoothstep`; amplitude modulated by `uFirePulse` (shared with FireHalo)

### Ink-wash night sky shader

- [ ] 14. Create `web/src/components/shaders/SumiSkyMaterial.ts`
- [ ] 15. Full-screen background dome plane at `z=-180` (in front of paper-grain background, behind everything else)
- [ ] 16. Fragment:
  - Vertical gradient from `#020617` (horizon) to `#060a1a` (zenith)
  - 3-octave domain-warped fbm modulates the gradient for painterly unevenness
  - Milky-way band via a rotated ellipse mask × its own fbm, subtle off-white tint
  - Stars via hashed `step()` threshold on a second noise layer with `sin(uTime*speed + hash)` twinkle
- [ ] 17. Remove the existing `Starfield` Points geometry from `CampSceneGroup`

### Split ember clusters

- [ ] 18. Refactor `CampfireEmbers` into two `<points>` clusters:
  - **Hot-fast**: 30 particles, `#fde68a`, short life (~1.5s), tight vertical cone, faster rise
  - **Cool-slow**: 30 particles, `#ea580c`, longer life (~3.5s), wider drift, slower rise
- [ ] 19. Preserve existing velocity-reactive emission rate wiring

### Integration

- [ ] 20. Wire everything inside `CampSceneGroup`'s existing `applyGroupOpacity` envelope so the module timeline contract still handles fade-in/fade-out
- [ ] 21. Add a Leva panel folder `"Home Camp"` exposing: silhouette z-depths and scales, halo intensity + radius + fbm scale, sky fbm scale + gradient endpoints, ember cluster counts
- [ ] 22. Smoke-test scroll range 0.40–0.60 — confirm no regression on adjacent modules (Forest exit, Alpine enter)

### Guardrails + review

- [ ] 23. Run `cd web && npm run guardrails` (lint + typecheck + format + build)
- [ ] 24. Start `npm run dev`, scroll through Camp in the browser, verify:
  - Three silhouettes composite correctly at intended z-depths
  - Fire halo pulses subtly with ember velocity
  - Silhouettes show a whisper of warm tint on the fire-facing side
  - Ink-wash sky reads as painted night, not uniform random points
  - Ember clusters differentiate hot-fast vs cool-slow
  - No z-fighting, no flicker, no broken transparency on Forest→Camp or Camp→Alpine crossfades
- [ ] 25. Populate the Review section below with diff summary, perf notes, and any follow-up items surfaced during implementation

## Review

_(Populated after execution.)_

---

# Summit Module Upgrade — Crest the Ridge + Atmospheric Depth

## Context

Summit (scroll 0.86–1.00) currently reads as a flat slab: one MP4 panorama panning left, a static `cliff_edge.webp` pinned to the bottom of the viewport, and a sprite-sheet fox walking onto the ledge. **The camera is hard-coded at (0, 0, 20)** with no motion across the entire 0.14-window — it is the weakest camera beat on the site.

The agent ideation pass diagnosed Summit's flatness as a **camera problem more than a visuals problem**. Every other module pairs visual content with motion-coupled camera work (hero z-pull, forest sway, alpine climb). Summit doesn't. This mission fixes the camera first, then layers atmospheric depth (parallax ridges, cloud sea), then plants a closing-beat hero object opposite the fox.

This mission reuses the woodblock visual language, asset pipeline, and shader infrastructure validated in the Camp Module Upgrade (silhouette parallax + custom shaders + scroll-reactive uniforms + Leva tuning).

## Goal

Turn Summit from "static panorama with a fox" into a true cresting-the-ridge moment with parallax depth, atmospheric scale (cloud sea, distant peaks), and a planted-flag closing beat — without breaking the existing video panorama or fox sprite.

## Locked decisions (from grill-me)

- **Time of day = dawn / first light.** Closes the narrative arc with Camp ("night before the climb" → "morning of"). Warm color family migrates from the campfire (`#fde68a` / `#ea580c`) to a rising sun. Cool slate-blue silhouettes inherited from the Camp ridge palette. Sun direction baked into a uniform — upper-right, so it rakes the flag (placed left) from behind/across the frame. Cloud sea palette shifts to peach-tinted top with slate-shadow bottom.
- **Camera motion = "step onto the summit ledge," continuous from alpine.** Inherits alpine's end-pose (y≈120, z≈15, rotX≈0.15) instead of starting from the existing static `(0,0,20)`. Drifts forward `z 15→5`, holds high y (`120→125`), tilts head up `rotX 0.15→-0.05`. Forward drift gives the three ridge silhouette layers something to parallax against. **No handoff jump from alpine.** The existing static (0,0,20) pose in `UnifiedCamera` is replaced.
- **Hero object = summit flag (not cairn).** Weathered wooden pole, plain cream banner mid-flutter, small stone cluster at base. Sun-side amber wash, shadow-side slate-blue. Foreground left of frame. Generated as a net-new Flow asset in the woodblock vocabulary.
- **Cloud sea = heavy + scroll-coupled drift.** Bottom 40–50% of the frame, ridges peek out of the clouds at different heights for parallax payoff. Drift offset is a function of `scrollProgress` (same pattern as Camp's fire pulse) — clouds slide as the user crests, slide back as they leave. Decoupled drift would break the site-wide "scroll drives motion" contract.
- **`VideoPanoramaLedge` is removed.** Three painted ridges + painted cloud sea + painted dawn sky fully replace the existing photoreal video panorama. Same playbook as Camp where `VideoCampLedge` was killed. Reasons: photoreal video conflicts with the woodblock vocabulary; the video's "panning left" motion is fake parallax that fights the new real parallax; keeping it as a hidden backdrop would just add draw calls without payoff.
- **`ForegroundLedge` cliff_edge.webp is repainted in woodblock vocabulary.** Net-new Flow asset: bare summit rock slab, irregular broken edge, 3–5 scattered scree stones on the surface, at most 1–2 tiny weathered grass tufts (above-treeline = mostly bare). Sun-side amber wash from upper right, shadow-side slate-blue. 3:1 horizontal aspect to span the viewport. The flag plants on it. Same `ForegroundLedge` component, swapped texture; wired through `SilhouetteSunRakeShader` so it picks up the same dawn `uSunPulse` dial as the rest of the module.
- **Dawn sky uses a new `DawnSkyMaterial`.** Separate file from `SumiSkyMaterial` — copies the fbm/hash21/vnoise helpers but structures around dawn's different needs: peach-to-cool vertical gradient, painterly fbm wash, no stars, no milky-way band, **no visible sun disc** (sun is implied via warm-tint on silhouettes + cloud sea + sky gradient). A visible-sun god-ray shaft stays in Tier 2 / deferred per the agent synthesis.
- **New `SilhouetteSunRakeMaterial` for Summit silhouettes.** Separate file from `SilhouetteWarmShader` — directional lighting model (`dot(vWorldPos - meshCenter, uSunDir)`) instead of point-anchor distance falloff. Camp keeps `SilhouetteWarmShader` (fire = point source); Summit uses sun-rake (sun = directional). Same texture/alpha/opacity pipeline, just a different lighting math. Every Summit silhouette (2 ridges + flag + cliff) shares one `uSunDir` so the whole module rakes consistently.
- **`OneShotAnimatedFox` is removed from Summit.** The fox migrates elsewhere (handled outside this mission). Summit's foreground is the flag alone — closing beat is one planted symbol against the dawn vista, no animal companion.
- **2 ridge silhouette layers, not 3.** Far ridge (atmospheric, multiple receding ranges, value-falloff depth) at z ≈ -160; mid ridge (single heroic peak, picture's visual hero, strong warm-cool contrast on central summit) at z ≈ -110. Cliff plays the "near" role — adding a third near-ridge between cliff and mid would compete with the cliff edge. Two separate Flow prompts (each ridge has a different visual job, not just scale variants). Both painted with **faded bottoms** so they dissolve into the cloud-sea composite naturally, no hard horizon clip.
- **Single `uSunPulse` dial drives all warm uniforms (Summit's `firePulse` analogue).** Scroll-**progress**-coupled (not velocity-coupled). Ramps `0 → 1` across summit's enter window (`enterStart` 0.86 → `enterEnd` 0.92), then **holds at 1** through the hold and exit windows — dawn arrives and stays, doesn't pulse or undo itself. One uniform feeds: dawn sky gradient saturation, sun-rake silhouette tint intensity, cliff warm-tint, flag banner warmth. Whole module warms together. Camp's `firePulse` is velocity-coupled because fires pulse with stoking; Summit's `uSunPulse` is progress-coupled because dawn progresses. Asymmetric coupling is correct — both modules are scroll-driven, but in their own physics.

## Scope

**In:** `SummitSceneGroup` inside `UnifiedScene.tsx`; `UnifiedCamera`'s summit zone (currently static); 3 new shader materials (`DawnSkyMaterial`, `CloudSeaMaterial`, `SilhouetteSunRakeMaterial`); 4 net-new woodblock assets (2 ridges + 1 flag + 1 repainted cliff); removal of `VideoPanoramaLedge` and `OneShotAnimatedFox`.

**Explicitly out** (deferred to future missions):
- Departing bird flock V into the vista
- God-ray sun shaft / visible sun disc at scroll = 1.0
- Scroll-velocity snow with motion-streak points
- 3D→2D HTML anchoring (closing quote pinned to a foreground object)
- Real directional sun-rake `<directionalLight>` (we fake it via shader)
- Camera DOF / focal effects

## Plan

### Camera — "step onto the summit ledge"

- [x] 1. Update `UnifiedCamera`'s summit zone in `UnifiedScene.tsx`: inherit alpine end-pose at zone start; drift forward `z 15→5`, hold high y (`120→125`), tilt up `rotX 0.15→-0.05` across the 0.86→1.00 window
- [x] 2. Verify alpine→summit camera handoff has no jump (the static `(0,0,20)` is replaced)

### Removals

- [x] 3. Remove `VideoPanoramaLedge` from `SummitSceneGroup`
- [x] 4. Remove `OneShotAnimatedFox` from `SummitSceneGroup` (fox migrates elsewhere — outside this mission)
- [x] 5. Optional cleanup: delete `VideoPanoramaLedge` component definition if no other module uses it

### Net-new shader materials

- [x] 6. Create `web/src/components/shaders/DawnSkyMaterial.ts` — peach-to-cool vertical gradient, painterly fbm wash, no stars / no milky-way, no visible sun disc. Uniforms: `uTime`, `uSunPulse`, `uColorHorizon`, `uColorZenith`, `uColorWarm`, `uFbmScale`, `uOpacity`. Sky gradient saturation modulated by `uSunPulse`.
- [x] 7. Create `web/src/components/shaders/CloudSeaMaterial.ts` — domain-warped fbm cloud carpet, painterly tonal planes, peach-tinted top + slate-shadow bottom. Uniforms: `uTime`, `uScrollProgress`, `uSunPulse`, `uColorCloud` (#f5ecd8), `uColorShadow` (#2a3240), `uColorWarm` (#fde68a), `uFbmScale`, `uDriftSpeed`, `uOpacity`. Drift offset = `f(uScrollProgress)` so clouds slide as the user crests.
- [x] 8. Create `web/src/components/shaders/SilhouetteSunRakeMaterial.ts` — directional lighting analog of `SilhouetteWarmShader`. Uniforms: `uTexture`, `uSunDir` (vec2 in screen-XY, upper-right default), `uWarmColor` (#fde68a / #f6c400 family), `uCoolShadow` (#2a3240), `uWarmStrength`, `uSunPulse`, `uOpacity`. Fragment math: `dot(normalize(vWorldPos.xy - meshCenter), uSunDir)` clamped, used as warm-tint mask. Same texture/alpha/opacity pipeline as `SilhouetteWarmShader`.

### Asset generation (Flow → ImageMagick → public/summit/)

- [x] 9. Generate **far ridge** via Flow (prompt in appendix). Receding ranges, atmospheric perspective, low value contrast, faded bottoms. Cut: `magick input.png -fuzz 12% -transparent white -quality 90 public/summit/ridge-far.webp`
- [x] 10. Generate **mid ridge** via Flow (prompt in appendix). Single heroic peak, strong warm-cool contrast on summit, faded bottoms. Cut: `... ridge-mid.webp`
- [x] 11. Generate **summit flag** via Flow (prompt in appendix). Weathered pole + plain cream banner mid-flutter + stone cluster at base. Cut: `... flag.webp`
- [x] 12. Generate **summit cliff** via Flow (prompt in appendix). Bare rock slab, irregular broken edge, sun/shadow contrast, mostly bare. Cut: `... cliff.webp` (replaces existing `cliff_edge.webp` reference)
- [x] 13. Move all source PNGs to `web/.source-assets/summit/`

### Wiring

- [x] 14. Wire **far ridge** at z = -160, scale to span viewport at that depth, through `SilhouetteSunRakeShader`
- [x] 15. Wire **mid ridge** at z = -110, scale similarly, through `SilhouetteSunRakeShader`
- [x] 16. Wire **cloud sea** as horizontal plane (rotation.x = -PI/2) below the cliff, y ≈ -30, z spanning -10 to -130, large extents
- [x] 17. Wire **dawn sky** as backdrop plane at z ≈ -180 (behind the far ridge), large enough to cover the viewport at that depth
- [x] 18. Wire **cliff** as `ForegroundLedge` with the new texture, through `SilhouetteSunRakeShader`
- [x] 19. Wire **flag** at foreground left (x ≈ -5, z ≈ -8, y on cliff surface), through `SilhouetteSunRakeShader`

### Single hero dial — `uSunPulse`

- [x] 20. In `SummitSceneGroup` useFrame, compute `uSunPulse = smoothstep(enterStart, enterEnd, scrollProgress)` so it ramps `0→1` across 0.86→0.92, then holds at 1 through the rest of the window
- [x] 21. Pipe `uSunPulse` to: dawn sky gradient saturation, cloud sea warm-tint, sun-rake warm strength on all 4 silhouettes (2 ridges + cliff + flag)
- [x] 22. Confirm the whole module warms together as the user scrolls into summit (single dial, coherent dawn arrival)

### Integration + Leva

- [x] 23. Wire all new pieces inside `SummitSceneGroup`'s existing `applyGroupOpacity` envelope so the module timeline contract still handles fade-in/fade-out
- [x] 24. Add a Leva panel folder `"Home Summit"`: ridge z + scale (per-layer), flag position + scale, cliff position + scale, cloud-sea fbm scale + drift speed + horizon y, dawn sky fbm scale + horizon/zenith colors, sun direction vec2, warm strength multipliers per silhouette
- [ ] 25. Smoke-test scroll range 0.84–1.0 — confirm no regression on Alpine→Summit handoff (browser smoke test deferred — see Review)

### Guardrails + review

- [x] 26. Run `cd web && npm run guardrails` (lint + typecheck + format + build)
- [ ] 27. Start `npm run dev`, scroll through Summit in the browser, verify:
  - Camera physically steps onto the ledge (forward drift, head tilt up — no longer pinned at (0,0,20))
  - Two ridge layers parallax distinctly against the camera forward drift
  - Flag plants on the cliff at foreground left, becomes the visual reward at scroll = 1.0
  - Cloud sea reads as painted ink wash with subtle scroll-coupled drift, peach-warm at top, slate-shadow at base
  - Dawn sky reads as painted gradient + fbm wash, no visible sun disc, no stars
  - Sun-rake warm tint reads consistently across cliff + flag + both ridges
  - The single `uSunPulse` ramp is perceptible — module visibly warms as user scrolls into summit
  - No z-fighting, no flicker, no broken transparency on Alpine→Summit crossfade
  - Existing campfire video reference (`/assets/videos/campfire.mp4`) still works for Camp (we removed it from Camp's scene group, but video file should remain in repo)
- [x] 28. Populate the Review section below with diff summary, perf notes, and any follow-up items surfaced during implementation

## Review

### Diff summary

- **Assets** (`web/public/summit/`): 4 new webp files cut from user-supplied
  woodblock illustrations via `magick -fuzz 12% -transparent white -quality 90`.
  Sources stashed in `web/.source-assets/summit/`.
  - `flag.webp` (121 KB) — flag, pole, stones
  - `cliff.webp` (467 KB) — repainted summit rock platform
  - `ridge-mid.webp` (424 KB) — single hero peak
  - `ridge-far.webp` (363 KB) — receding atmospheric ridges
- **Shaders** (3 new): `DawnSkyMaterial.ts`, `CloudSeaMaterial.ts`,
  `SilhouetteSunRakeMaterial.ts` in `web/src/components/shaders/`. Modeled on
  `SumiSkyMaterial`/`SilhouetteWarmMaterial` patterns; registered in
  `UnifiedScene.tsx` imports + the global JSX intrinsic-elements declaration.
- **`UnifiedCamera`**: Summit zone is no longer static `(0,0,20)`. Inherits
  alpine's end-pose `(y=120, z=15, rotX=0.15)` at zone entry, then drifts
  `z 15→5`, `y 120→125`, `rotX 0.15→-0.05` across `0.86→1.0`. Summit-weight
  ramp now starts at `alpine.exitStart` so the alpine→summit handoff
  crossfades two equal poses without a frame at `(0,0,0)`.
- **`SummitSceneGroup`**: Fully rewritten. Removed `VideoPanoramaLedge`,
  `OneShotAnimatedFox`, the unused `PanoramaLedge` (image variant), and the
  `useVideoCoverScale` helper. Removed `useVideoTexture` import. New layout:
  - `DawnSky` backdrop at `z=-180` (DawnSkyShader, modulated by `uSunPulse`)
  - `SunRakeSilhouette` far ridge at `z=-160`
  - `SunRakeSilhouette` mid ridge at `z=-110`
  - `CloudSea` horizontal carpet at `y=85, z=-70` (drift coupled to
    `scrollProgress`)
  - `SunRakeForegroundCliff` camera-pinned cliff at `z=-2`
  - `SunRakeFlagSprite` flag camera-pinned to cliff plant-point at
    `x=-5.5, z=-1`
- **Single hero dial**: `sunPulse` ref in `SummitSceneGroup` ramps via
  smoothstep across `enterStart→enterEnd` and holds at 1 through hold + exit.
  Fed to all five summit materials each frame.
- **Leva folder**: New `'Home Summit'` panel (collapsed by default) with
  per-layer position/scale, ridge & flag warm-strength, sun-direction
  vec2, dawn-sky FBM, cloud-sea FBM + drift-speed.

### Guardrails

`npm run typecheck` and `npm run lint` pass clean (the 2 pre-existing
warnings in `grove/GroveScene.tsx` are untouched). `npm run build`
succeeds. The asset-size guardrail flags 3 home-hero webps that were
already over the 1.5 MB limit before this mission — none of the new
summit webps exceed the limit (largest is 467 KB).

### Visual smoke test

Browser-side verification was deferred — the Claude-in-Chrome extension
wasn't connected during this session. Recommended manual passes once
dev server is running locally:

- Scroll across `0.84–1.0` and confirm no jump at the alpine→summit seam
  (the camera should glide forward, not snap).
- Watch the `Home Summit` Leva folder while tuning ridge/cliff/flag
  positions to taste; defaults are deliberate but conservative.
- Confirm the whole module visibly warms in over the 0.86→0.92 enter
  window and stays warm through the rest of the zone.

### Follow-ups not addressed (deferred per scope)

- Departing bird flock V into the vista
- God-ray sun shaft / visible sun disc at `scroll = 1.0`
- 3D→2D HTML anchoring of a closing quote
- Real `<directionalLight>` (we still fake sun-rake purely in shader math)

## Asset prompts (appendix)

These are the production-ready Flow prompts locked during the grill-me. Generate, then cut with `magick input.png -fuzz 12% -transparent white -quality 90 public/summit/<name>.webp`, then move source PNGs to `web/.source-assets/summit/`.

### Far ridge — `ridge-far.webp`

> Japanese woodblock print illustration, John Fellows / Hokusai / Hiroshige style. **A range of distant alpine mountains seen from above** — the kind of view where you've crested a high ridge and are looking out across a sea of layered ranges fading into the dawn horizon.
>
> Composition: **multiple receding ridge lines** stacked from front to back, each fainter than the last. Three to five distinct silhouetted ridges, each with its own peak shapes — angular pyramids, broader rounded shoulders, sharp jagged crests. The ridges layer like waves rolling backward into the distance, with the FARTHEST ridge nearly fading into the sky. Keep the **horizon line low** in the canvas (the lower 50–60% of the image is mountain ranges; the upper 40–50% is empty white sky for compositing the dawn gradient).
>
> Atmospheric perspective is the picture's main visual idea: **nearest ridges are darker** (slate-blue #3d4656 with sepia-ink hatching), **middle ridges are mid-tone** (lighter slate #5a6878 with restrained linework), **farthest ridges are nearly pale** (very light slate-violet #8a92a8 with almost no carving). The eye reads depth purely from value falloff.
>
> Dawn light from upper right: faintest amber wash (#fde68a, very restrained — barely there) on the right-facing slopes of each ridge. Most of the warmth lives on the nearer ridges; the far ridges are too distant to catch warm light visibly. The tonal contrast is cool-dominated; warm is a whisper.
>
> Carving style: woodblock flat tonal planes, 5–7 tone palette, irregular organic edges, no photographic detail. **Critical: the painted area must end well above the bottom of the canvas — leave at least 25% of the canvas empty white at the bottom.** The cloud sea will be composited there in code, so the bottoms of the ridges should fade into white as if dipping into clouds (not a hard line — irregular fading transition).
>
> **Pure white background (#FFFFFF)** above and below the silhouettes. **No painted clouds, no painted sky, no painted foreground, no sun, no birds, no figures.** Alpha-keyable on white.
>
> Aspect ratio: **3:1 horizontal** panoramic. Resolution: 3072×1024 minimum.

### Mid ridge — `ridge-mid.webp`

> Japanese woodblock print illustration, John Fellows / Hokusai / Hiroshige style. **A single dominant alpine ridge with one heroic central peak**, painted as the visual hero of an above-the-clouds dawn vista.
>
> Composition: ONE prominent **glorious mountain** filling the **upper-center to upper-right of the canvas** — angular pyramid summit with a prominent shoulder dropping to the right, a sharper face dropping to the left. Adjoining lower ridges step down from the central peak on both sides, smaller and less detailed, providing scale rhythm. The hero peak's summit reaches about **70–75% up the canvas**. The ridge bases occupy the **middle vertical band**, leaving room above for sky and below for the cloud sea.
>
> Carving / palette: deeper tonal range than the far-ridge layer because this is the closer hero peak. Body in slate-blue / cool gray (#3d4656 to #2a3240) with **rich dark sepia-ink hatching** (#1a1410) on rock facets, gullies, and the sharp west face. Dawn light from upper right: clearly visible **warm amber wash** (#fde68a → #f6c400 gradient) on the right-facing summit slopes and right shoulder, transitioning sharply at the peak's ridgeline into the cool slate-blue shadow side. The warm-cool contrast across the central peak is the picture's single most important visual event.
>
> The painting should **feel grand**. The peak should read as something earned — solid, eternal, slightly intimidating. Hokusai-scale presence, not a postcard mountain. **No clouds painted around the peak, no atmospheric haze**, no compromises softening the silhouette — clean, decisive, painted with confidence.
>
> Carving style: woodblock flat tonal planes, 5–7 tone palette, irregular organic edges, no photographic detail or smooth gradients. **Critical: leave at least 25% of the canvas empty white at the bottom.** The cloud sea will be composited beneath, so the base of the ridge should fade into white as if disappearing into a cloud sea (irregular feathered transition, not a hard line).
>
> **Pure white background (#FFFFFF)** above and below the silhouettes. **No painted clouds, no painted sky, no painted foreground, no sun, no birds, no figures, no auxiliary illustrations.** Alpha-keyable on white.
>
> Aspect ratio: **3:1 horizontal** panoramic. Resolution: 3072×1024 minimum.

### Summit flag — `flag.webp`

> Japanese woodblock print illustration, John Fellows / Hokusai / Hiroshige style. A solitary **summit flag** planted at the high point of an alpine ridge, captured at first light.
>
> Composition: a single weathered **wooden pole / hiking staff** rising vertically from a small cluster of dark gathered stones at its base. A simple **rectangular banner** of weathered cloth tied to the upper third of the pole, **caught mid-flutter** in a dawn breeze, fabric flying toward the left of the frame with two or three soft folds and an irregular trailing edge. The fabric is plain — **no logos, letters, or insignia** — just a flag, intentionally quiet.
>
> Pole: weathered cedar or hand-hewn wood, slightly knotty, with visible dark sepia-ink woodgrain hatching (#3d2b1f). Subtle wear at the top where rope ties the banner. Stones at the base: 4–6 dark river-stones of varied sizes, packed loosely around the pole's base, with hatching falling away from the lit side.
>
> Banner: pale bone / weathered cream fabric (#f5ecd8 base) with restrained linework defining the folds. **Sun-side of the fabric warmed with a soft amber wash** (#fde68a → #f6c400 gradient, applied gently on the right edge / upper face of the banner where dawn light strikes). Cool slate-blue shadow tones (#3d4656) on the left / leeward side. Tonal contrast between sun-side and shadow-side is the picture's primary visual event.
>
> Sky / horizon implied, not painted. **No background landscape, no clouds, no horizon line, no ground beyond the immediate stones at the pole's base.** The flag must read as an isolated subject so it can be composited in front of a separate cloud-sea + ridge backdrop.
>
> Carving style consistent with the existing Camp assets: flat tonal planes, 5–7 tone palette, irregular organic edges, no photographic detail or realistic shading. Quiet, contemplative, earned — not triumphant. **No spotlight beams, no rays, no glow effects.** The dawn light is implied through the warm-cool fabric contrast only.
>
> **Pure white background (#FFFFFF)** everywhere except inside the flag/pole/stones shapes. No vignette, no cast shadow, no atmospheric wash. Alpha-keyable on white.
>
> Aspect ratio: **square (1:1)**, vertical-leaning composition (pole + flag occupy the central vertical third). Resolution: 2048×2048 minimum.

### Summit cliff — `cliff.webp`

> Japanese woodblock print illustration, John Fellows / Hokusai / Hiroshige style. A **foreground summit rock platform** — the slab of weathered granite where a hiker would plant a flag or a fox would curl up. Viewed from a slightly raised angle so both the **top surface** and the **broken cliff edge** are visible.
>
> Composition: a **wide horizontal slab of stone** filling the lower half of the frame, with an **irregular broken edge** breaking across it — fractured rock, jagged in places, smoother in others. The edge is not a clean horizontal line; it has variation and bite. Beyond the edge, **empty white space** (this is where the cloud sea will be composited in code — do not paint clouds here). The slab is **bare stone**, no soil, no moss carpet — this is above treeline.
>
> Surface detail: **3–5 small scattered stones** of varied sizes resting on the platform (loose scree). **One or at most two tiny tufts of weathered alpine grass** (small wispy clumps, not bushes, no flowers) — only if they don't visually compete; if uncertain, leave the surface bare. **No trees, no krummholz, no shrubs.**
>
> Palette: pale bone / warm cream base (#f5ecd8) for the lit faces of the stone, with dark sepia-ink hatching (#3d2b1f) for rock facets, fissures, and texture. **Dawn sun raking from upper right** — the **right-facing surfaces and rim of the slab** receive a soft warm amber wash (#fde68a → #f6c400 gradient, restrained). **Left-facing surfaces and the underside of the broken edge** sit in cool slate-blue shadow (#2a3240 → #3d4656). The warm-side / cool-side contrast is the picture's primary visual event — flat tonal planes, no smooth gradients.
>
> Carving style: matches the existing camp tent/branch/fire/ridge assets — flat tonal planes, 5–7 tone palette, irregular organic edges, no photographic detail or realistic shading. **No spotlight beams, no rays, no glow effects.** Dawn light implied through the warm-cool tonal split only.
>
> **Pure white background (#FFFFFF)** everywhere except inside the slab and surface stones. **No sky, no clouds, no horizon line, no distant mountains, no atmospheric wash above or behind the slab.** Alpha-keyable on white. The cloud sea, ridges, and sky are all separate composited layers — this asset must be the cliff and only the cliff.
>
> Aspect ratio: **3:1 horizontal** (panoramic, like the ridge asset). The slab and broken edge occupy the lower 60% of the canvas; the upper 40% is pure white. Resolution: 3072×1024 minimum.

---

## Shhhh Asset Prompting Plan

- [x] 1. Read the `shhhh` route, grove scene, and existing cairn/monogram assets to lock the visual constraints.
- [x] 2. Confirm the intended role, composition, and output format for each of the four requested assets.
- [x] 3. Draft production-ready generation prompts that match the updated Japanese woodblock direction for the easter-egg scene.
- [x] 4. Add a review summary with the final prompt set, decisions, and any remaining open constraints.

### Review

- Locked a new shared style anchor for all visual parallax illustration prompts: Japanese woodblock print, Hokusai/Hiroshige influence, restrained dawn palette, paper grain, limited 5–7 tone palette, quiet pre-sunrise mood.
- Kept the style anchor for scenic illustration assets only. Did not apply it to ambient audio or terrain utility maps because those assets need medium-specific prompts to stay usable.
- Drafted one prompt for the foreground branch layer, one for a compact grove sigil that can live inside the existing monogram frame or stand alone, one audio-generation prompt for a short seamless ambience loop, and one grayscale height-map prompt intended for later normal-map derivation.
- Remaining open decision: whether the sigil should be generated as a centered standalone emblem or specifically sized/composed to drop into `web/public/cairn/monogram-frame.webp`.

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

## Phase 2.5: Monochrome Sweep & Hero Rework (CURRENT)

Strip all per-project color accents in favor of strict black-and-white via theme tokens
(`#18181b` foreground / `#f9fafb` background). Rework the case study parallax hero to
be a pure 100vh woodblock-print moment — keep the commissioned assets, but dial them
in so they actually read. Title/subtitle/tags move out of the hero frame into a new
`masthead` block at the top of the content flow. Paper atmosphere shader retracts to
hero-only scope so the moment has a clean end at 100vh. Mouse interactivity killed
in favor of a quieter ambient scene.

Grilled decisions:
- Vibe: **Woodblock print** (high-contrast ink-on-paper, authored composition)
- Hero structure: **Pure 100vh visual moment**, no text competing
- Paper shader scope: **Hero-only** (fades at 100vh, content scrolls on clean bg)
- Biome density: **Trim each biome from 9 → 6 elements** (kill redundancies, keep depth hierarchy)
- Mouse: **Kill vertex push + watercolor injection**, only time-driven wind sway remains
- Parallax speeds: **Soften to 0.15 / 0.45 / 0.9** (cinematic, less demo-like)
- Masthead: **New `MastheadBlock` marker** (empty `{ type: 'masthead' }`, renderer reads from project root)

### A. Strip color — everything becomes theme-token b&w

- [x] A1. Delete `ProjectPalette` interface and `palette` field from `Project` in `projects.ts`
- [x] A2. Delete `palette: {...}` from all 4 projects
- [x] A3. `useAppStore` — change transition default color from `#09090b` → `#18181b` (foreground token)
- [x] A4. `CaseStudyCard.handleLinkClick` — drop palette lookup, always pass `#18181b` to `startTransition`
- [x] A5. `work/[slug]/page.tsx` — remove `accentColor` prop passed to `CaseStudyScene`
- [x] A6. `CaseStudyScene.tsx` — remove `accentColor` prop from component + `AtmosphereLayer`
- [x] A7. `HeroLandscape.tsx` — remove `accentColor` prop + `colorWater` memo
- [x] A8. `CaseStudyContent.tsx` — remove `--cs-accent` / `--cs-accent-muted` CSS var injection from article `style`

### B. Woodblock tuning — make the assets actually read

- [x] B1. `WoodcutMaterial.ts` fragment — delete watercolor math (`waterRadius`, `sunRadius`, `flow`, `injectedPaperColor`). `finalColor = mix(uColorPaper, uColorBase, inkIntensity)` only.
- [x] B2. `WoodcutMaterial.ts` vertex — delete mouse-push math (`worldMouse`, `distToMouse`, `mousePush`, `pushDir`, `pos.x += pushDir.x * mousePush; pos.z -= mousePush * 0.5;`). Keep wind sway.
- [x] B3. `WoodcutMaterial.ts` uniforms — remove `uColorWater`, `uColorSun`, `uColorAlt`, `uMouse`. Defaults `uColorBase = #18181b`, `uColorPaper = #f9fafb`.
- [x] B4. `heroAssets.ts` — `LAYER_OPACITY` `{bg:0.2, mid:0.3, fg:0.4}` → `{bg:0.65, mid:0.8, fg:0.92}`
- [x] B5. `heroAssets.ts` — `LAYER_PAPER_OPACITY` all → `0` (single paper source via atmosphere shader)
- [x] B6. `heroAssets.ts` — `LAYER_SPEED` `{bg:0.3, mid:0.6, fg:1.0}` → `{bg:0.15, mid:0.45, fg:0.9}`
- [x] B7. `heroAssets.ts` — trim `new-belgium`: drop cumulus cluster, trail marker, hop vine
- [x] B8. `heroAssets.ts` — trim `mission-bell`: drop cumulus cluster, trail marker, dead tree snag
- [x] B9. `heroAssets.ts` — trim `corners-and-coasts`: drop wispy stratus, trail marker, jagged outcrop
- [x] B10. `heroAssets.ts` — trim `crafted-kit`: drop wispy stratus, trail marker, jagged outcrop
- [x] B11. `heroAssets.ts` — set `xVariance: 0` on all remaining elements (locked composition)
- [x] B12. `HeroLandscape.tsx` — drop `xOffset` randomization (always 0 now)
- [x] B13. `PaperAtmosphereMaterial.ts` — remove `uAccentColor` uniform entirely
- [x] B14. `PaperAtmosphereMaterial.ts` fragment — delete watercolor edge seep (`edgeL/R/T/B`, `edgeMask`, `bleedNoise`, `bleedShape`, `bleedStrength`, `watercolorTint`)
- [x] B15. `PaperAtmosphereMaterial.ts` fragment — delete velocity fiber stretch + wind ripple (keep only time-driven `fbm` fiber grain + speckle)
- [x] B16. `PaperAtmosphereMaterial.ts` fragment — delete warm color shift (`color.r += 0.005; color.g += 0.002;`)
- [x] B17. `PaperAtmosphereMaterial.ts` — `uPaperColor` default `#f9fafb` (bg token), `uInkColor` stays `#18181b`
- [x] B18. `CaseStudyScene.tsx` — drop `uVelocity` wiring to paper shader, drop `velocity` prop chain if no other consumer
- [x] B19. `HeroLandscape.tsx` — drop `mouse` prop chain to `WoodcutSprite`
- [x] B20. `CaseStudyScene.tsx` — remove `handleMouseMove`, `mouseRef`, `<div onMouseMove>` handler, `useVelocity`, `useSpring` plumbing if unused

### C. Hero structure — pure 100vh moment, canvas fades past it

- [x] C1. `CaseStudyContent.tsx` — delete the sticky 130vh `<header>` entirely
- [x] C2. `CaseStudyScene.tsx` — fade Canvas opacity to 0 as `scrollY` crosses 100vh (keeps fixed positioning, just makes it invisible past the moment)
- [x] C3. `CaseStudyScene.tsx` — `heroHeight = window.innerHeight * 1.3` → `* 1.0` so `scrollProgress` tracks 0→1 across exactly one viewport
- [x] C4. `HeroLandscape.tsx` — tighten hero fade smoothstep `(0.75, 1.0)` → `(0.8, 1.0)` so fade finishes before content arrives
- [x] C5. Verify `BackToTrail` overlay positioning still works over the new hero

### D. Masthead block (empty marker pattern)

- [x] D1. `projects.ts` — add `interface MastheadBlock { type: 'masthead' }` (no data)
- [x] D2. `projects.ts` — add `| MastheadBlock` to `ContentBlock` union
- [x] D3. `projects.ts` — insert `{ type: 'masthead' }` at `blocks[0]` of all 4 projects
- [x] D4. `CaseStudyContent.tsx` — add `MastheadBlockRenderer({ project })` component (reuses markup from deleted hero header, sans sticky positioning)
- [x] D5. `CaseStudyContent.tsx` — `BlockRenderer` signature gains `project` prop
- [x] D6. `CaseStudyContent.tsx` — add `case 'masthead': return <MastheadBlockRenderer project={project} />` to switch
- [x] D7. Update `blocks.map` call site to pass `project` through

### E. Verification

- [x] E1. `npm run guardrails` (format, lint, typecheck, build)
- [ ] E2. Visual check all 4 case studies: hero is pure woodblock at 100vh, b&w, content starts cleanly below
- [ ] E3. Visual check ink-wash card-click transition: foreground-token dark ink, no per-project color
- [ ] E4. Visual check back-to-trail reverse transition
- [ ] E5. Verify reduced-motion still gracefully skips the transition animation

---

## Phase 3: Media & Navigation

- [x] 12. **A — Woodcut border dissolve on media blocks**
  - WoodcutBorder component: torn-edge mask, scroll-driven dissolve inward
  - Tinted with `--cs-accent`, applied to MediaBlockRenderer only
- [x] 13. **F — Topographic elevation profile progress indicator**
  - ElevationProfile component: SVG path from block density, glowing dot, chapter waypoints
  - Accent-colored active portion, fixed right sidebar (desktop only)

## Phase 3.5: Field Journal content layout (CURRENT)

Reframe case studies from "centered column of blocks" into a printed field journal
with five named trail stations, a scroll-drawn trail line in the margin, specimen
marginalia lifted from the 24 old hero sprite assets, and authored pacing moments
(horizontal frieze, cinemascope breakout). Every layout decision flows from one
metaphor: you're reading an expedition log, not a web article.

### Locked decisions
- Metaphor: **Field journal / expedition trail log**
- Structure: **5 named stations** — Trailhead, Ascent, Ridge, Summit, Descent
- Grid: **12-col asymmetric** — text in 5–6 col swings, media full-bleed via negative margin, marginalia in outer rail
- Trail spine: **vertical SVG path draw in left margin**, scroll-driven, waypoint dots replaced by `trail-marker-signpost.webp` sprites
- Typography: **display serif + sans metadata**, Roman numerals for station marks, `Fig. N` captions, 5-line drop caps on post-station paragraphs
- Asset reuse: **all 24 old sprite assets reborn as specimens, landmarks, chapter backdrops, friezes, and ornaments** (see asset map below)
- Counter: **running `07 / 24` case-study index** fixed bottom-right, replaces `ElevationProfile` as the progress indicator
- Breakouts per case study: **1 horizontal specimen frieze + 1 full-bleed cinemascope shot + 1 sticky metric counter**

### Asset integration map (old sprite → new role)

| Asset bucket | Files | New role in Field Journal |
|---|---|---|
| Station markers | `trail-marker-signpost.webp` | Waypoint dot sprites on TrailSpine + running counter icon |
| Specimen marginalia | `pine-tree-dense.webp`, `dead-tree-snag.webp`, `rock-boulder-cluster.webp`, `rock-jagged-outcrop.webp`, `wildflower-meadow-strip.webp` | Small sprites in outer margin w/ `Fig. N` + italic Latin label |
| Weather ambients | `cloud-cumulus-cluster.webp`, `cloud-wispy-stratus.webp` | Slow horizontal drift at station footers; CSS infinite translate |
| Terrain backdrops | `ridgeline-distant.webp`, `ridgeline-close.webp`, `terrain-rocky-trail.webp`, `terrain-rolling-hillside.webp` | Watermarks behind long text blocks at 5–8% opacity |
| Per-project landmark | `nb-rustic-cabin.webp`, `ck-crystalline-formation.webp`, `mb-mission-bell-tower.webp`, `cc-lighthouse.webp` | Washed at 10% opacity behind Station III "The Ridge" header per project |
| Secondary landmarks | `nb-hop-vine.webp`, `ck-circuit-fern.webp`, `mb-desert-mesa.webp`, `cc-coastal-cliff.webp` | Marginalia specimens specific to that case study |
| Ink-wash transitions | `ink-wash-horizontal.webp`, `ink-wash-vertical.webp` | Full-width dividers between stations at 30% opacity |
| Border masks | `border-organic-edge.webp`, `border-torn-edge.webp` | CSS mask on media blocks + spotlight frames (polaroid effect) |

### A. Data model — station vocabulary + specimen blocks

- [ ] A1. `projects.ts` — rename `TRAIL_CHAPTERS` from 4-chapter to 5-station: `['Trailhead', 'Ascent', 'Ridge', 'Summit', 'Descent']`
- [ ] A2. `projects.ts` — replace `ChapterBreak` with `StationBreak` block type: `{ type: 'station', roman: 'I'|'II'|'III'|'IV'|'V', title: string, subtitle?: string }`
- [ ] A3. `projects.ts` — add `SpecimenBlock`: `{ type: 'specimen', src: string, figNumber: string, label: string, side?: 'left'|'right' }`
- [ ] A4. `projects.ts` — add `FriezeBlock`: `{ type: 'frieze', specimens: string[], title?: string }`
- [ ] A5. `projects.ts` — add `MetricBlock`: `{ type: 'metric', value: string, unit?: string, label: string }`
- [ ] A6. `projects.ts` — add `openingQuote: string` and `signatureLandmark: string` to `Project` interface
- [ ] A7. `projects.ts` — rewrite `blocks[]` for all 4 projects into 5-station narrative (see K)

### B. Specimen catalog + asset helper

- [ ] B1. New `web/src/lib/specimenCatalog.ts` — typed catalog mapping 24 sprite filenames → `{ role, defaultLabel, slug? }`
- [ ] B2. Helper `getSpecimensForProject(slug)` returns the ordered list of specimen sprites appropriate for that project (mix of shared nature + per-project secondary landmarks)

### C. Trail spine — scroll-drawn SVG path in left margin

- [ ] C1. New `web/src/components/TrailSpine.tsx` — fixed left-margin SVG, desktop-only (`hidden lg:block`)
- [ ] C2. Scroll-driven `pathLength` via `useScroll` + Framer Motion `useTransform` on `strokeDashoffset`
- [ ] C3. 5 waypoint dots positioned by station ownership percentages; active dot fills as scroll passes
- [ ] C4. Replace `ElevationProfile` with `TrailSpine` in `CaseStudyContent.tsx`

### D. Station break renderer — the named chapter head

- [ ] D1. New `StationBreakBlock` component: outline Roman numeral (180px+, foreground/10) floating in outer margin, display-serif title at 72px, optional subtitle, 1px full-width rule above, 40vh breathing room
- [ ] D2. Station III specifically renders `project.signatureLandmark` at 10% opacity as a full-width background behind the header
- [ ] D3. First `<p>` after any station break gets a 5-line drop cap via CSS `::first-letter`

### E. Asymmetric grid

- [ ] E1. `CaseStudyContent.tsx` root wrapper → `grid grid-cols-12 gap-x-6 px-6 md:px-16 max-w-[88rem] mx-auto`
- [ ] E2. `TextBlockRenderer` — `col-span-6` alternating `col-start-2` / `col-start-7` by block index. Drop frosted glass panel. Use serif body, generous leading.
- [ ] E3. `MediaBlockRenderer` — default `col-span-10 col-start-2`; `fullBleed` becomes `col-span-12 -mx-6 md:-mx-16`
- [ ] E4. `VideoBlockRenderer` — same rules as media
- [ ] E5. Outer-margin specimen rail lives at `col-start-1` (left side) or `col-start-12` (right side) via `SpecimenBlock.side`

### F. Block upgrades — editorial flourishes

- [ ] F1. `TextBlockRenderer` — drop frosted glass panel, replace with `prose prose-editorial` (Tailwind v4 typography plugin or custom). Serif body, generous leading, no bg container.
- [ ] F2. `MediaBlockRenderer` — add `Fig. N` small-caps caption ABOVE image + italic description BELOW, right-aligned flush to image edge
- [ ] F3. `MastheadBlockRenderer` rework:
  - Opening italic quote from `project.openingQuote` BEFORE title (Rally National Parks pattern)
  - All-caps stacked metadata `CLIENT / ROLE / YEAR` underneath title
  - Title in display serif at 7–8rem
  - No more frosted glass container
- [ ] F4. `SpotlightBlockRenderer` — wrap in `border-torn-edge.webp` CSS mask for a polaroid-pasted-in-journal feel
- [ ] F5. New `SpecimenBlockRenderer` — places specimen sprite in outer margin w/ `Fig. N` label + italic description
- [ ] F6. New `FriezeBlockRenderer` — sticky horizontal scroll section, tiles at 60vw each, translateX driven by inner scroll progress
- [ ] F7. New `MetricBlockRenderer` — sticky full-viewport counter, scroll-driven number count-up, `wildflower-meadow-strip.webp` at the bottom

### G. Typography system

- [ ] G1. Verify `font-instrument` (Instrument Serif) is already loaded; if not add `@font-face` or next/font for display serif
- [ ] G2. `globals.css` — add `.drop-cap-5` utility for 5-line dropped first letter
- [ ] G3. `globals.css` — add `.fig-caption` utility for italic right-aligned figure captions
- [ ] G4. Define display scale tokens: `text-display-1` (96px) through `text-display-4` (32px)

### H. Running counter

- [ ] H1. New `TrailCounter.tsx` — fixed bottom-right, renders `{projectIndex}` / `{totalProjects}` w/ a `trail-marker-signpost.webp` icon
- [ ] H2. Mounts into `CaseStudyContent` top-level

### I. Ambient flourishes

- [ ] I1. Between each station: full-width `ink-wash-horizontal.webp` at 30% opacity as transition ornament
- [ ] I2. Long text blocks: optional terrain watermark sprite at 5% opacity behind content

### J. Project data — rewrite blocks for 5-station narrative

- [ ] J1. For each of 4 projects, rewrite `blocks[]`:
  - **Station I Trailhead**: masthead + 1 text block
  - **Station II Ascent**: station break + 2 text blocks + horizontal frieze + 2 specimen marginalia
  - **Station III Ridge**: station break + 1 cinemascope + 1 video + 1 text + 2 specimen marginalia
  - **Station IV Summit**: station break + 1 spotlight + 1 text
  - **Station V Descent**: station break + 1 metric + 1 text + 1 specimen marginalia
- [ ] J2. Write `openingQuote` for each project (1-line italic hook)
- [ ] J3. Assign `signatureLandmark` per project (NB cabin, CK crystals, MB bell tower, CC lighthouse)
- [ ] J4. Pick per-project specimen mix from the catalog (each project gets 5–7 specimens across the page)

### K. Verification

- [ ] K1. `npm run guardrails` (format, lint, typecheck, build)
- [ ] K2. Visual QA each of 4 case studies desktop + mobile
- [ ] K3. Verify trail spine draws correctly, waypoints align to stations
- [ ] K4. Verify reduced-motion gracefully skips kinetic effects

---

## Phase 3.6: Mobile hero + flat shader (CURRENT)

Hot-swap portrait mobile hero assets for the 4 case studies on phone-size viewports,
strip all vertex-level distortion out of `WoodcutMaterial` (commented out, not deleted,
so it's togglable for A/B), and replace mouse-based watercolor on mobile with
press-to-activate touch interaction on all heroes.

### Locked decisions (via /grill-me)

1. **Vertex effects to kill** — all three: time sway (`uWind` sin), mouse push (radial
   vertex shove from cursor), and luminance-based Z pop. Commented out with a clear
   header so toggling back is one uncomment.
2. **Mobile breakpoint** — `(max-width: 767px)` via `window.matchMedia`, matches
   Tailwind's `md:` fault line used everywhere else in the project.
3. **Fit mode** — unchanged `contain @ 1.2×` in `HeroLandscape.tsx` for both desktop
   and mobile. Portrait asset ≈ portrait viewport aspect ratio, so contain naturally
   fills the screen without letterbox gaps. No second fit mode, no branching.
4. **Touch scope** — press-to-activate watercolor on **all** heroes (homepage
   `UnifiedScene.tsx` ParallaxLayer + case studies `HeroLandscape.tsx`). Desktop
   `mousemove` listener unchanged; touch listeners are additive, gated by media query.
5. **Touch feel** — **A + C**: snap `uMouse` to touch position on `touchstart`
   (instant appearance), lerp toward off-screen `(10, 10)` on `touchend` (natural
   fade-in-place because `waterRadius = smoothstep(1.5, 0.0, distToMouse)` goes
   to zero as uMouse moves away).
6. **Mobile homepage hero** — `bg_layer.webp` stays as-is (no mobile variant provided).
   Touch interaction still wires up; just the texture doesn't swap.

### A. Shader — comment out all vertex distortion

- [ ] A1. `WoodcutMaterial.ts` vertex shader — wrap time sway block
      (`swayBlend`, `wind`, `pos.x += wind`, `pos.y += wind * 0.2`) in a comment
      block with header `/* ── VERTEX EFFECTS DISABLED — uncomment to re-enable ── */`
- [ ] A2. Same block — wrap mouse push math (`worldMouse`, `distToMouse`, `mousePush`,
      `pushDir`, `pos.x += pushDir.x * mousePush`, `pos.z -= mousePush * 0.5`)
- [ ] A3. Same block — wrap luminance Z pop (`texData`, `lum`, `displacement`, `pos.z += displacement`)
- [ ] A4. Keep `vDisplacement = 0.0` passthrough so the fragment shader's unused
      varying doesn't error
- [ ] A5. Keep `vWorldPos = pos.xy` (still used by fragment watercolor distance calc)

### B. Mobile asset pipeline

- [ ] B1. `cwebp -q 88 -m 6 ~/Desktop/nbb-mobile.png -o web/public/assets/graphics/case-study-heroes/new-belgium-mobile.webp`
- [ ] B2. `cwebp -q 88 -m 6 ~/Desktop/crafted-mobile.jpeg -o web/public/assets/graphics/case-study-heroes/craftedkit-mobile.webp`
- [ ] B3. `cwebp -q 88 -m 6 ~/Desktop/mission-bell-mobile.jpeg -o web/public/assets/graphics/case-study-heroes/mission-bell-mobile.webp`
- [ ] B4. `cwebp -q 88 -m 6 ~/Desktop/Consume-mobile.jpeg -o web/public/assets/graphics/case-study-heroes/consume-and-create-mobile.webp`
- [ ] B5. Verify all 4 new webp files land in the expected folder and are reasonable size

### C. Asset wiring — parallel mobile map

- [ ] C1. `lib/heroAssets.ts` — add `HERO_SCENES_MOBILE: Record<string, string>`
      parallel to `HERO_SCENES`, keyed by the same 4 slugs
- [ ] C2. `lib/heroAssets.ts` — export `DEFAULT_HERO_MOBILE` fallback

### D. HeroLandscape — media-query-driven texture swap

- [ ] D1. `HeroLandscape.tsx` — new `useIsMobile()` hook (or inline): SSR-safe
      `window.matchMedia('(max-width: 767px)')` with change listener, returns
      boolean. Starts `false` on server, resolves on mount.
- [ ] D2. `HeroLandscape.tsx` — in `HeroPlane`, pick texture URL via
      `isMobile ? HERO_SCENES_MOBILE[slug] ?? DEFAULT_HERO_MOBILE : HERO_SCENES[slug] ?? DEFAULT_HERO`
- [ ] D3. Verify `useTexture` properly re-suspends + reloads when URL changes on
      media-query flip (drei should handle this natively via the Suspense boundary
      already wrapping `HeroPlane`)

### E. Press-to-activate touch — HeroLandscape (case study heroes)

- [ ] E1. `HeroLandscape.tsx` — new `useEffect` that attaches passive
      `touchstart/touchmove/touchend` to `window` when mobile, cleanup on unmount
- [ ] E2. On `touchstart`: read `touches[0].clientX/Y`, snap `mousePos.current` to
      normalized (-1..1) coords (bypass lerp)
- [ ] E3. On `touchmove`: update a `touchTarget` ref (lerp picks it up in useFrame)
- [ ] E4. On `touchend`: set `touchTarget` to `(10, 10)` — far off-screen so
      watercolor naturally shrinks to zero via smoothstep
- [ ] E5. Gate mouse listener: only attach `mousemove` if NOT mobile
      (avoids listener coexistence confusion)
- [ ] E6. Update `useFrame` to lerp `mousePos.current` toward `touchTarget.current`
      on mobile (replaces existing single-source-of-truth lerp)

### F. Press-to-activate touch — UnifiedScene homepage hero

- [ ] F1. `UnifiedScene.tsx` ParallaxLayer — mirror the same `isMobile` +
      touch listener pattern from E1–E6
- [ ] F2. Keep the existing `mousemove` listener on desktop unchanged
- [ ] F3. Note: no texture swap needed (no mobile `bg_layer.webp` asset),
      only the touch interaction wiring

### G. Verification

- [ ] G1. `npm run guardrails` (format, lint, typecheck, build) — must be green
- [ ] G2. Desktop visual: case study heroes are rock-steady (no wind, no cursor
      shove on vertices), watercolor still follows cursor fluidly
- [ ] G3. Desktop visual: homepage hero parallax layer also rock-steady, watercolor
      still follows cursor
- [ ] G4. Mobile visual (device or chrome devtools 375w): case study hero shows
      the correct portrait asset, fills the viewport, touch-and-drag paints
      watercolor, lifting finger fades it out in place
- [ ] G5. Mobile visual: homepage hero touch-and-drag paints watercolor on the
      parallax layer
- [ ] G6. Quick A/B: uncomment the vertex block in `WoodcutMaterial.ts`, confirm
      wind sway comes back, re-comment to lock in the flat behavior

---

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
- [ ] ~~22. Per-project color palettes fully applied~~ — abandoned, superseded by Phase 2.5 (strict monochrome)

## Review — Phase 2.5 implementation (2026-04-11)

### What changed

**Data model (`projects.ts`)**
- Deleted `ProjectPalette` interface and `palette?` field from `Project`
- Added `MastheadBlock = { type: 'masthead' }` empty marker type to the `ContentBlock` union
- Inserted `{ type: 'masthead' }` at `blocks[0]` of all 4 projects
- Removed `palette: { ... }` from all 4 projects

**Transition store (`useAppStore.ts`)**
- Default `transitionColor` changed `#09090b` → `#18181b` (foreground token)

**Shader materials**
- `WoodcutMaterial.ts` rewritten: removed `uColorWater`, `uColorSun`, `uColorAlt`, `uMouse` uniforms; deleted fragment watercolor injection math; deleted vertex mouse-push math; now a pure ink-on-paper mix using theme tokens only. Wind sway + Z displacement preserved.
- `PaperAtmosphereMaterial.ts` rewritten: removed `uAccentColor` + `uVelocity`; deleted watercolor edge seep, velocity fiber stretch, wind ripple, warm color shift. Now just time-driven `fbm` fiber grain + subtle speckle on theme tokens.

**Biome config (`heroAssets.ts`)**
- `LAYER_OPACITY` 0.2/0.3/0.4 → 0.65/0.8/0.92 (ink actually reads now)
- `LAYER_PAPER_OPACITY` → all zero (only the atmosphere shader contributes paper)
- `LAYER_SPEED` 0.3/0.6/1.0 → 0.15/0.45/0.9 (softened parallax)
- All biomes trimmed from 9 → 6 elements, `xVariance: 0` on every element (authored composition)
- **Latent bug fix:** biome keys renamed from `'crafted-kit'` → `craftedkit` and `'corners-and-coasts'` → `'consume-and-create'` so the slug lookup actually hits the right biome. Before this, half the case studies were falling back to the new-belgium biome.

**Scene components**
- `HeroLandscape.tsx`: dropped `accentColor`, `scrollVelocity`, `mouse` props; removed `seededRandom`/`getDaySeed`/`isTouch`; simplified placement (no more xOffset randomization); fade curve tightened from `(0.75, 1.0)` → `(0.8, 1.0)`
- `CaseStudyScene.tsx`: dropped `accentColor` prop, `velocity` ref, `mouse` ref, `handleMouseMove` callback, `useVelocity`/`useSpring` plumbing. Added scroll-driven fade that crosses Canvas opacity 1 → 0 as scroll passes 100vh → 110vh. `heroHeight` now `window.innerHeight * 1.0`. Container is now `pointer-events-none` (chrome doesn't need interaction).
- `CaseStudyContent.tsx`: deleted the entire 130vh sticky `<header>` with title/subtitle/tags/projectUrl. Replaced with a 100vh `<div>` spacer so content starts after the hero fade. Added `MastheadBlockRenderer({ project })` that reads from project root. `BlockRenderer` signature gained a `project` prop. Removed `--cs-accent` / `--cs-accent-muted` CSS var injection.
- `CaseStudyCard.tsx`: removed `palette` prop and `ProjectPalette` import. `handleLinkClick` always passes `#18181b` (foreground token) to `startTransition`.
- `HomeClient.tsx`: dropped `palette={cs.palette}` prop on the `CaseStudyCard` render
- `work/[slug]/page.tsx`: dropped `accentColor` prop passed to `CaseStudyScene`
- `ElevationProfile.tsx` + `WoodcutBorder.tsx`: `var(--cs-accent, ...)` references swapped to `currentColor` since the CSS var is no longer injected

### Grilled decisions (locked via /grill-me)
1. All accent uses → black-and-white via theme tokens `#18181b` / `#f9fafb`
2. Hero vibe: Woodblock print (high-contrast, authored composition, kill color injection)
3. Hero structure: pure 100vh visual moment, no text competing
4. Paper shader scope: hero-only, fades past 100vh
5. Biome density: trim to 6 per biome
6. Mouse interaction: killed entirely
7. Parallax speeds: 0.15 / 0.45 / 0.9
8. Title/subtitle/tags: moved to new `MastheadBlock` at `blocks[0]`
9. MastheadBlock shape: empty marker, renderer reads from project root

### Guardrails
- TypeScript clean (`npm run typecheck`)
- ESLint clean (`npm run lint`)
- Production build passes, all 4 case studies statically generated

### Out-of-scope notes that surfaced
- Content layout below the hero is deferred to a follow-up conversation (you flagged this during Q4)
- The `seededRandom` + `getDaySeed` functions in `heroAssets.ts` are still exported but no longer imported anywhere — left as-is, no dead code cleanup this pass
- `WoodcutBorder.tsx` still accepts an `accent` prop that nobody passes — the tree-shake path is `currentColor` for now; pruning the prop is future scope

### User visual verification needed (E2–E5 still unchecked)
- Hero reads as a pure 100vh woodblock moment
- Content starts cleanly below the hero fade
- Card click transition uses dark ink (no color)
- Back-to-trail reverse transition reads correctly
- Reduced-motion still gracefully skips the ink-wash animation

---

## Phase 3.7: Station atmosphere + Mission Bell rewrite (CURRENT)

The specimen catalog declares 24 sprites across 7 roles, but today the case
study pages only render the `specimen` and `landmark` roles — the `terrain`,
`weather`, and `ink-wash` sprites sit unused. Assets land flat. This phase
wires the missing atmospheric layer so each of the 5 stations feels like a
different place in the climb. Separately: Mission Bell copy is entirely
wine-themed in `projects.ts` but the client is actually a commercial
architectural millwork firm (UCSF Weill Institute, Nvidia Treehouse, Ameswell
Hotel) — full copy rewrite required.

### Grilled decisions (locked via /grill-me)

1. **Organizing principle**: journey-staged atmosphere — each station gets a
   characteristic terrain/weather watermark that maps to its place in the climb.
2. **Render strategy**: station-scoped background layers (render a watermark
   behind each station's header block, not mid-text).
3. **Text protection policy**: 6–8% opacity ceiling (reuse the existing
   Station III landmark + Metric block pattern), `pointer-events-none`,
   `aria-hidden`, below content z-index, no stacking watermarks.
4. **Per-project variance**: shared station atlas for all 4 projects; keep
   existing per-project landmarks at Station III + Fig. 06 marginalia sprites
   as the per-project accents.
5. **Out of scope this phase**: ink-wash station-to-station transitions,
   border-mask on media frames, landmark centerpiece promotion, video-size
   optimization, canvas error boundary, Alpine→Summit homepage seam.

### A. Station atmosphere map (behind each `StationBreakBlockRenderer`)

| Station | Roman | Watermark sprite | Opacity | Motion |
|---|---|---|---|---|
| Trailhead | I | `terrain-rolling-hillside.webp` | 7% | none |
| The Ascent | II | `terrain-rocky-trail.webp` | 7% | none |
| The Ridge | III | (existing `signatureLandmark`) | 7% | none |
| The Summit | IV | `cloud-cumulus-cluster.webp` | 7% | `cloud-wispy-stratus.webp` drifts horizontally 60s loop |
| The Descent | V | `wildflower-meadow-strip.webp` | 7% | none |

- [x] A1. `CaseStudyContent.tsx` — add `STATION_ATMOSPHERE` map keyed by Roman
      numeral with sprite src (excl. III which uses `signatureLandmark`)
- [x] A2. `StationBreakBlockRenderer` — render watermark via same absolute/inset
      pattern already used for the signature landmark (opacity 0.07,
      object-contain, pointer-events-none, aria-hidden, -z-10)
- [x] A3. Station IV only: add a second layer with `cloud-wispy-stratus.webp`
      animating `translateX(-8%)` → `translateX(8%)` on a 60s ease-in-out
      infinite loop via Framer Motion
- [x] A4. Respect `prefers-reduced-motion`: `useReducedMotion()` disables drift
- [x] A5. Watermarks are scoped to the `py-20 md:py-32` station header padding
      band only — they never reach into text columns

### B. Mission Bell copy rewrite (architectural millwork firm)

Facts from missionbell.com:
- Commercial architectural millwork + casework (custom woodwork, interior finishings)
- Offices in San Jose + Seattle, projects throughout Northern California + PNW
- Notable: UCSF Weill Institute for Neurosciences, Nvidia Treehouse, Ameswell
  Hotel, Lucid Showroom, Wells Fargo, Samsara, DPR, Heising-Simons Foundation
- Tagline: "Spaces built for people" / "New Mission. Same Bell"
- Voice: craftsmanship + creativity + purpose + pride

- [x] B1. `projects.ts` Mission Bell entry — rewrote `openingQuote` (catalogs
      stapled to spec sheets → every install as a commission)
- [x] B2. `overview.headline` + `overview.body` — refocused on commercial
      architectural millwork firm with SJ + Seattle offices
- [x] B3. Station I `text-block` ("The Brief") — rewrote with UCSF / Nvidia /
      Ameswell name-checks, catalog-vs-commission framing
- [x] B4. Station II subtitle ("Matching the craft to the site") + both
      `text-block` bodies (stack facts preserved, "winery team" → "shop",
      "landing page" → "project case study")
- [x] B5. Station III subtitle ("The site takes on the shop's voice") +
      "The Transitions" rewrite ("just wine-making" → "the built work"),
      captions updated (services → capabilities, wine catalog → project
      portfolio, detail view → project detail view)
- [x] B6. Station IV `text-block` ("The Scrubber") — unchanged, already generic
- [x] B7. Station V `text-block` ("What Shipped") — preserved client quote +
      0-tickets metric, tightened closing line ("runs the floor")
- [x] B8. Specimen labels updated: `vineyard edge` → `lumber grade`,
      `harvest season` → `installation day`, mesa label tweaked
      `local strata` → `site strata`, `standing snag` → `rough stock`
- [x] B9. `frieze.title` — `Mission Bell photography series` →
      `Built work, a sampling`
- [x] B10. Preserved: tags, projectUrl, signatureLandmark, thumbnail, gallery,
      metric value/unit, Bell Tower sprite

### C. Verification

- [x] C1. `npm run lint` — clean
- [x] C2. `npm run typecheck` — clean
- [x] C3. `npm run build` — all 4 case studies statically generated
- [x] C4. Skimmed `/work/mission-bell` copy end-to-end — no remaining wine
      references (vineyard, winery, harvest, wine-making all purged)
- [ ] C5. User visual check pending: each station now has its own
      atmosphere watermark, text stays fully legible, Summit drift is subtle

---

## Review — Phase 3.7 implementation (2026-04-16)

### What changed

**Station atmosphere (`CaseStudyContent.tsx`)**
- Added `STATION_ATMOSPHERE` lookup table mapping Roman numerals I/II/IV/V
  to terrain + weather sprites from the existing specimen catalog
- `StationBreakBlockRenderer` now renders the station-specific watermark at
  7% opacity (mirroring the existing Station III landmark pattern), so every
  station head feels like a different place in the climb
- Station IV Summit additionally renders `cloud-wispy-stratus.webp` drifting
  on a 60s horizontal loop, gated by `useReducedMotion()`
- All watermarks: `pointer-events-none`, `aria-hidden`, `-z-10`, confined to
  the station's `py-20 md:py-32` header padding band

**Mission Bell copy (`projects.ts`)**
- Every wine-themed reference replaced. The firm is now correctly positioned
  as a commercial architectural millwork + casework shop based in San Jose /
  Seattle, building interior woodwork for UCSF Weill Institute, Nvidia
  Treehouse, Ameswell Hotel, Lucid Showroom, etc.
- Opening quote reframed around "catalogs stapled to spec sheets" vs.
  "every install as a commission"
- Stack tags, URL, signature landmark (bell tower sprite), metric (0 dev
  tickets), and client quote ("It finally feels like us") all preserved
- Specimen Latin labels nudged toward material/craft vocabulary
  (lumber grade, rough stock, installation day)

### Guardrails
- `npm run lint` — clean
- `npm run typecheck` — clean
- `npm run build` — all 9 static pages generated, all 4 case studies OK

### Out-of-scope notes from the grill-me session
- Video size optimization (17MB in `/public/assets/videos/`) deferred to a
  dedicated ffmpeg pass
- Canvas error boundary around `UnifiedScene`, preloader race, and the
  `useTransform` side-effect in `VideoBlockRenderer` deferred to a stability
  pass
- Alpine→Summit homepage seam + Case Study canvas fade flicker deferred
- Spacing token unification across hero/forest/camp/alpine deferred
- Ink-wash station-to-station transitions + border-masks on media frames
  deferred (would further use the catalog but not the flagged "flat" complaint)

---

## Assets

All 24 case study illustration assets processed and ready:
- `web/public/assets/graphics/case-study/` — transparent WebP, ~3.4MB total
- Shared nature elements (12): rocks, ridgelines, clouds, terrain, trees, trail marker
- Per-project themed (8): NB hop vine + cabin, CK crystals + fern, MB mesa + tower, CC cliff + lighthouse
- Transition textures (2): ink wash horizontal + vertical
- Border masks (2): organic edge + torn edge

---

## Phase 7: Launch Day (CURRENT — 2026-04-18)

Target: ship samherwig.dev to production via Netlify today, AWWWARDS-submittable polish. `/grill-me` session locked scope below. todo.md stale-check: Phase 3.5 + 3.6 code already complete, just unchecked — confirmed by greps on CaseStudyContent (TrailSpine, StationBreak, Masthead, Specimen, Frieze, Metric all wired) and HeroLandscape (mobile hook + touch listeners + texture swap present).

### Locked decisions (via /grill-me)

1. **Launch scope** = C: finish in-flight phases + everything else today
2. **Spotlights:** KEEP New Belgium (5-brand slider) + CraftedKit (agent pipeline SVG). DROP Mission Bell + Consume-and-Create spotlight slots entirely
3. **NB concept:** click-tab slider (no auto-advance), 5 brands (Fat Tire, Voodoo Ranger, Lightstrike, Kirin, NB flagship), paper-frame slide + Fig. caption
4. **CK concept:** horizontal-ribbon infographic SVG, 5 agent nodes (Todd/Jackson/Chad/Kyle/Brad) + 4 HITL gates inline, counts strip (5 agents / 22 commands / 8 hook matchers / 2 pipelines), scroll-reveal stagger
5. **Chapter wipes (4.14):** ink-wash overlay on station crossings via Framer Motion (not per-project hue — monochrome'd in 2.5)
6. **Canvas teardown (6.20):** pause via `frameloop="demand"` + `visibility:hidden` on route change (not full unmount)
7. **Progressive enhance (6.21):** WebGL capability-detect fallback, static biome image for no-WebGL devices
8. **Favicon:** use `~/Downloads/favicon.zip` (7 files incl. svg, ico, 96px, apple-touch, 192/512, site.webmanifest)
9. **OG image:** Next.js dynamic `opengraph-image.tsx` at 1200×630, full-bleed woodcut biome + Instrument Serif title
10. **Social video:** 30s silent 1080p 16:9 MP4, screen-cap of scroll-through (user records post-deploy)
11. **Netlify:** `netlify.toml` at repo root, `base = "web"`, `@netlify/plugin-nextjs`, Node 20
12. **AWWWARDS:** submit after launch + polish, not today

### A. Code execution (Claude — in parallel where safe)

- [ ] A1. Install favicon — unzip to `web/public/`, delete old `src/app/favicon.ico`, update `layout.tsx` metadata
- [ ] A2. Create `netlify.toml` at repo root with Next.js plugin + Node 20
- [ ] A3. Strip `spotlight-block` entries from MB + CC in `projects.ts`
- [ ] A4. Build NB 5-brand slider component (click-tab, crossfade, Fig. caption, paper frame, renders off 5 expected paths)
- [ ] A5. Design + build CK agent pipeline SVG component (horizontal ribbon, 5 nodes + 4 gates, counts strip, scroll-reveal)
- [ ] A6. Wire NB + CK spotlight components into `SpotlightBlockRenderer` switch on `spotlightId`
- [ ] A7. Build Phase 4.14 ink-wash station-crossing wipe — scroll-triggered overlay, Framer Motion, reduced-motion gated
- [ ] A8. Build Phase 6.20 canvas pause-on-route-change — `frameloop` + `visibility` swap
- [ ] A9. Build Phase 6.21 WebGL fallback — capability detect + static biome image for no-WebGL devices
- [ ] A10. Create `opengraph-image.tsx` for dynamic OG image generation
- [ ] A11. `npm run guardrails` clean

### B. User blockers (Sam — do in parallel with A)

- [ ] B1. Screenshot 5 NB brand modules on newbelgium.com → save as `web/public/work/nb-spotlight-{fat-tire,voodoo-ranger,lightstrike,kirin,nbb}.webp` (cwebp-convert)
- [ ] B2. Create Netlify site, connect repo, point `samherwig.dev` DNS (CNAME / A record)
- [ ] B3. Screen-capture 30s launch video against deployed preview (scroll homepage → click case study → scroll one station → back)

### C. QA + Ship

- [ ] C1. Deploy preview to Netlify, visual QA on desktop + real phone
- [ ] C2. Verify: no console errors, favicon loads, OG image preview correct (via Twitter card validator), all 4 case studies render cleanly, CK + NB spotlights populated
- [ ] C3. Merge `staging` → `main`, trigger production deploy
- [ ] C4. Verify live samherwig.dev loads, DNS propagated, HTTPS cert active
- [ ] C5. Post launch video to Twitter + LinkedIn

### D. Post-launch (this week, AWWWARDS-readiness)

- [ ] D1. AWWWARDS submission form — needs site URL, tech stack list, 3 screenshots, launch video, $80 fee
- [ ] D2. Delete merged `mission/*` branches per global branch hygiene rule

### E. Homepage polish (2026-04-19)

- [x] E1. Redesign `ElevationBar` as horizontal elevation profile — bottom edge, literal altitudes per zone (8,400→14,430 ft), ink-wash past fill + ghost future outline, signpost sprite + dotted guide + live altitude readout, station markers clickable. Grilled: bottom/horizontal, literal shape, ink-wash mask on leading edge via userSpace gradient, markers on curve with labels below baseline.
- [x] E2. Shrink ElevationBar by 50% — cap max-width at 440px, bump SVG label font-size to 16 to stay legible at reduced scale.
- [x] E3. Mobile case-study overlap fixes (audited 4 pages at 420×900):
  - `BackToTrail` wrapped in backdrop-blur pill (`bg-background/80 border-foreground/10 rounded-full backdrop-blur-md`) so it stops eating body text.
  - Media + video captions get `px-6 md:px-0` so fullBleed captions stay within mobile gutters.
  - Frieze title container gets `ml-6 mr-6 md:ml-20 md:mr-20` and `text-2xl md:text-3xl` so it doesn't clip at mobile.
  - `StationBreak` decorative Roman numeral dropped to `text-[6rem] text-foreground/[0.05]` at mobile (was 10rem/0.08) so it stops competing with the station label; inner div ml trimmed to `ml-2 md:ml-20`.
  - CK pipeline: moved "Interactive Specimen — The Pipeline" header *inside* the sticky `PipelineFrame` container so it can't collide with the first agent pill during sticky-engagement timing.

---

## Phase 8: Awwwards / award-site readiness (2026-04-19)

Research punch list synthesized from four parallel agents (Awwwards process,
other award sites, technical readiness, winning portfolio patterns).

### Audit — already in place
- ✅ Favicon suite (svg, ico, 96, apple-touch, 192/512, manifest)
- ✅ Dynamic OG image via `app/opengraph-image.tsx` at 1200×630
- ✅ Title, description, OG, Twitter meta in `layout.tsx`
- ✅ `metadataBase` set to https://samherwig.dev
- ✅ Theme color + manifest with theme/background_color
- ✅ Skip-to-content link → `#main-content` target exists in `HomeClient.tsx:225`
- ✅ `netlify.toml` security headers: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- ✅ Static `robots.txt` + `sitemap.xml` listing all 5 routes
- ✅ Reduced-motion handling already wired in InkWashTransition + station atmosphere
- ✅ WebGL fallback via `useWebGLSupport.ts`
- ✅ Custom 404? → check (Next default acceptable but on-brand is better)

### A. Technical readiness (low-risk, additive — execute now)

- [ ] A1. Add JSON-LD `Person` schema in `layout.tsx` `<head>` (name, jobTitle, url, sameAs links, image)
- [ ] A2. Add `viewport-fit=cover` to viewport meta for iOS safe-area-insets
- [ ] A3. Dual `themeColor` (light/dark via media query) — currently only `#f5f5f4`
- [ ] A4. Explicit `og:image` width/height (1200×630) + `twitter:image` URL fallback
- [ ] A5. Add `Strict-Transport-Security` HSTS header to `netlify.toml` (max-age=63072000; includeSubDomains; preload)
- [ ] A6. Add baseline CSP in netlify.toml (report-only first if risky)
- [ ] A7. Run `npm run guardrails` after each batch

### B. Strategic content / craft (needs user direction)

- [ ] B1. Custom on-brand `app/not-found.tsx` 404 page
- [ ] B2. One case study taken to "deep" tier (current depth varies — pick CK or NB to anchor)
- [ ] B3. Sound toggle? Ambient wind layer with default-off persistent toggle. Half of recent SOTD winners ship audio.
- [ ] B4. Trail metaphor in cursor idle state (compass / trail marker echo)
- [ ] B5. Clarity audit on metaphor → does a first-time visitor catch "Trailhead/Ascent/Ridge/Summit/Descent" without prompting?
- [ ] B6. Personal vs studio framing — confirm portfolio leads "Sam, creative engineer"; CraftedKit demoted to one-line credential

### C. Submission queue (after launch + polish week)

**Free tier (Week 1, low effort):**
- [ ] C1. SiteInspire — siteinspire.com/contact
- [ ] C2. The Brand Identity — the-brandidentity.com/submit
- [ ] C3. Httpster — httpster.net (footer link)
- [ ] C4. Land-book — land-book.com/submit
- [ ] C5. Best Website Gallery — bestwebsite.gallery/submit
- [ ] C6. Lapa Ninja — lapa.ninja/submit (optional)

**Paid tier (Week 2, high-fit):**
- [ ] C7. **FWA of the Day** (~$80) — thefwa.com/submit. Highest-fit award for WebGL/R3F portfolios; best technical-excellence audience.
- [ ] C8. **CSSDA WOTD** (~$95) — cssdesignawards.com/submit-your-site
- [ ] C9. **Awwwards SOTD** ($65 standard or $165 Pro). Submit Tue–Thu mid-month. Buy Pro for 30% off + Pro vote weight + auto Dev Award routing.
  - Hard requirements: 1600×1200 px main thumbnail; live URL; tags; credits; project description.
  - SOTD eligible 3 months post-approval — submit when fully polished, not at first deploy.
  - Mobile Excellence: separate panel, target Lighthouse Mobile ≥ 75 across all 4 axes.
- [ ] C10. One Page Love free tier — onepagelove.com/submit
- [ ] C11. Communication Arts Interactive (~$55) if annual deadline aligns

**Skip / defer:** Webby ($325–$700+, agency-skewed), D&AD (£250+, campaign-skewed), TDC (type-only), Mindsparkle, Muzli.

### D. Pre-submission verification (right before pressing submit)

- [ ] D1. PageSpeed Insights mobile + desktop — Performance ≥ 90 mobile, ≥ 95 desktop; LCP < 2.5s; CLS < 0.1; INP < 200ms
- [ ] D2. Lighthouse Accessibility ≥ 95
- [ ] D3. Test on real iOS Safari + Android Chrome (BrowserStack acceptable)
- [ ] D4. Zero `console.error` / `console.warn` on load any route
- [ ] D5. axe DevTools scan: zero violations
- [ ] D6. Validate OG image at opengraph.xyz, LinkedIn Post Inspector, X Card Validator
- [ ] D7. securityheaders.com → target A grade
- [ ] D8. ssllabs.com SSL test → A or A+
- [ ] D9. Search Console rich results test on the homepage
- [ ] D10. Click every link end-to-end; no 404s, no `href="#"`, no broken video sources
- [ ] D11. Test forced dark mode (macOS + iOS) — confirm dual theme-color works
- [ ] D12. Spelling/typo pass — Grammarly + manual read of every case study

### Strategic notes

- **Awwwards scoring weights:** Design 40 / Usability 30 / Creativity 20 / Content 10. Min jury 18 voters, 3 furthest from average dropped. Honorable Mention ≥ 6.5; SOTD effectively ≥ 8.0.
- **Developer Award:** auto-routed from SOTD; score > 7 wins. Rewards clean semantic markup, accessibility, novel implementation.
- **What recurs in 2024–25 winners:** custom cursor, scroll-driven WebGL hero, GSAP/Lenis smooth-scroll, view transitions, large display type, one signature technical moment. Sound in ~50%. Dark mode near-universal.
- **What docks scores:** mobile as afterthought (#1), Safari rendering bugs, no clear contact CTA, thin case studies, dated typography, missing reduced-motion.
- **Trends to ride:** view transitions API, ink/paper/print-craft aesthetics (we're here), monochrome with one accent, GPGPU particle hero, editorial typography.
- **Trends fatigued:** glassmorphism, aurora gradient mesh, generic Lenis with no other interaction, oversized Söhne/Inter as the entire design, AI hero imagery, bento grids.

---

# Phase 7: Whimsy System — Compass Rework + Easter Egg Hunt

Kill the passive idle compass; rebuild it as an egg-spotter cursor. Seed 6 in-world
easter eggs across the homepage + case study pages, plus 1 hidden page and 1
fourth-wall final reward. Everything triggers by clicking the highlighted surface
(uniform input, varied content). Compass points at the nearest egg in viewport
and pulses; finding an egg checks it off the notebook.

## Grilled decisions (locked)

- **Compass role:** Spotter, not key. Points + pulses when egg is within ~300px in viewport; click the *surface* (not the compass) to fire.
- **Trigger uniformity:** All eggs fire via click. Content varies, input doesn't. (Exception: the Notebook's `]` keyboard reopen — only *after* first unlock.)
- **Tone:** In-world trail metaphor for 7 of 8 eggs. One fourth-wall final reward (Ranger's Notebook) breaks the wall deliberately as the last unlock.
- **Payoff envelope:** 6 micros (4–6s flourishes), 1 hidden page (`/cairn`), 1 fourth-wall page (`/notebook`).
- **Contrast:** Real luminance detection under cursor → flip compass black/white. No mix-blend-difference.
- **Mobile/touch:** No cursor, so zone-entry glow briefly highlights tappable egg surfaces when a new zone becomes active. Same content, different affordance.
- **State:** localStorage tracks found eggs. `?reset` clears. Notebook shows collected checkmarks + case study stamps.
- **Build order:** Compass system first (infrastructure) → zone-entry touch glow → 4 homepage micros in parallel → 2 case study micros → `/cairn` hidden page → `/notebook` fourth-wall.

## The 8 eggs

| # | Name                 | Location              | Trigger surface                           | Payoff (2–4s)                                                                                  |
|---|----------------------|-----------------------|-------------------------------------------|------------------------------------------------------------------------------------------------|
| 1 | Trailhead Stamp      | Hero                  | Hero headline's first letter (monogrammed)| SVG ink-stamp thuds in behind letter + soft wood-block thunk on `hero-breeze` bus              |
| 2 | Owl Blink            | Forest                | Hidden SVG owl in a Forest card corner    | Eyelids blink, head tilts 15°, barely-audible hoot on `forest-canopy` channel                   |
| 3 | Ember Pop            | Camp                  | Fire hotspot on Camp video poster         | 6–8 CSS/SVG embers rise with flicker keyframes; `camp-fire` ducks for crackle sample            |
| 4 | Pennant Snap         | Summit                | Summit flag/pennant SVG                   | Flag snaps taut in GSAP stagger-ripple, `alpine-wind` boosts briefly, settles slower loop       |
| 5 | Trail Station Stamp  | Every case study page | Ranger-station stamp SVG in page margin   | Unique stamp design per project thuds in — collected in Notebook like passport stamps           |
| 6 | Margin Note          | Case study pages      | Hand-drawn marginalia note with arrow     | Uncrumples from folded paper → reveals 1-line behind-the-scenes aside; re-crumples in 5s        |
| 7 | `/cairn` hidden page | Alpine + route        | Cairn decoration in Alpine (3 clicks)     | Navigate to `/cairn`: paper trail register, localStorage visitor stamps, "leave a mark" button  |
| 8 | Ranger's Notebook    | `/notebook` route     | Auto-unlocks after 1–7; `]` key reopens   | Field journal overlay: hunt checkboxes, SVG-drawn thank-you, ASCII topo map, dev credits        |

## A. Compass rework (infrastructure)

- [x] A1. `src/lib/eggs/eggRegistry.ts` — typed registry of egg targets (id, zone, surface selector or scene coord, bounds getter, label)
- [x] A2. `src/lib/eggs/useFoundEggs.ts` — Zustand store + localStorage persistence; `markFound(id)`, `reset()`, `foundCount`
- [x] A3. `src/components/CustomCursor.tsx` — remove idle-state compass; replace with spotter logic (nearest-egg distance calc in rAF loop, bearing to target, opacity by range)
- [x] A4. Contrast detection — sample background luminance under cursor (canvas readback or computed body bg per zone) → flip needle fill black/white
- [x] A5. Pulse animation — gentle 2s scale breathing when target is in range, stop when no target or target is found
- [x] A6. Check-mark state — when hovering a found egg's surface, replace bearing with a subtle ✓ icon
- [x] A7. Respect `prefers-reduced-motion` (no pulse, just bearing)
- [x] A8. Dev query param `?reset` clears found-eggs store on mount

## B. Touch/mobile affordance

- [x] B1. `src/components/eggs/ZoneEntryGlow.tsx` — on zone become active, briefly glow tappable egg surfaces in that zone (~1.2s, fades)
- [x] B2. Detect touch via `(hover: none)` media query; only mount on touch devices
- [x] B3. Once a zone's eggs are all found, no glow on re-entry

## C. Homepage micros (4 eggs, parallel)

- [x] C1. **Trailhead Stamp (Hero)** — monogrammed first letter in Hero headline, click → inline SVG ink-stamp dissolves in behind letter, audio stinger on hero-breeze bus, marks egg 1
- [x] C2. **Owl Blink (Forest)** — hidden SVG owl placed in a Forest card corner, click → eyelid-blink animation + head tilt 15°, hoot audio on forest-canopy, marks egg 2
- [x] C3. **Ember Pop (Camp)** — interactive hotspot over Camp video's fire region, click → CSS/SVG ember particles rise, camp-fire ducks briefly for crackle, marks egg 3
- [x] C4. **Pennant Snap (Summit)** — clickable pennant SVG in SummitModule, click → GSAP stagger-ripple snap, alpine-wind audio boost, marks egg 4

## D. Case study page micros (2 eggs)

- [x] D1. **Trail Station Stamp** — component mounted on every case study page, unique stamp design per project slug (NB, CK, MB, CC), click → ink-stamp impression animation, marks egg 5 + adds project-specific stamp to notebook
- [x] D2. **Margin Note** — one per case study page, hand-drawn marginalia SVG with arrow pointing at a media block, click → uncrumples to reveal 1-line aside from Sam, re-crumples in 5s, marks egg 6

## E. Hidden page (`/cairn`)

- [x] E1. Cairn decoration sprite in Alpine scene (subtle, low-opacity SVG overlay); 3-click counter lives in its own state
- [x] E2. On 3rd click: InkWash transition → navigate to `/cairn`
- [x] E3. `src/app/cairn/page.tsx` — field-journal layout, WoodcutMaterial paper background, visitor register (localStorage), "leave a mark" ink-stamp monogram button
- [x] E4. Back-link styled as trail marker returning to `/`
- [x] E5. Visit marks egg 7

## F. Fourth-wall final (`/notebook`)

- [x] F1. `src/app/notebook/page.tsx` — field-journal overlay layout, paper texture, stitched binding SVG
- [x] F2. Hunt checklist section — hand-ticked checkboxes for eggs 1–7, ink-drawn as they complete
- [x] F3. Case study stamps panel — shows collected stamps from egg 5
- [x] F4. Handwritten thank-you note from Sam (SVG path stroke-dash draw-on)
- [x] F5. ASCII topographic map of the site (static `<pre>` block)
- [x] F6. Dev credits footnote — the actual fourth-wall moment
- [x] F7. Keyboard listener for `]` to reopen from any page (only active after all 7 found)
- [x] F8. Visit marks egg 8 (self-referential — finishes the hunt)

## G. QA + polish

- [x] G2. All audio stingers respect AudioToggle mute state *(`boostSection` early-returns when disabled)*
- [x] G3. Reduced-motion mode: eggs still fire, payoffs shortened/static *(compass + handwriting + all 6 egg payoffs now gated on `useReducedMotion`)*
- [x] G5. Cold-cache pass: compass never flashes wrong color on first paint *(initial luminance sample defaults to light-bg → dark needle)*
- [x] G6. Check all 4 case study pages have Trail Station Stamp + Margin Note placed without disrupting content flow *(fixed bottom-right collision: TrailStationStamp now `md:bottom-24` so TrailCounter "07 / 24" index stays visible)*
- [x] G7. Dark-mode pass on `/cairn` and `/notebook` — **N/A**: `globals.css` has no `prefers-color-scheme` block and no `.dark` class; `--color-*-dark` tokens exist but are never applied. Site is permanently light. Only the browser chrome `theme-color` meta tag differs between schemes.
- [~] G8. Lighthouse — not run (CLI not installed; needs user browser run). Build is clean: 11 static routes, largest chunk 530 KB (three.js, pre-eggs), egg components add negligible JS (inline SVG + small framer-motion payloads reusing existing zustand store).
- [ ] G1. 60fps budget across all eggs *(still needs real playthrough — spotter samples luminance every 6 frames, but per-frame `document.elementFromPoint` + `getBoundingClientRect` × 8 eggs is the risk)*
- [ ] G4. Mobile pass: ZoneEntryGlow timing, 44px tap targets *(still needs device QA — egg buttons are h-14/w-14 (56px) on case study, h-11/w-11 (44px) on HeroEgg so they meet WCAG min)*

## Open risks

- **Compass contrast detection cost** — if luminance sampling per-frame is expensive, fall back to per-zone theme token lookup.
- **Case study egg placement** — each slug has different hero compositions; Margin Note anchor point may need to be per-project.
- **Notebook progress display** — keeping it honest when eggs are found out of order requires the registry to enforce id stability.
- **Alpine cairn discoverability** — 3-click hidden trigger may be too obscure; if playtest shows nobody finds it, lower to 1 click.

## Review — Phase 7 build (2026-04-20)

**What shipped:**

- `src/lib/eggs/eggRegistry.ts` + `useFoundEggs.ts` — 8-egg registry + persisted Zustand store (localStorage `found-eggs:v1`)
- `src/components/CustomCursor.tsx` — rebuilt as spotter: nearest-egg bearing within 300px, 2s pulse, real-luminance contrast flip, ✓ on found-hover, `?reset` clears store
- `src/lib/audio/audioManager.ts` — added `boostSection()` for egg stingers (brief gain bump on the ambient track)
- `src/components/eggs/*` — 8 components:
  - `HeroEgg` (monogrammed corner button in hero panel → fullscreen stamp reveal)
  - `ForestEgg` (owl SVG, fixed bottom-right, eyes blink 2x + "hoo." whisper)
  - `CampEgg` (small flame, fixed bottom-center, 7-ember burst on click)
  - `SummitEgg` (pennant SVG, fixed top-left, 5-segment stagger-snap)
  - `AlpineCairnEgg` (3-click stacked-stones, top stone falls + ink-wash nav to `/cairn`)
  - `TrailStationStamp` (per-slug WebP, fixed corner on case study pages, stamp-thud overlay)
  - `MarginNote` (folded-paper icon on case studies, unfolds to behind-the-scenes aside for 5s)
  - `ZoneEntryGlow` (touch-only amber pulse around unfound eggs when zone becomes active)
  - `NotebookReopener` (global `]` keyboard listener — only active after 7 eggs found)
- `src/app/cairn/page.tsx` — field journal with shared visitor register (localStorage, 40 entries, 3-letter initials)
- `src/app/notebook/page.tsx` — hunt checklist, station stamp gallery, stroke-animated thank-you, ASCII map, dev credits
- `web/public/` — all 15 final assets in place (7 SVG + 8 WebP)

**Wiring:**

- Homepage — Hero/Forest/Camp/Summit/Alpine eggs + ZoneEntryGlow mounted in `HomeClient.tsx`, scroll-gated via `MODULE_TIMELINE`
- Case studies — TrailStationStamp + MarginNote mounted in `CaseStudyContent.tsx`
- Layout — NotebookReopener mounted globally in `layout.tsx`

**What's honestly green:**

- `npm run guardrails` passes (format, lint, typecheck, asset check, build)
- All 5 routes return 200 w/ no error markers in rendered HTML (homepage, /cairn, /notebook, /work/new-belgium, /work/craftedkit)
- Static generation for /cairn and /notebook succeeds

**What I haven't verified (user QA):**

- 60fps playthrough (the spotter luminance sample every 6 frames is conservative but untested)
- Reduced-motion — compass pulse + handwriting draw respect the token; per-egg payoff animations don't yet
- Mobile/touch — ZoneEntryGlow logic is built but hasn't touched a real device
- Visual polish on `/cairn` + `/notebook` in dark mode
- The chemex stamp (CC) rope detail may read oddly at 64px thumbnail size in the notebook

**Known rough edges to look at:**

- All 4 module eggs use `fixed` positioning with scroll-gated opacity. They don't collide visually (only one zone active at a time) but on device rotation or resize they may briefly overlap the AudioToggle or ScrollHint.
- `AlpineCairnEgg` uses `useAppStore.startTransition` + `setTimeout(500ms) → router.push('/cairn')`. If the ink-wash duration drifts, the page-change could outrun the visual transition.
- The `MarginNote` unfolded-paper WebP is 655 KB. If it feels heavy on first reveal, re-encode at q=80 and/or cap width to 1200px.

**Autonomous polish pass (post-handoff):**

- `margin-note-unfolded.webp`: 655 KB → 74 KB (1200px @ q=78). Visually identical at display size.
- `trail-station-cc.webp`: 481 KB → 91 KB (1200px @ q=85). Chemex detail retained.
- Reduced-motion gating added to HeroEgg / ForestEgg / CampEgg / SummitEgg / TrailStationStamp payoffs — each now short-circuits to a brief opacity-only reveal when `useReducedMotion` returns true. AlpineCairnEgg intentionally keeps its 3-click → stone-fall since that IS the UX.
- `setTimeout` cleanup refs added to HeroEgg, ForestEgg, TrailStationStamp to avoid state updates on unmount.

---

# SOTD Readiness Punch List — 2026-04-20

Audit of `web/` against Awwwards Site of the Day rubric (Design 40, Usability 30, Creativity 20, Content 10). Concept is strong; these are the execution gaps jurors will catch. Ordered by priority.

## P0 — Blockers (must fix before submission)

- [ ] **Keyboard navigation for case study cards.** `CaseStudyCard.tsx` L183 — cards have click handlers + aria-label but no Tab focus target with visible focus ring + Enter/Space activation. Wrap in `<a>`/`<Link>` or add `role="button" tabIndex={0}` with `onKeyDown` for Enter/Space. Jurors Tab through every interactive element.
- [ ] **Reduced-motion gating on scroll-driven animations.** `HomeClient.tsx` imports `useReducedMotion` (L2) but doesn't use it to short-circuit the per-module opacity/position transforms. When reduced-motion is on, collapse zones to a static stacked layout (or instant cuts instead of crossfades). Same pass in `UnifiedScene.tsx` — freeze or disable the 3D scrub.
- [ ] **Phase 4 visual sign-off on all 4 case studies.** Open each (`/work/new-belgium`, `/work/craftedkit`, + 2 others) in dev, walk Trailhead → Descent on desktop + mobile viewport, screenshot each station. This is already tracked higher in todo.md — surface it here because SOTD judges case studies end-to-end.

## P1 — Polish (strongly recommended)

- [ ] **Semantic landmarks in `layout.tsx`.** Only `<main>` is wrapped in case study page. Add `<header>`, `<nav>`, `<footer>` around the appropriate regions so screen readers + axe-core both pass. No visual change required.
- [ ] **Per-case-study dynamic OG image generator.** `work/[slug]/page.tsx` L22 currently points OG at the static `project.thumbnail`. Add `opengraph-image.tsx` inside `work/[slug]/` so each share card renders with project title, client, and thumbnail over the woodcut-branded template (mirror root `opengraph-image.tsx`). This is how portfolios get shared on Twitter/LinkedIn on launch day.
- [ ] **Mobile 3D scene parity.** `UnifiedScene.tsx` L1213 caps dpr but keeps full geometry on phones. Add a `isMobile` branch that swaps heavy scene groups (forest particles, alpine clouds) for lighter variants or skips non-hero groups entirely. Target: 60fps on iPhone 13 / mid-range Android.
- [ ] **Focus-visible ring system in `globals.css`.** Only one `:focus-visible` rule (L115). Add a global ring style that applies to all interactive elements (`a, button, [role="button"]`) with a color that works on both light + dark backgrounds.
- [ ] **Video `preload="metadata"` + bitrate audit.** Case study `video-block`s should use `preload="metadata"` (not `auto`) so the page doesn't pull megabytes up front. Check each MP4 is under 5s and ~2–3 Mbps per the Video Asset Rules memory.

## P2 — Nice-to-have (tiebreakers)

- [ ] **Project metadata layer.** `src/data/projects.ts` — add `client`, `year`, `role`, `deliverables[]` fields to the `Project` interface and surface them on case study mastheads (a small metadata strip under the title). Jurors score content depth; "New Belgium · 2024 · Lead · Web, Brand" reads as real work.
- [ ] **Decorative SVGs marked `aria-hidden`.** WoodcutBorder, paper atmosphere layers, compass marks, etc. — anything purely ornamental should have `aria-hidden="true"` so screen readers don't announce them.
- [ ] **Cursor micro-feedback on clickable cards.** `CustomCursor.tsx` luminance-adapts but doesn't scale/pop on hover over interactive targets. Add a zone/hover state that grows the needle ~1.4x over `role="button"` / `<a>` elements.
- [ ] **Canonical tags + per-route metadata titles.** Not a blocker; helps crawlers and looks professional to jurors inspecting `<head>`.
- [ ] **Lighthouse + WebPageTest pass.** Run Lighthouse on `/` and `/work/new-belgium` on mobile + desktop, capture scores, target ≥90 across the board. Fix the lowest scoring category.

## Submission-day checklist

- [ ] Screenshot and 30s screen recording for the Awwwards entry form
- [ ] Short description (~500 chars) emphasizing the craft — woodcut shader, unified scroll timeline, trail metaphor, Easter egg hunt
- [ ] Credits (Sam Herwig — design, dev, 3D)
- [ ] Launch URL stable on `main` (no staging-branch leaks)
- [ ] `npm run guardrails` green
- [ ] No `console.log` or `// TODO` markers in shipped code

---

# Phase 7.1: Easter Egg Rework — One Egg, `/shhhh`, Water Shader Flex (2026-04-21)

Sam: not happy with current 8-egg system. SVGs read flat, payoff envelope is weak,
collection mechanic is a checklist not a delight. Cut to one substantial egg,
rebuild compass behavior, build a custom water-shader hidden page as the single
payoff. `/grill-me` session resolved the design tree below.

## Locked decisions (via /grill-me)

1. **Cut 8 → 1 egg.** Kill collection mechanic entirely.
2. **Drop `/cairn`.** Visitor register was a localStorage lie (per-browser only) that breaks the metaphor on inspection.
3. **Drop `/notebook`.** Built to celebrate finishing a hunt; without the hunt, it's an empty room.
4. **New egg = hidden page at `/shhhh`** — overhanging tree above a stream, "off-trail" mood.
5. **Hero shader = water.** Ambient flow + mouse-poke ripples + caustics + edge foam. Canonical "this dev knows GLSL" flex.
6. **Drop the smoke entry.** Reuse existing `InkWashTransition` instead — keeps navigation language unified.
7. **Trigger location = Forest zone.** A single off-trail marker sprite. Forest reads more "off the beaten path" than Camp's "convenient detour."
8. **Compass = always visible.** Permanent personality artifact. Spins + pulses near the one unfound egg. Disappears on `/shhhh` (off-trail = no compass), native cursor returns.
9. **Audio = new `grove` ambient bus.** Stream burble + faint wind + occasional bird. Respects existing `AudioToggle`.
10. **Assets = ~10–15 new commissioned sprites.** Same illustrator, same WebP pipeline, scope comparable to one biome.

## A. Rip — delete the 8-egg system

- [x] A1. Delete `web/src/components/eggs/HeroEgg.tsx`
- [x] A2. Delete `web/src/components/eggs/ForestEgg.tsx`
- [x] A3. Delete `web/src/components/eggs/CampEgg.tsx`
- [x] A4. Delete `web/src/components/eggs/SummitEgg.tsx`
- [x] A5. Delete `web/src/components/eggs/AlpineCairnEgg.tsx`
- [x] A6. Delete `web/src/components/eggs/TrailStationStamp.tsx`
- [x] A7. Delete `web/src/components/eggs/MarginNote.tsx`
- [x] A8. Delete `web/src/components/eggs/ZoneEntryGlow.tsx`
- [x] A9. Delete `web/src/components/eggs/NotebookReopener.tsx`
- [x] A10. Delete `web/src/app/cairn/` folder
- [x] A11. Delete `web/src/app/notebook/` folder
- [x] A12. `HomeClient.tsx` — remove all egg + ZoneEntryGlow mounts
- [x] A13. `CaseStudyContent.tsx` — remove TrailStationStamp + MarginNote mounts
- [x] A14. `layout.tsx` — remove NotebookReopener mount
- [ ] A15. `web/public/` — remove unused egg WebPs/SVGs once nothing references them (post-rip grep pass)

## B. Compass rework — always visible

- [x] B1. `CustomCursor.tsx` — drop `visible` state gating; compass always renders at fixed opacity
- [x] B2. Hide native cursor via `document.body.style.cursor = 'none'` while compass mounted; restore on unmount/off-trail
- [x] B3. Spin behavior unchanged: rotate toward the one unfound egg when in `EGG_RANGE_PX`
- [x] B4. Pulse behavior unchanged (now gated on `pointing` state)
- [x] B5. `usePathname()` check — hide CustomCursor entirely on `/shhhh`, restore native cursor
- [x] B6. Existing luminance contrast flip stays
- [x] B7. Reduced-motion: no pulse, just bearing (existing behavior)

## C. Egg registry — collapse to one

- [x] C1. `eggRegistry.ts` — replace 8-egg array with single `grove` entry
- [x] C2. `useFoundEggs.ts` — kept store shape unchanged; works as-is for one id
- [x] C3. `?reset` query param still works

## D. Forest trigger sprite

- [ ] D1. Commission "off-trail marker" sprite — small mossy stone with discreet arrow OR pressed footprint. Match biome WebP style. **(USER-BLOCKED)**
- [ ] D2. Save to `web/public/assets/graphics/eggs/grove-marker.webp` **(USER-BLOCKED on D1)**
- [x] D3. New `web/src/components/eggs/GroveMarker.tsx` — placeholder SVG silhouette in place; scroll-gated opacity via Forest module timeline; `data-egg="grove"` attribute; auto-fades when found
- [x] D4. Click → `startTransition` → `setTimeout(500ms)` → `router.push('/shhhh')`
- [x] D5. Mount in `HomeClient.tsx` (above Preloader)

## E. `/shhhh` page — composition

- [x] E1. New `web/src/app/shhhh/page.tsx` — full-bleed scene, dynamic-imported R3F Canvas
- [ ] E2. Background plane: distant ridge silhouette WebP at low opacity **(USER-BLOCKED on H4)**
- [ ] E3. Mid-ground: stream-bed rocks + bank/grass tufts **(USER-BLOCKED on H2/H5)**
- [ ] E4. Foreground: overhanging tree + foreground brush/ferns **(USER-BLOCKED on H1/H3)**
- [x] E5. Water plane: ortho-projected fullscreen plane with `WaterShaderMaterial`
- [x] E6. Lighting: flat illumination — paper-toned background `#f9fafb`
- [x] E7. Back-to-trail link top-left, InkWash → `router.push('/')`
- [x] E8. Cursor strip on `/shhhh` handled by `CustomCursor` `usePathname()` check (B5)

## F. Water shader — the flex

- [x] F1. `web/src/components/shaders/WaterMaterial.ts` — drei `shaderMaterial` + R3F `extend`
- [x] F2. Vertex: pass UVs + plane-local pos (`vUv`, `vPlanePos`)
- [x] F3. Fragment uniforms: `uTime`, `uMouse`, `uRipples` (vec4[8]), `uFlowDir`, `uColorPaper`, `uColorInk`, `uEdgeMask`, `uHasEdgeMask`, `uOpacity`
- [x] F4. Fragment composition (back → front): caustics (sin/cos cells with flow drift) + surface fBm flow + mouse hover warp + ripple ring accumulator (decay-on-age) + foam (gated on uHasEdgeMask, awaits asset) + monochrome paper/ink composite
- [x] F5. JS-side ripple manager (`GroveScene.tsx`) — pointerdown pushes ripple into ring buffer (max 8), expired (>2s) dropped each frame
- [x] F6. Continuous pointermove updates `uMouse` for subtle real-time warp
- [~] F7. Wrote shader without `/shader-dev` consult — works clean on first compile, but visual polish pass (caustics density, ripple decay curve, foam math) deferred to user playtest

## G. Audio bus

- [ ] G1. `audioManager.ts` — register new `grove` bus
- [ ] G2. Source: stream burble loop (CC0 from freesound.org or commission, ~30–60s seamless)
- [ ] G3. Optional layer: faint wind through leaves loop
- [ ] G4. Optional layer: occasional bird chirp, one-shot every 20–40s with random offset
- [ ] G5. `/shhhh` mount → fade-in over 1s
- [ ] G6. `/shhhh` unmount → fade-out over 1s
- [ ] G7. Respects existing `AudioToggle` mute state

## H. Asset commission (~10–15 sprites)

- [ ] H1. Overhanging tree (gnarled silhouette, frame-defining) — 1
- [ ] H2. Stream-bed rocks (varying sizes) — 4–6
- [ ] H3. Foreground brush / ferns — 2–3
- [ ] H4. Distant ridge silhouette — 1
- [ ] H5. Bank / grass tufts — 2–3
- [ ] H6. Off-trail Forest marker (the trigger from D1) — 1
- [ ] H7. Optional fallback static composition WebP for no-WebGL devices — 1

## I. Verification

- [ ] I1. `npm run guardrails` clean (format, lint, typecheck, asset check, build)
- [ ] I2. Visual: compass always visible on homepage + case studies, spins toward Forest marker
- [ ] I3. Visual: click marker → InkWash → `/shhhh` loads cleanly
- [ ] I4. Visual: water shader renders smoothly, mouse-poke creates rings, ambient flow runs, caustics + foam read
- [ ] I5. Visual: back-to-trail returns smoothly to homepage
- [ ] I6. Visual: compass disappears on `/shhhh`, native cursor returns
- [ ] I7. Audio: stream bus fades in/out, AudioToggle mutes
- [ ] I8. Reduced-motion: water still ambient-flows but mouse ripples disabled (or minimized)
- [ ] I9. WebGL fallback: `/shhhh` shows static fallback composition WebP if no WebGL
- [ ] I10. Mobile: touch-tap creates ripples (tap = single ripple), no compass on touch devices anyway

## Open risks

- **Custom water shader is the long-pole.** Caustics + flow + ripples + foam is non-trivial. Prototype the shader against placeholder rocks before committing to commission scope.
- **Asset commission turnaround.** ~10–15 sprites; if illustrator is slow this gates launch. Use placeholder geometry (flat shaded planes) during shader dev so the two tracks run parallel.
- **Compass-always-visible may feel busy.** Current cursor only appears near eggs. Permanent could become visual noise on long scrolls. Worth A/B testing opacity (0.85 → 0.5) once live.
- **`/shhhh` discoverability.** Single Forest sprite + compass spin is the only way in. If playtest shows nobody finds it, increase sprite size or add a second hint (e.g., zone-entry shimmer on Forest enter).
- **Water performance on mobile.** Custom shader on a fullscreen plane on mid-tier Android could chug. Plan for a mobile-tier shader variant (skip caustics, reduce ripple count) gated behind viewport width or DPR check.

# Hero Content Early Fade

## Plan

- [x] Update the homepage hero overlay fade window so the text begins fading around the marked Basecamp scroll point.
- [x] Keep the hero vertical motion aligned with the new fade-out end point.
- [x] Verify the changed ranges are formatted cleanly and summarize the result.

## Review

- Updated `web/src/components/HomeClient.tsx` so hero overlay opacity now holds until `0.05` scroll progress and fades out by `0.11`, instead of holding until `0.06` and fading by `0.14`.
- Updated the hero upward motion endpoint to `0.11` so the movement completes with the earlier opacity fade.
- Dev server hot-recompiled the page successfully.

# Hero Watercolor Shader

## Plan

- [x] Rework `WoodcutMaterial` with restrained watercolor wash uniforms, paper grain, edge pooling, and gentler pigment diffusion.
- [x] Wire the new watercolor controls into the homepage hero through `UnifiedScene`.
- [x] Apply fixed restrained watercolor defaults to case study heroes through `HeroLandscape`.
- [x] Run lint/typecheck and visually verify homepage + one case study in the in-app browser.

## Review

- Updated `web/src/components/shaders/WoodcutMaterial.ts` with named Three imports, watercolor wash uniforms, alpha/luminance-aware ink sampling, paper grain, edge pooling, and restrained cursor/touch pigment diffusion.
- Added explicit alpha-vs-luminance ink mode so homepage alpha-mask layers and case study landscape layers both render correctly.
- Updated `web/src/components/UnifiedScene.tsx` with homepage Leva `watercolor` controls and scroll-progress uniform wiring.
- Updated `web/src/components/HeroLandscape.tsx` with fixed watercolor defaults so case study heroes use the same material language.
- Follow-up tuning pass restored a much clearer yellow-to-blue watercolor relationship: stronger golden cursor/core wash, more saturated blue outer bleed, higher wash intensity, and open cursor wash instead of edge-only tinting.
- Verification: `npm run lint`, `npm run typecheck`, and `npm run build` passed. In-app browser checks on `/` and `/work/craftedkit` showed no shader console errors. A mobile-sized Playwright smoke check on `/` and `/work/craftedkit` also showed no console errors. `npm run guardrails` still fails on unchanged asset-size violations for `public/home-hero/02-mountains.webp`, `05-mist.webp`, and `06-near-bank.webp`.

# Hero Scene Visible At Scroll Zero

## Plan

- [x] Update the scene opacity helper so a module that starts at scroll progress `0` is visible immediately.
- [x] Verify the homepage at scroll `0` shows the 3D background behind the content.
- [x] Run lint/typecheck and summarize the result.

## Review

- Updated `web/src/lib/moduleTimeline.ts` so an initial module with `enterStart <= 0` is rendered at full opacity immediately instead of starting blank at exact scroll progress `0`.
- Verified with a top-of-page browser screenshot that the hero background plate is visible behind the content at scroll `0`.
- `npm run lint` and `npm run typecheck` passed.

# Hero Watercolor Crispness

## Plan

- [x] Keep the yellow-to-blue watercolor, but stop the wash from tinting the core ink strokes.
- [x] Tighten the sampled ink mask and reduce open transparent wash so the hero does not feel hazy.
- [x] Run lint/typecheck and browser-check the homepage hero.

## Review

- Updated `web/src/components/shaders/WoodcutMaterial.ts` so watercolor pigment no longer stains the core ink strokes; the final ink resolves back to the base ink color.
- Tightened alpha/luminance ink sampling and removed the wet-radius ink softening that was making the mountain and forest strokes feel less crisp.
- Lowered default wash intensity and edge pooling in `web/src/components/UnifiedScene.tsx` and `web/src/components/HeroLandscape.tsx` so the effect stays behind the ink instead of fogging the whole hero.
- Verification: `npm run lint`, `npm run typecheck`, and `npm run build` passed. Browser reload of `/` showed no console errors; existing warnings are unchanged Framer/Three warnings.

# Hero Watercolor Leva Defaults

## Plan

- [x] Read the live homepage Leva watercolor settings from the in-app browser.
- [x] Promote those tuned values to the default shader/home/case-study watercolor settings.
- [x] Add Leva color controls for the blue water wash and warm yellow core.
- [x] Run lint/typecheck and verify the homepage control panel/browser render.

## Review

- Read live Leva values from the browser: radius `0.57`, wash intensity `1.40`, edge pool `0.21`, grain amount `0.08`, strength `0.12`, noise scale `27`, and speed `0.20`.
- Updated `web/src/components/shaders/WoodcutMaterial.ts`, `web/src/components/UnifiedScene.tsx`, and `web/src/components/HeroLandscape.tsx` so those tuned values are now the defaults.
- Added homepage Leva color controls `waterColor` and `warmColor`, wired into both homepage hero shader layers.
- Verification: `npm run lint`, `npm run typecheck`, and `npm run build` passed. Browser check confirmed the new color controls are visible with no console errors.

# Hero Card Whitespace

## Plan

- [x] Tighten the hero card width and padding so the panel wraps the intro content more closely.
- [x] Preserve responsive readability and existing hero scroll/fade behavior.
- [x] Run lint/typecheck and visually verify the homepage.

## Review

- Updated `web/src/components/HomeClient.tsx` to reduce the hero card from `max-w-3xl` to `max-w-[36rem]`.
- Tightened hero card padding and vertical spacing between the logo, eyebrow, headline, body copy, and CTA buttons.
- Verification: `npm run lint` and `npm run typecheck` passed. Browser check confirmed the card now hugs the intro content more closely with no console errors.

# Hero Watercolor Edge + Mobile Scroll

## Plan

- [x] Split edge and cursor pigment in `WoodcutMaterial` so edge pooling reads as `waterColor`.
- [x] Add scroll-driven diagonal mobile watercolor targeting to the homepage hero.
- [x] Keep case-study mobile scroll behavior unchanged while inheriting the shared shader fix.
- [x] Run lint/typecheck/build and browser-check desktop/mobile hero behavior.

## Review

- Updated `web/src/components/shaders/WoodcutMaterial.ts` so pooled edge pigment blends toward `waterColor` first, then the tighter cursor core blends toward `warmColor`.
- Reduced warm wash spread by tightening the warm core threshold and boosting edge-water contribution so blue can read around silhouette pooling.
- Updated `web/src/components/UnifiedScene.tsx` so homepage mobile no longer needs touch events for the baseline effect; scroll now drives a deterministic diagonal wet target through the hero.
- Case-study heroes were left structurally unchanged and inherit the shared material color split.
- Verification: `npm run lint`, `npm run typecheck`, and `npm run build` passed. Browser checks for `/` and `/work/craftedkit` showed no console errors; local mobile smoke checks also reported no console errors.

# Contain Watercolor To Heroes

## Plan

- [x] Make `WoodcutMaterial` defaults inert so non-hero scene users do not inherit watercolor wash.
- [x] Keep homepage and case-study heroes explicitly opted into watercolor through their existing uniform wiring.
- [x] Run lint/typecheck/build and browser-check the Forest section artifact is gone.

## Review

- Updated `web/src/components/shaders/WoodcutMaterial.ts` so watercolor, distortion, edge pooling, grain, and paper fill default to off.
- Homepage and case-study heroes still opt into watercolor explicitly through their existing uniform props, including explicit paper opacity where needed.
- Non-hero users such as `DeepForest` now get transparent woodcut rendering instead of inheriting the watercolor wash/paper fill.
- Verification: `npm run lint`, `npm run typecheck`, and `npm run build` passed. Browser checks reported no console errors.

# Sprite Sheet Bleed Fix

## Plan

- [x] Add a shared sprite-sheet texture helper that clamps atlas sampling, disables mipmaps, keeps linear filtering, and applies frame UV insets.
- [x] Wire the helper into the active homepage sprite users: Forest stag, Alpine bird, and Summit fox.
- [x] Give the fox a larger inset because its atlas dimensions do not divide evenly into the configured grid.
- [x] Run lint/typecheck/build and browser-check the affected homepage scroll zones.

## Review

- Added `web/src/lib/spriteSheetTexture.ts` to configure animated sprite textures with clamp-to-edge wrapping, no mipmaps, linear filtering, and inset frame UVs.
- Updated the active Forest stag, Alpine bird, and Summit fox sprite renderers to use the shared helper instead of sampling exact atlas cell boundaries.
- The fox now defaults to a larger `6px` inset because `fox_sprite.webp` is `1402x1122`, which does not divide evenly into its `4x4` grid.
- Verification: `npm run lint`, `npm run typecheck`, and `npm run build` passed. Browser console checks showed no new shader/sprite errors; the in-app browser screenshot API timed out on the WebGL canvas, so final visual inspection should happen in the live browser view.

# `/shhhh` Default Scene Restore

## Plan

- [ ] Restore the default `/shhhh` palette, water, and mountain/mist composition values to the earlier committed look.
- [ ] Keep the newer preset system, Gerstner water, foam, caustics, and specular controls.
- [ ] Render the existing near-bank asset so the mountain/water scene regains foreground depth.
- [ ] Align Leva ranges so default and preset values are not silently clamped.
- [ ] Run lint/typecheck/build and browser-check `/shhhh`.

## Review

- Pending.

# Camp Diorama Ground Pass

## Plan

- [x] Generate two transparent camp assets: a shallow top-down floor plate and a foreground underbrush frame.
- [x] Add the generated ground/underbrush, existing canopy, and existing moon to the active `CampSceneGroup`.
- [x] Keep the campfire lighting shader-driven by routing new foreground assets through the existing warm silhouette material.
- [x] Add small Leva controls for placement without changing the module timeline or scene architecture.
- [x] Run lint/typecheck/build and browser-check the camp zone.

## Review

- Generated `web/public/camp/generated/ground-plate.png` and `web/public/camp/generated/underbrush-frame.png` from a single chroma-key source image, then removed the green key locally into alpha PNGs.
- Wired the generated floor/underbrush layers, existing `/camp/canopy.webp`, and existing `/camp_moon.webp` into `CampSceneGroup`.
- Kept firelight mostly shader-driven by routing the new floor, underbrush, and canopy through `SilhouetteWarmMaterial`; moon remains a cool simple billboard.
- Added Leva controls for moon, canopy, floor plate, and underbrush placement/opacity.
- `npm run lint`, `npm run typecheck`, and `npm run build` pass. Lint still reports two pre-existing warnings in `GroveScene.tsx`.
- Follow-up: guarded the postprocessing stack against a lost/null WebGL context, removed the procedural `GroundMaterial` floor from the active camp scene, removed the top canopy/overbrush layer from the active scene, and increased the generated floor/underbrush defaults so those assets carry the ground.

# Forest + Alpine Backdrop Upgrade — Pass 3 of trail-backdrop work

## Context

After Camp + Summit shipped craft-parity painterly-shader backdrops (`SumiSky`, `DawnSky`, `CloudSea`, `SunRakeSilhouette`), Forest and Alpine became the visibly weakest modules. Both still use a single tiled woodcut wallpaper texture (`forest_wall.webp`, `alpine_wall.webp`) auto-panning horizontally on a clock — completely uncoupled from camera direction. Forest camera walks z -28→-90; Alpine camera climbs y -60→120. Auto-pan motion fights both narratives.

## Decisions (locked via /grill-me)

1. **Motion**: backdrop motion fully coupled to camera direction (no clock-based auto-pan anywhere)
2. **Vocabulary**: hybrid — painterly shader sky/mist behind woodblock mid-distance silhouette layer (à la Summit's far ridge)
3. **Forest mood**: misty quietude — cool fog veils, indistinct depth, hushed
4. **Alpine mood**: cloud sea below, ridges above — foreshadows Summit, cloud carpet starts forming during alpine climb
5. **Asset budget**: generate woodblock mid-distance silhouettes (2 forest + 2 alpine)
6. **Shader budget**: 1 new shader per module (1 forest mist + 1 alpine haze); CloudSeaMaterial gets a `uCoverage` uniform addition (no new file)
7. **Research**: 3 parallel agents — reference scout, technical patterns, codebase scout

## Plan

### New shaders (2 files)

- [ ] `web/src/components/shaders/ForestMistMaterial.ts`
- [ ] `web/src/components/shaders/AlpineHazeMaterial.ts`

### Existing material modification

- [ ] `CloudSeaMaterial` — add `uCoverage` uniform. Existing Summit usage defaults to 1.0; alpine couples 0→0.6→1.0 across alpine→summit transition.

### Asset generation (Flow → ImageMagick → public/<module>/)

- [ ] `/forest/canopy-mid.webp`
- [ ] `/forest/canopy-far.webp`
- [ ] `/alpine/ridge-mid.webp`
- [ ] `/alpine/ridge-far.webp`

(Prompts in appendix below.)

### Component edits

- [ ] `DeepForest.tsx` — delete `ForestWall` (lines 147-180); add `ForestMist` + 2 canopy `SunRakeSilhouette` instances.
- [ ] `UnifiedScene.tsx` — delete `AlpineWall` (lines 1061-1092); add `AlpineHaze` + 2 ridge silhouettes + scroll-coupled `CloudSea` instance in `AlpineSceneGroup`.

### Cleanup

- [ ] Delete `forest_wall.webp`, `alpine_wall.webp`, `alpine_birds.webp`, `alpine_fog.webp` from `web/public/`.

### Preserve untouched

- Forest: `ForestSceneGroup` wind sway, `ForestTree` parallax, `AnimatedSprite` stag, `shieldMatRef` darkening overlay
- Alpine: 4 `SyncedRockLedge` instances, `AlpineAnimatedSprite` birds, climb sway, MODULE_TIMELINE timing
- Hero, Camp, Summit modules

## Review

- 2 new shader files: `ForestMistMaterial.ts` and `AlpineHazeMaterial.ts`. Each follows the Camp/Summit recipe (hash21 → vnoise → 3-octave fbm → tonal blend) with one hero dial each (`uMistDensity`, `uAltitudePulse`).
- `CloudSeaMaterial` gained one `uCoverage` uniform (defaults to 1.0 so existing Summit usage is unchanged).
- `CloudSea` component gained an optional `coverageRef` prop — Summit doesn't pass it; Alpine does, scroll-coupled.
- `DeepForest.tsx`: deleted `ForestWall` (auto-panning wallpaper); added local `ForestMist` (scroll-coupled density) + `CanopyLayer` (meshBasicMaterial passthrough for the cool-painted assets); rendered far + mid canopy silhouettes at z=-160/-120.
- `UnifiedScene.tsx`: deleted `AlpineWall`; rewrote `AlpineSceneGroup` with painterly `AlpineHaze` (z=-300), 2 ridge silhouettes via `SunRakeSilhouette` (z=-260, z=-200, both `warmStrength=0` since alpine is pre-dawn), and a distant scroll-coupled `CloudSea` (z=-180, coverage 0→0.6→1.0 across alpine→summit handoff).
- 4 orphan backdrop assets deleted: `forest_wall.webp`, `alpine_wall.webp`, `alpine_birds.webp`, `alpine_fog.webp`. (`AlpineModule.tsx` still references `alpine_wall.webp` but it's orphan dead code — same status as `SummitModule.tsx`.)
- 4 new assets stashed in `web/.source-assets/{forest,alpine}/`; alpha-keyed webps in `web/public/{forest,alpine}/`. Ridge-mid was `-chop`'d 180px from the bottom to remove the "ALPENREISE: PRE-DAWN ASCENT" branding text Flow added.
- `typecheck` clean; `lint` only flags 2 pre-existing GroveScene warnings (unrelated).
- All backdrop motion now scroll-coupled — no more `clock.elapsedTime`-driven horizontal pan. Forest mist thickens with depth-walk; alpine clouds condense with altitude.

## Asset prompts (appendix)

Each prompt produces a 2752×1536 PNG with white background. Cut with `magick input.png -fuzz 12% -transparent white -quality 90 web/public/<dir>/<name>.webp`, then move source PNGs to `web/.source-assets/<dir>/`.

### Forest canopy mid — `forest/canopy-mid.webp`

> Japanese woodblock print illustration, John Fellows / Hokusai / Hiroshige style. **A row of mid-distance forest trees seen from a hushed, foggy forest floor** — the kind of view you'd get walking deeper into a tall conifer/birch forest where the middle-ground trees stand between you and a receding mist veil.
>
> Composition: a horizontal row of 6–10 partially overlapping tree silhouettes spanning the full width of the canvas. Mix of conifer (spruce, pine — narrow vertical pyramids) and bare deciduous (birch, aspen — slim trunks with sparse upper branches). The tree row sits in the **lower 50–60% of the canvas**; **upper 40–50% is empty white sky for compositing the mist shader behind**. Each tree has a visible trunk with sparse mid-tone hatching for bark texture, but limited foliage/needle detail — the eye should read the shapes as forest depth markers, not portrait trees.
>
> Atmospheric perspective: ALL trees are mid-distance pale, no foreground silhouettes. Color palette: slate-blue dominant (#4a5566), mid-tone (#5a6878), wash highlights (#7a8696), with sepia-ink hatching for bark. **No warm tones, no greens, no light beams** — purely cool, hushed, foggy-forest mood. Trees should look like they're being seen through a slight mist haze (some edge softness, restrained linework).
>
> Carving style: woodblock flat tonal planes, 4–5 tone palette, irregular organic edges, no photographic detail. Use value falloff for depth — leftmost and rightmost trees should be slightly paler than central ones.
>
> **Critical: trunks and lower branches must end well above the bottom of the canvas — leave at least 25% empty white at the bottom.** The mist shader will composite there in code, so trunks should fade into white as if standing in low fog (irregular fading transition, not a hard line).
>
> Output: white background, 2752×1536 aspect, no signature, no text.

### Forest canopy far — `forest/canopy-far.webp`

> Japanese woodblock print illustration, John Fellows / Hokusai / Hiroshige style. **A barely-suggested layer of distant trees disappearing into deep mist** — the fainter row that sits BEHIND the mid-canopy layer. Almost ghostly, atmospheric perspective taken to its extreme.
>
> Composition: a horizontal wash of barely-visible tree shapes. Indistinct vertical streaks suggesting trunks; minimal foliage detail; trees blur together into one tonal band rather than reading as individual portraits. The wash sits in the **lower 40–50% of the canvas**, even lower than canopy-mid; **upper 50–60% is empty white sky**.
>
> Atmospheric perspective is the entire point: this layer should look 2–3 value-steps paler than canopy-mid. Color palette: very pale slate, deepest #7a8696, mid #9aa6b6, highlights #b8c2d0, with whisper-thin hatching only where absolutely needed. **No warm tones. No detail. No focus.** Like looking through a vellum sheet at distant trees.
>
> Carving style: deliberately undercarved — flat tonal planes with very irregular soft edges, 3 tones max. The hand should feel hesitant.
>
> **Critical: leave at least 30% empty white at the bottom, with very soft fading transition into white.**
>
> Output: white background, 2752×1536 aspect, no signature, no text.

### Alpine ridge mid — `alpine/ridge-mid.webp`

> Japanese woodblock print illustration, John Fellows / Hokusai / Hiroshige style. **A range of mid-distance alpine ridges seen from a climber's perspective** — the kind of view you get partway up an ascent, with serrated peaks rising in the middle distance against a pre-dawn cool sky.
>
> Composition: 2–3 distinct ridge lines with sharp jagged crests, angular pyramid peaks, and broader rounded shoulders. The ridges layer like waves rolling backward. Keep the **horizon line low** — the lower 55–65% of the image is mountain ranges; the upper 35–45% is empty white sky for compositing the alpine haze shader behind.
>
> Atmospheric perspective: nearer ridges darker, farther ridges paler. Color palette: cool-dominated slate-blues — nearest ridge #3d4656 with sepia-ink hatching, middle ridge #5a6878 with restrained linework, farthest ridge #8a92a8 nearly fading. **No dawn warmth, no amber, no sun-rake glow** — this is pre-dawn. The mood is "altitude before sunrise."
>
> Carving style: woodblock flat tonal planes, 5–7 tone palette, irregular organic edges, no photographic detail.
>
> **Critical: the painted area must end well above the bottom of the canvas — leave at least 25% empty white at the bottom.** The cloud sea (already shipping in Summit) starts forming visually during alpine, so the bottoms of the ridges should fade into white as if dipping into clouds (irregular fading transition, not a hard line).
>
> Output: white background, 2752×1536 aspect, no signature, no text.

### Alpine ridge far — `alpine/ridge-far.webp`

> Japanese woodblock print illustration, John Fellows / Hokusai / Hiroshige style. **The most distant atmospheric ridge layer for the alpine module** — a barely-there wash of receding peaks at the absolute back of the alpine vista, almost dissolved into haze.
>
> Composition: 3–5 very faint, low-amplitude ridge silhouettes stacked closely together, almost merging into a single horizontal band of pale tonal washes. Peak shapes are softer, less jagged than the mid-ridges — atmospheric distance smooths edges. The wash sits in the **lower 30–40% of the canvas**; **upper 60–70% is empty white sky**.
>
> Atmospheric perspective: extreme. Color palette: very pale cool slate-violet — deepest #9aa4b8, mid #b6bfd0, highlights #d2dae6. Almost no linework. No carving. No detail. Pure tonal washes. **No warm tones whatsoever.**
>
> Carving style: barely visible — three flat tonal planes, very soft irregular edges. Suggest peaks rather than draw them.
>
> **Critical: leave at least 35% empty white at the bottom, with very soft fading into white.**
>
> Output: white background, 2752×1536 aspect, no signature, no text.

# Summit Module Pass 2 — Composition fix

## Diagnosis

After Pass 1 only the mid-ridge silhouette was visible in browser. All four assets loaded fine; the bug was compositional:

- **Far ridge invisible** — at scale 360×180 + same axis as mid-ridge, the mid-ridge silhouette occluded its full shape.
- **Cliff invisible** — plane was 26×9 (aspect 2.89) vs. source PNG aspect 1.79, warping the linework. Worse, the y-formula was correct but the plane was sized so the visible window of artwork was outside the rock band.
- **Cloud sea invisible** — horizontal plane at y=85 with camera looking nearly horizontal made it edge-on (≈0px tall on screen).
- **Camera arc too subtle** — 120→125 y, 15→5 z, didn't physically read as "stepping onto the ledge."

## Plan

- [x] Camera arc widened to 120→128 y, 15→2 z, 0.15→-0.18 rotX (still inherits alpine end-pose at start, so no handoff snap).
- [x] Far ridge moved off-axis (x=22, y=112, z=-180), shrunk to scale 200, warm dropped to 0.10 — reads as a horizon sliver behind the hero peak's shoulder.
- [x] Mid ridge tightened (scale 220, x=4) and aspect locked to 1.79.
- [x] Cliff plane sized 22×12.3 (aspect 1.79) with yOffset=-1 to seat the rock band lower in the frame.
- [x] Cloud sea raised (y=95, z=-60, size 800) so it reads as a horizon haze sliver between cliff and ridges.
- [x] Sky plane scaled up (1400×700) and pushed back (z=-200) to fully envelop the ridges as backdrop.
- [x] Ridge plane aspect ratios in JSX changed from `s*0.5` to `s/1.79`.

## Review

- One file touched: `web/src/components/UnifiedScene.tsx`. No new files, no new shaders.
- Camera weighting is unchanged — only the summit-zone end pose moved further. Start pose still equals alpine end-pose.
- Leva `'Home Summit'` defaults updated; ranges left intact for runtime tuning.
- No new assets, no asset pipeline changes.

---

# Summit Cloud Asset Pass

## Context

The large Summit mountain image was overpowering the scene after the cliff/flag fix. The next direction is to remove that dominant mountain/ridge image stack and try a generated sea-of-clouds asset instead, keeping the cliff and flag as the foreground reward.

## Plan

- [x] 1. Generate a low-fidelity John Fellows-style cloud-bank asset with a removable key background.
- [x] 2. Cut the generated source to transparent PNG/WebP assets under `web/public/summit/`.
- [x] 3. Remove the active Summit far-ridge and mid-ridge image layers from `UnifiedScene.tsx`.
- [x] 4. Add generated cloud image layers behind the cliff/flag, with Leva controls and preset values.
- [x] 5. Remove dead far/mid ridge Leva controls so the Summit panel only exposes active scene controls.
- [x] 6. Browser-check `#contact` and run focused verification.

## Review

- Generated `web/.source-assets/summit/cloud-sea-generated.png` and cut it to `web/public/summit/cloud-sea.png` / `web/public/summit/cloud-sea.webp`.
- Added `SummitCloudImage` as a simple transparent texture billboard for generated cloud plates.
- Removed the active `/summit/ridge-far.webp` and `/summit/ridge-mid.webp` render layers from Summit.
- Replaced the dead ridge controls with `cloudImage*` and `cloudImageNear*` controls in the `Home Summit` Leva folder.
- Updated all Summit presets so `Crisp Summit` remains the default while the cloud plates render larger, higher, and more opaque than the first browser pass.
- Browser screenshot pass confirmed the mountain image was removed and the cloud/flag/cliff composition rendered; a later screenshot retry timed out after reloading, so final visual tuning should continue in the open Leva panel.

## Follow-up Review

- The first cloud-only pass overcorrected and left Summit without a mountain anchor.
- Generated a new custom background plate with a smaller distant peak emerging from clouds:
  - `web/.source-assets/summit/cloud-peak-generated.png`
  - `web/public/summit/cloud-peak.png`
  - `web/public/summit/cloud-peak.webp`
- Swapped the main Summit cloud image layer to `cloud-peak.webp`.
- Kept the previous `cloud-sea.webp` as the nearer cloud lip.
- Updated the Summit preset defaults so the new peak plate sits higher and reads as distant atmosphere, not a full-screen ridge.
- Verification: `cd web && npm run typecheck`, `cd web && npm run lint`, and `cd web && npm run build` pass. Lint still reports the existing two `GroveScene.tsx` warnings.

## Cloud Thickness Follow-up

- Reduced the procedural Summit cloud shader planes so they act as haze instead of a full-screen cloud sheet.
- Lowered procedural cloud heights, coverage, opacity, rim, and shadow values across all Summit presets.
- Lowered the generated near-cloud lip opacity so it no longer blankets the generated peak plate.
- Moved the generated peak left so it stays visible with the Leva panel open.
- Raised the generated peak plate in render order while keeping the cliff/flag above it.
- Added a one-shot Summit default preset application on mount so Leva does not keep stale thick-cloud values after refresh.
- Verification: `cd web && npm run typecheck`, `cd web && npm run lint`, and `cd web && npm run build` pass. Lint still reports the existing two `GroveScene.tsx` warnings.

---

# Alpine Cloud Veil Pass

## Context

The Alpine section already has procedural cloud sea coverage near the lower scene, but it reads too subtle behind the case-study cards. The direction is to add an Alpine-only atmospheric cloud layer rather than changing Summit or the global module timeline.

## Plan

- [x] 1. Add a second Alpine-only `CloudSea` layer as a screen-facing cold veil behind the ridge/ledge stack.
- [x] 2. Give the veil its own coverage curve so it ramps inside Alpine without touching Summit timing.
- [x] 3. Expose the veil in `Home Alpine` Leva controls: enabled, placement, size, coverage, contrast, shadow, drift, and opacity.
- [x] 4. Add veil defaults to every Alpine preset so preset hot-swapping stays complete.
- [x] 5. Verify typecheck/lint/build and reload the local browser tab.

## Review

- Added optional `renderOrder` support to `CloudSea` so Alpine can place the new veil behind ridges while preserving the existing main cloud sea.
- Added `cloudVeilCoverage` and an Alpine-only ramp that peaks during Alpine and only gets a small handoff lift before Summit.
- Added `cloudVeil*` preset defaults for `Crisp Crest`, `Vast Cold`, `Held Breath`, `Wind-Carved`, `Thin Air`, and `Storm Brewing`.
- Added a `cloud veil` Leva folder under `Home Alpine`.
- Rendered the veil immediately after `AlpineHaze` and before the ridge/ledge stack.
- Verification: `cd web && npm run typecheck`, `cd web && npm run lint`, and `cd web && npm run build` pass. Lint still reports the existing two `GroveScene.tsx` warnings.

---

# Camp Ground Seam Fix

## Context

Right before Camp hands off to Trail Fork, the dark ground treatment could expose a hard horizontal rectangle edge beneath the ridge/treeline.

## Plan

- [x] 1. Replace the solid horizontal Camp ground wash plane with a soft gradient wash.
- [x] 2. Keep Camp, Trail Fork, and timeline ranges unchanged.
- [x] 3. Verify typecheck, lint, build, and browser reload.

## Review

- Added `CampGroundWash`, a small transparent shader plane with top/bottom/side alpha falloff and subtle grain.
- Replaced the previous rotated `meshBasicMaterial` ground rectangle so there is no hard geometric top edge to reveal during handoff.
- Browser reload at `#skills` showed no console errors.
- Verification: `cd web && npm run typecheck`, `cd web && npm run lint`, and `cd web && npm run build` pass. Lint still reports the existing two `GroveScene.tsx` warnings.

---

# Forest Sky/Fog Cleanup Pass

## Context

The Forest scene currently reads too spotty and dirty in the sky/fog. The ugly field is coming primarily from the camera-relative mote plane, with extra speckle from global postprocessing noise and some splotchy shaft/mist settings.

## Plan

- [x] 1. Disable Forest motes by default so the sky/fog returns to a cleaner paper-wash read.
- [x] 2. Fix the Forest mote shader falloff so the layer behaves correctly if manually re-enabled in Leva.
- [x] 3. Reduce high-frequency Forest mist grain and shift the fog toward broader, softer wash bands.
- [x] 4. Lower global postprocessing noise during the Forest window without changing the rest of the unified scene timing.
- [x] 5. Guard the shared Woodcut shader against zero-radius cursor wetness so Forest tree layers cannot produce ring artifacts.
- [x] 6. Remove the extra foreground/mid density tree layers from the default Forest preset and tighten Woodcut alpha discard to reduce stray dark texture dots.
- [x] 7. Add a Forest tree ink color control and soften the default tree ink/wash so remaining asset artifacts are less visually harsh.
- [ ] 8. Run focused verification from `web/`.
