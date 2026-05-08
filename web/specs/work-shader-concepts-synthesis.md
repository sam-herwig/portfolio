# Work Module Shader — System-Coherence Synthesis

> **Angle of this document.** Three sibling research forks are independently brainstorming concepts (imagery, abstract, print-craft). This one is the system-coherence pass: every concept here is judged first by how well it sits beside Hero, About, and Contact — not by whether it's a clever shader on its own. The other forks may suggest more inventive treatments; this one's job is to keep the family resemblance intact.

---

## 1. Director's Note — Keep Imagery or Drop It?

The four modules already share a visual grammar: 1-bit B&W, sRGB-encoded at output, a single source of truth for scroll windows, and an idle → peak → exit envelope per scene. Hero and About go further — both ride a 4-keypoint SDF morph timeline with the same `linger()` / `tent()` cadence — and Contact reads as a stripped, geometric counterpart in the line-lattice family. Work, currently a 4-up Bayer-dithered project reel, is the only image-sourced mode. It is also the only one that introduces a content channel (project thumbnails) into a system otherwise built from procedural ink.

**Strongest argument to keep imagery:** "Work" is the literal payload of the page. Showing project artifacts behind the case-study cards has a directness that pure pattern can't match — the user feels the body of work as visible substance, not metaphor.

**Strongest argument to drop imagery:** the system's identity is "abstract typographic field." A photographic mode in the middle of three procedural modes reads like a foreign object, no matter how heavily it's stylized. Worse, the case-study cards in `WorkOverlay` already carry the imagery in HTML where it belongs — at legible size, with proper crop and copy. The shader fighting the overlay for the same job is what makes the dither feel grafted-on rather than load-bearing.

**Recommendation: drop the imagery.** Treat Work as a procedural field and encode "body of work" conceptually — a ledger, an index, an archive — through SDF or lattice idioms that already exist in the system. Let the HTML cards do the literal showing; let the shader do the institutional rhyme. The image-keeping branch is included below as a hedge in case the recommendation is overruled.

---

## 2. Image-Keeping Concepts

Each concept retains the four thumbnails but drops Bayer in favor of a treatment that echoes a specific neighbor module.

### 2.1 Aperture — *SDF window into the image*

**Visual.** Each quadrant's image is masked by an animated circular-to-hexagonal SDF "viewfinder." Outside the viewfinder, the field is solid black; inside, the image is rendered as 1-bit threshold-by-luminance — but with the threshold curve coming from a *radial* gradient, not Bayer. The viewfinder pulses larger at peak, then closes to a slit at exit.

**Sibling.** Echoes **Hero**. Same SDF + `tent()` warp idiom, transposed onto an image mask instead of a ring.

**Uniforms.** `uWorkApertureRadiusIdle`, `uWorkApertureRadiusPeak`, `uWorkApertureRadiusExit`, `uWorkApertureKeypoint` (0..3 = circle/hex/square/diamond), `uWorkContrast`, `uWorkRingThickness`.

```glsl
vec2 quadP = (quadrantUV - 0.5);
float seg = workT01 * 3.0;
float i = min(floor(seg), 2.0);
float lt = clamp(seg - i, 0.0, 1.0);
float morphMix = linger(lt);
float r = mix(mix(uWorkApertureRadiusIdle, uWorkApertureRadiusPeak, t1), uWorkApertureRadiusExit, t2);

float dC = sdCircle(quadP, r);
float dH = sdHexagon(quadP, r);
float dS = sdBox(quadP, vec2(r));
float dD = sdDiamond(quadP, r);
float dA = mix(dC, dH, step(0.5, i));
float dB = mix(dH, dS, step(0.5, i));
float d = mix(dA, dB, morphMix);

float fw = max(fwidth(d) * 1.2, 0.001);
float inside = 1.0 - smoothstep(-fw, fw, d);
vec3 img = texture2D(uWorkTex, sampleUV).rgb;
float lum = dot(img, vec3(0.299, 0.587, 0.114));
float radial = length(quadP) / max(r, 1e-3);
float thr = clamp(radial, 0.0, 1.0);
float bw = step(thr, lum) * inside;
return vec3(bw);
```

**Scroll arc.** Aperture opens (idle), holds wide (peak), closes to a slit on exit — visually rhymes with the Hero ring locking back at each keypoint.

**Why better than Bayer.** Replaces the dot pattern (which competes with About's grid) with a single graphic shape per quadrant — closer to the Hero/About/Contact visual vocabulary. The image becomes a punched-out form, not a halftone.

---

### 2.2 Inscribe — *Image as etched line drawing*

**Visual.** Each thumbnail is rendered as an etching: directional luminance gradient feeds the line-lattice from Contact, so dark regions get dense parallel hatching and light regions get sparse hatching. Two cross-hatch lattices at offset angles (exactly Contact's two-lattice idea) carry the tonal range.

**Sibling.** Echoes **Contact**. Reuses `gridLine` and the two-lattice rotation pattern.

**Uniforms.** `uWorkHatchScale`, `uWorkHatchAngle`, `uWorkCrossAngle`, `uWorkLineWidth`, `uWorkContrast`, `uWorkInkDensity`.

```glsl
vec3 img = texture2D(uWorkTex, sampleUV).rgb;
float lum = dot(img, vec3(0.299, 0.587, 0.114));
lum = clamp((lum - 0.5) * uWorkContrast + 0.5, 0.0, 1.0);

float a1 = uWorkHatchAngle;
float a2 = a1 + uWorkCrossAngle;
mat2 r1 = mat2(cos(a1), -sin(a1), sin(a1), cos(a1));
mat2 r2 = mat2(cos(a2), -sin(a2), sin(a2), cos(a2));
vec2 q1 = r1 * quadP * uWorkHatchScale;
vec2 q2 = r2 * quadP * uWorkHatchScale;

float halfW = uWorkLineWidth * 0.5;
float fw = max(0.5 * (fwidth(q1.x) + fwidth(q2.x)), 0.001);
// dark areas get both hatches; mid-tones get one; brights get none
float darkness = 1.0 - lum;
float l1 = gridLine(q1.x, halfW, fw) * step(0.25, darkness);
float l2 = gridLine(q2.x, halfW, fw) * step(0.6, darkness);
return vec3(max(l1, l2) * uWorkInkDensity);
```

**Scroll arc.** `uWorkHatchScale` drifts from coarse (idle) → tight (peak) → coarser (exit), mirroring the dither scale envelope but using line frequency instead of dot frequency.

**Why better than Bayer.** Speaks Contact's language directly — the page now rhymes Work → Contact instead of Bayer-dot → diagonal-line as a non-sequitur. Etched line drawings also feel editorial and case-study-appropriate (architectural / scientific reference plate), which fits the portfolio's tone.

---

### 2.3 Tile — *Image embedded in the About grid*

**Visual.** The About grid keeps marching forward into Work — each cell becomes a tiny window onto the corresponding image region, clipped by the cell's morph glyph (Plus / X / Diamond / Circle). Image sampled with cell-frequency UVs so the picture survives at cell scale, then multiplied by the SDF glyph alpha.

**Sibling.** Echoes **About**. Reuses cell tessellation, radial phase, and the tent activity signal.

**Uniforms.** `uWorkGridScale`, `uWorkGlyphIndex` (0..3 selecting Plus/X/Diamond/Circle), `uWorkContrast`, `uWorkRadialCenter`, `uWorkStaggerStrength`.

```glsl
vec2 cell = quadP * uWorkGridScale;
vec2 cellId = floor(cell);
vec2 cellP = fract(cell) - 0.5;
vec2 cellCenter = (cellId + 0.5) / uWorkGridScale;
float radial = length(cellCenter - uWorkRadialCenter);
float phase = radial * uWorkStaggerStrength;
float cellT01 = clamp((workT01 - phase) / max(1.0 - uWorkStaggerStrength, 1e-3), 0.0, 1.0);

vec2 imgUV = (cellId + 0.5) / uWorkGridScale + 0.5;
vec3 img = texture2D(uWorkTex, imgUV).rgb;
float lum = dot(img, vec3(0.299, 0.587, 0.114));

float d = mix(sdPlus(cellP, 0.4, 0.07), sdCircle(cellP, 0.4), cellT01);
float fw = max(fwidth(d) * 1.2, 0.001);
float glyph = 1.0 - smoothstep(-fw, fw, d);
float bw = step(0.5, lum) * glyph;
return vec3(bw);
```

**Scroll arc.** Grid stays dense at idle, glyphs morph through Plus → Circle across the work window — same radial-phase timing as About, so the wave that started in About finishes its second-half lap inside Work.

**Why better than Bayer.** Direct continuity from About — the grid never breaks. Bayer's dot pattern was already a cell-grid, but at fragment frequency, so it failed to read as the same idea. Cell-frequency sampling makes the lineage explicit.

---

## 3. Image-Dropping Concepts

Each concept treats the work module as a pure procedural field while encoding "body of work" through a conceptual hook.

### 3.1 Spread — *Contact-sheet ledger of indexed frames*

**Visual.** A 6×N grid of empty rectangular SDF "card frames" tiles the field. Each frame's interior holds a small SDF glyph that morphs through a 4-keypoint catalog timeline — bullet → fold-mark → tag → check. Per-card radial phase from a focal point (top-left, like a paginated ledger) propagates the morph diagonally across the spread.

**Sibling-pairs with About.** Extends About's grid-cell SDF idiom — same domain repetition, same per-cell timeline, same radial wave. The glyph vocabulary changes from geometric primitives (Plus/X/Diamond) to ledger glyphs (bullet/fold/tag/check), which is the Work-specific hook: this is About's grid grown up into an inventory of artifacts.

**Why this reads as Work.** Six rows of indexed cards directly evoke a contact sheet or job ledger — the visual archetype of "a body of work."

**Uniforms.** `uWorkGridCols`, `uWorkGridRows`, `uWorkCardPadding`, `uWorkStrokeWidth`, `uWorkRadialCenter`, `uWorkStaggerStrength`, `uWorkRotRate`.

```glsl
vec2 cell = vec2(p.x * uWorkGridCols, p.y * uWorkGridRows);
vec2 cellId = floor(cell);
vec2 cellP = fract(cell) - 0.5;
vec2 cellCenter = (cellId + 0.5) / vec2(uWorkGridCols, uWorkGridRows);
float radial = length(cellCenter - uWorkRadialCenter);
float phase = radial * uWorkStaggerStrength;
float cellT01 = clamp((globalT01 - phase) / max(1.0 - uWorkStaggerStrength, 1e-3), 0.0, 1.0);

float frameOuter = sdBox(cellP, vec2(0.5 - uWorkCardPadding));
float frameInner = sdBox(cellP, vec2(0.5 - uWorkCardPadding - uWorkStrokeWidth));
float frame = max(-frameOuter, frameInner);
float fwF = max(fwidth(frame) * 1.2, 0.001);
float frameStroke = 1.0 - smoothstep(0.0, fwF, abs(frame));

float seg = cellT01 * 3.0;
float i = min(floor(seg), 2.0);
float lt = clamp(seg - i, 0.0, 1.0);
float morph = linger(lt);
float dot_ = sdCircle(cellP - vec2(-0.25, 0.0), 0.04);
float fold = sdBox(cellP - vec2(-0.25, 0.0), vec2(0.06, 0.02));
float tag  = sdDiamond(cellP - vec2(-0.25, 0.0), 0.06);
float chk  = sdPlus(cellP - vec2(-0.25, 0.0), 0.08, 0.02);
float dA = mix(dot_, fold, step(0.5, i));
float dB = mix(fold, tag,  step(0.5, i));
float dG = mix(dA, dB, morph);
float fwG = max(fwidth(dG) * 1.2, 0.001);
float glyph = 1.0 - smoothstep(-fwG, fwG, dG);
return vec3(max(frameStroke, glyph));
```

**Scroll arc.** Cards reveal diagonally from focal corner (idle), all glyphs settle on tags at peak, glyphs collapse to check-marks on exit — visualizes "filing the work as it scrolls past."

**Why better than Bayer.** Trades ambient texture for institutional structure. The grid finally reads as *this work, indexed*, not as image-noise.

---

### 3.2 Stack — *Horizontal ridgeline of stacked rectangles*

**Visual.** A horizon line across the field is occupied by tightly-stacked vertical rectangles of varying heights — like a row of book spines, archive boxes, or a 1-bit bar chart. Heights are driven by FBM + a per-bar scroll-windowed envelope; the silhouette breathes in at idle, locks at peak, and a few outlier bars rise above the others on exit (the work singled out for the case studies).

**Sibling-pairs with Hero.** Reuses the FBM warp library and the `tent()` activity signal: peak = calm and locked, mid-segment = breathing. Hero spotlights one shape; Stack spotlights one shape made of many parallel parts. Same family of "single composed silhouette," scaled out.

**Why this reads as Work.** The stacked-spine archetype is the most direct visual for "the body of work" without imagery — a library shelf or runtime trace. It also gives the eye a clear horizontal beat that the eye-line of the WorkOverlay cards can read against.

**Uniforms.** `uWorkBarCount`, `uWorkBarGap`, `uWorkBaseHeight`, `uWorkVarianceIdle`, `uWorkVariancePeak`, `uWorkVarianceExit`, `uWorkBreathSpeed`.

```glsl
float bar = floor((p.x + 0.5) * uWorkBarCount);
float localX = fract((p.x + 0.5) * uWorkBarCount);
float barCenter = (bar + 0.5) / uWorkBarCount - 0.5;
float gap = uWorkBarGap;
float inBar = step(gap, localX) * step(localX, 1.0 - gap);

float seed = vHash(vec2(bar, 0.0));
float variance = mix(mix(uWorkVarianceIdle, uWorkVariancePeak, t1), uWorkVarianceExit, t2);
float breath = fbm(vec2(bar * 0.7, t * uWorkBreathSpeed));
float h = uWorkBaseHeight + variance * (seed - 0.5) + variance * 0.4 * (breath - 0.5);
// outlier accent on exit: a few bars rise sharply
float outlier = step(0.92, seed) * t2 * 0.18;
h += outlier;

float topY = -0.5 + h;
float bw = step(p.y, topY) * inBar;
float fw = max(fwidth(p.y) * 1.5, 0.001);
float aa = smoothstep(topY + fw, topY - fw, p.y);
return vec3(aa * inBar);
```

**Scroll arc.** Bars hold near-uniform height at idle (silent shelf), variance grows through peak (the shelf populates), 1–2 outliers rise above the line on exit (the case studies stepping out of the catalog as the user transitions to Contact).

**Why better than Bayer.** Single horizontal silhouette is restful; the dither field was busy and competed with the case-study cards. The outlier-rise on exit also gives the module a clear narrative beat that the current envelope lacks.

---

### 3.3 Index — *One large catalog card morphing through formats*

**Visual.** A single dominant rectangular SDF "index card" sits centered. It morphs through four format keypoints during the work window: landscape rectangle → portrait rectangle → square → contact-sheet grid (a rectangle sub-divided into a 3×2 mini-grid). FBM warp on the card's edge breathes during transitions, locks at keypoints — exactly Hero's idiom, just with a card vocabulary instead of a polygon vocabulary.

**Sibling-pairs with Hero.** Same single-element 4-keypoint timeline, same `linger()` / `tent()` cadence, same FBM warp injected into the SDF. The Work-specific hook is the keypoint vocabulary: "the way the work is filed" rather than "the geometry of the brand."

**Why this reads as Work.** The card is the literal artifact of cataloged work — every shape change is a different way the work could be filed (landscape thumbnail, portrait poster, square social, contact sheet). It's the most quiet of the three, which is appropriate: Work sits between two louder modules.

**Uniforms.** `uWorkCardSize`, `uWorkRingThickness`, `uWorkWarpScale`, `uWorkWarpSpeed`, `uWorkWarpBase`, `uWorkWarpPeak`, `uWorkSubGridDensity`.

```glsl
float seg = workT01 * 3.0;
float i = min(floor(seg), 2.0);
float lt = clamp(seg - i, 0.0, 1.0);
float ta = tent(lt);
float morph = linger(lt);
float s = uWorkCardSize;
float dLand = sdBox(p, vec2(s, s * 0.6));
float dPort = sdBox(p, vec2(s * 0.6, s));
float dSqr  = sdBox(p, vec2(s * 0.78));
float dGrid = sdBox(p, vec2(s * 0.92, s * 0.62));
float dA = mix(dLand, dPort, step(0.5, i));
float dB = mix(dPort, dSqr,  step(0.5, i));
float d = mix(dA, dB, morph);
float warpAmp = uWorkWarpBase + uWorkWarpPeak * ta;
d += (fbm(p * uWorkWarpScale + t * uWorkWarpSpeed) - 0.5) * warpAmp;
float fw = max(fwidth(d) * 1.2, 0.001);
float ring = 1.0 - smoothstep(0.0, fw, abs(d) - uWorkRingThickness);
// final keypoint: subdivide into contact-sheet grid lines
float grid = step(1.5, i) * morph * gridLine(p.x * uWorkSubGridDensity, 0.04, fw);
return vec3(max(ring, grid));
```

**Scroll arc.** Card morphs through landscape → portrait → square → contact-sheet across the work window. Ridgeline at peak, breathing edge mid-segment.

**Why better than Bayer.** It's literally Hero's grammar deployed for Work — the third strongest argument that the page has internal consistency. Bayer felt like a guest module; Index feels like a sequel.

---

## 4. Combo Preset Additions

Two new entries for `COMBO_PRESETS`, using existing Hero / About / Contact preset names plus the recommended new Work presets above. Replace the Work string with the chosen concept's preset name once it ships.

```ts
// New combo: 'Ledger' — the indexed-archive read.
// Pairs Spread (image-dropping, About-sibling) with the editorial Pinpoint contact
// and the slow Dilation hero so the page reads as one long quiet catalog.
Ledger: { hero: 'Dilation', about: 'Ridgeline', work: 'Spread', contact: 'Pinpoint' },

// New combo: 'Archive' — the shelved-work read.
// Pairs Stack (image-dropping, Hero-sibling) with the wider-stride Bench about
// and the broad Awning contact for a horizon-emphasizing layout throughout.
Archive: { hero: 'Switchback', about: 'Bench', work: 'Stack', contact: 'Awning' },
```

If the user chooses to keep imagery, the analogous combos would substitute `'Aperture'`, `'Inscribe'`, or `'Tile'` for the work slot — but the recommendation stands: drop the imagery, let the HTML cards do that job, and let the shader speak the same language as its three neighbors.

---

## 5. One-Line Closer

The Bayer dither isn't broken — it's *foreign*. The fastest fix is not to tune it; it's to replace it with a procedural concept that the Hero, About, and Contact modes already taught the eye to read.
