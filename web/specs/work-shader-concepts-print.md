# Work Shader — Print-Craft Concepts

Replacements for the current 4×4 Bayer dither in `BackgroundField.tsx :: modeWork`. Each concept keeps the 2×2 thumbnail layout (`uWorkTex0..3`, ARs in `uWorkAR0..3`), runs as a single fragment pass, stays in 2-tone, and adds a `WorkPreset` block with idle → peak → exit scroll arc.

The current dither reads as the SVG-export of a 1992 GIF — shape without provenance. The five below all have a provenance; a designer should recognize the idiom before they read the name.

Each idea assumes the existing scaffolding: per-quadrant `coverUV()`, luminance via `dot(col, vec3(0.299, 0.587, 0.114))`, fragment-coordinate access via `gl_FragCoord`, and the `t1/t2` dual-ramp from window start → mid → end already used by `modeWork`.

---

## 1. **Burin**

**Idiom.** Wood engraving on the end-grain — Thomas Bewick's 1797 *History of British Birds*, Antonio Frasconi's mid-century editions. Parallel chisel cuts, varied weight, the white of the page doing the highlight work.

**One-line visual.** The thumbnail dissolves into horizontal hairlines whose thickness fattens in the shadows and tapers to nothing in the highlights — the page glows through, not pixels.

**Mechanism.** A high-frequency horizontal sine field is thresholded against a luminance-driven width term. A second axis-orthogonal cut adds cross-hatching only in the deepest darks (`lum < 0.25`). Per-quadrant coordinate jitter (`vHash(quadrantId)`) breaks the line phase between projects so the field doesn't read as one continuous engraving.

**Uniforms.**
- `uWorkBurinFreq` — line density (peak: ~140; idle: ~80)
- `uWorkBurinWeight` — base line weight, 0.05–0.4
- `uWorkBurinCrosshatch` — luminance threshold below which a second axis appears, 0.0 disables
- `uWorkBurinJitter` — phase offset between quadrants, 0–0.5
- `uWorkContrast` — preserve existing knob

**GLSL sketch.**
```glsl
float lum = luma(sampleQuadrant(uv));
lum = clamp((lum - 0.5) * uWorkContrast + 0.5, 0.0, 1.0);

// Per-quadrant horizontal phase break
float phase = vHash(vec2(float(idx), 0.0)) * uWorkBurinJitter;

float line = sin((vUv.y + phase) * uWorkBurinFreq);
// Width is wide in shadow, zero in highlight: weight * (1 - lum)
float w = uWorkBurinWeight * (1.0 - lum);
float ink = 1.0 - smoothstep(w, w + fwidth(line), abs(line));

// Cross-hatch only in the darks
if (lum < uWorkBurinCrosshatch) {
  float cross = sin(vUv.x * uWorkBurinFreq * 0.85);
  float cw = uWorkBurinWeight * (uWorkBurinCrosshatch - lum) * 4.0;
  ink = max(ink, 1.0 - smoothstep(cw, cw + fwidth(cross), abs(cross)));
}
return vec3(1.0 - ink);
```

**Scroll behavior.** `BurinFreq` ramps `idle 80 → peak 160 → exit 60` so the engraving tightens as the eye lands and loosens as you leave. Cross-hatch threshold rides up at peak (deeper darks engaged), drops at exit.

**Failure mode.** If the line direction stays orthogonal to the screen at all four quadrants, it reads as Photoshop "Graphic Pen". Solution: rotate each quadrant's axis by `idx * 0.18` radians so the engraving wraps around the composition.

**Top knob.** `uWorkBurinFreq` — the only thing that decides whether you're looking at Bewick (~150) or a 1970s coloring book (~30).

---

## 2. **Mezzo**

**Idiom.** Mezzotint, late-17th-century. The plate is roughened to print uniform black; the image is *burnished out* — highlights are where the artist scraped the plate smooth. Ludwig von Siegen, Yozo Hamaguchi.

**One-line visual.** A field of stochastic black grain, the thumbnail emerging from the dark by progressively burnishing white into the highlights — never linework, always grain.

**Mechanism.** Stochastic dot field generated from `vNoise(gl_FragCoord.xy * burr)`. Two thresholds: a coarse rocker pass and a fine burnish pass, both blended by luminance. The grain *exists everywhere* (this is what separates mezzotint from halftone) — only its fill density changes.

**Uniforms.**
- `uWorkMezzoBurr` — grain density (peak: ~6.0; idle: ~3.0)
- `uWorkMezzoFloor` — lowest luminance value that still prints any white, 0–0.1
- `uWorkMezzoCeil` — luminance above which all grain is removed, 0.6–1.0
- `uWorkMezzoBurnish` — softness of the threshold edge, 0.0–0.5
- `uWorkContrast`

**GLSL sketch.**
```glsl
float lum = luma(sampleQuadrant(uv));
lum = clamp((lum - 0.5) * uWorkContrast + 0.5, 0.0, 1.0);

// Two grain octaves — coarse rocker + fine burr
float coarse = vNoise(gl_FragCoord.xy * uWorkMezzoBurr * 0.4);
float fine   = vNoise(gl_FragCoord.xy * uWorkMezzoBurr);
float grain  = mix(coarse, fine, 0.6);

// Map luminance to a burnish threshold; below floor → solid black
float t = smoothstep(uWorkMezzoFloor, uWorkMezzoCeil, lum);
float edge = uWorkMezzoBurnish;
float ink = 1.0 - smoothstep(t - edge, t + edge, grain);
return vec3(1.0 - ink);
```

**Scroll behavior.** `Burr` tightens from idle 3 → peak 6 (the rocker gets finer as the user dwells), `Floor` lifts at exit so the darkest darks open up — the image "burnishes brighter" as you leave.

**Failure mode.** Using a regular noise function instead of one with proper blue-noise distribution makes it look like film grain in a YouTube thumbnail. Use `vNoise` mixed across two scales — the existing FBM helper is overkill here, two scales is enough.

**Top knob.** `uWorkMezzoFloor` — the lift-from-black point. Mezzotint *is* the relationship between paper black and the burnished highlight; this knob is that relationship.

---

## 3. **Riso**

**Idiom.** Risograph 2-color print, intentional registration mismatch — see Hato Press, Drugo Press, the entire 2010s zine revival. The two stencil layers never quite line up; the offset is the signature.

**One-line visual.** The thumbnail printed twice, once shifted left-up, once shifted right-down, in two different inks — except here both inks are darks, and the offset reads as a kind of haptic doubling.

**Mechanism.** Sample the quadrant texture twice with opposing UV offsets, threshold each pass at a different luminance pivot, layer with `min()` (multiply-style ink mixing). The highlights of the lighter pass print pure paper; the shadows of the darker pass print solid; the mid-tones get the offset stutter.

**Uniforms.**
- `uWorkRisoOffset` — pixel offset between layers in screen space, 0–8
- `uWorkRisoAngle` — direction of the offset (radians), gives the misregistration its character
- `uWorkRisoPivotA` — luminance threshold for first stencil, 0.3–0.6
- `uWorkRisoPivotB` — threshold for second stencil, slightly above A
- `uWorkRisoEdge` — softness of each stencil edge, 0.01–0.1
- `uWorkContrast`

**GLSL sketch.**
```glsl
vec2 dir = vec2(cos(uWorkRisoAngle), sin(uWorkRisoAngle));
vec2 px  = uWorkRisoOffset / uResolution.xy;

float lA = luma(sampleQuadrant(uv - dir * px));
float lB = luma(sampleQuadrant(uv + dir * px));
lA = clamp((lA - 0.5) * uWorkContrast + 0.5, 0.0, 1.0);
lB = clamp((lB - 0.5) * uWorkContrast + 0.5, 0.0, 1.0);

float e = uWorkRisoEdge;
float stencilA = 1.0 - smoothstep(uWorkRisoPivotA - e, uWorkRisoPivotA + e, lA);
float stencilB = 1.0 - smoothstep(uWorkRisoPivotB - e, uWorkRisoPivotB + e, lB);

// Multiply inks: dark where either stencil is dark, but their slight misalignment
// creates a thin halo on each edge that reads as the registration "ghost".
float ink = max(stencilA, stencilB * 0.85);
return vec3(1.0 - ink);
```

**Scroll behavior.** `RisoOffset` opens from `idle 1px → peak 4px → exit 6px` — the print "drifts" as the user passes through, registration falling apart at the exit edge. The pivot pair tightens at peak (more contrast, like a clean print run) and loosens at exit (under-inked).

**Failure mode.** If the offset stays axis-aligned (`Angle = 0` or `π/2`), it looks like a dropped frame, not a print. Default angle should be irrational (`0.62`) so the offset is diagonal — that's what reads as "two passes through the drum".

**Top knob.** `uWorkRisoOffset` — at zero it's a posterized photo; at 6px it's a misprinted zine. The whole identity is in this number.

---

## 4. **Aquatint**

**Idiom.** Etching's tonal cousin — resin dust melted onto a copper plate, then bitten in stages with stop-out varnish. Goya's *Caprichos* (1799), Mary Cassatt's color states. Granular, soft, unmistakably hand-bitten.

**One-line visual.** Photograph reconstituted as a wash of variegated grain — neither dot nor line, more like the noise in a worn photocopy of a worn photocopy.

**Mechanism.** FBM (the existing `fbm()` helper, four octaves) sampled in screen space, biased by luminance, then hard-thresholded. Unlike mezzotint's burnish-from-black, aquatint *bites* into the plate — the threshold function is inverted, and the noise is multi-scale with an organic warble (a slow `sin(t)` modulating the FBM coordinate).

**Uniforms.**
- `uWorkAquaBite` — overall noise scale, 1.5–6.0
- `uWorkAquaDrift` — slow-warble amplitude, 0.0–0.4
- `uWorkAquaTone` — luminance bias, -0.3–0.3 (controls how deep the bite goes)
- `uWorkAquaEdge` — threshold softness; *must stay tight* (0.02–0.08) to read as bitten, not blurry
- `uWorkContrast`

**GLSL sketch.**
```glsl
float lum = luma(sampleQuadrant(uv));
lum = clamp((lum - 0.5) * uWorkContrast + 0.5 + uWorkAquaTone, 0.0, 1.0);

// FBM with a slow warble — coords drift on a 12-second period
vec2 drift = vec2(sin(uTime * 0.13), cos(uTime * 0.11)) * uWorkAquaDrift;
vec2 q = (gl_FragCoord.xy / uResolution.y) * uWorkAquaBite + drift;
float plate = fbm(q);

// Hard bite — threshold sharp, but value comes from organic noise
float ink = 1.0 - smoothstep(lum - uWorkAquaEdge, lum + uWorkAquaEdge, plate);
return vec3(1.0 - ink);
```

**Scroll behavior.** `AquaBite` *coarsens* from idle 4 → peak 2 → exit 5 (counterintuitive — aquatint reads heavier as the grain gets larger, because larger grain = deeper bite in the metaphor). `AquaTone` shifts negative at peak (deepens the darks) and recovers to zero at exit.

**Failure mode.** If the noise is single-octave or stationary, it reads as static or sandpaper. Multi-octave + slow drift is what makes it look like ink-on-plate. Don't be tempted to add more octaves than 4 — five reads as cloud-noise and breaks the period.

**Top knob.** `uWorkAquaBite` — controls how aggressive the etching is. Low values = a soft Goya wash; high values = a Frankenstein-bolt of acid.

---

## 5. **Compositor**

**Idiom.** Letterpress proof / type-specimen. Image rebuilt entirely from glyph shapes — but unlike generic ASCII art, the glyphs are printer's flowers and rules (Bodoni's *Manuale Tipografico*, 1818). Every cell is a font event.

**One-line visual.** The thumbnail rendered as a grid of typographic ornaments, where each cell's glyph is selected by local luminance — denser glyphs in shadows, sparser in highlights.

**Mechanism.** Cell domain repetition à la `modeAbout`. Inside each cell, evaluate 4–5 procedural glyphs (filled circle, asterisk, plus, hyphen, blank) via SDFs and pick by luminance. The "type" feel comes from cell padding (grid is loose, not dense) and a slight per-cell rotation jitter (`vHash(cellId)`) — historic specimen pages have hand-set rules that wobble half a degree.

**Uniforms.**
- `uWorkCompCells` — cell count across the canvas, 30–120
- `uWorkCompPadding` — empty space around each glyph in the cell, 0.05–0.3
- `uWorkCompJitter` — per-cell rotation in radians, 0.0–0.3
- `uWorkCompPivots` — vec3 of luminance pivots between the 4 glyph tiers
- `uWorkContrast`

**GLSL sketch.**
```glsl
vec2 cell = vUv * uWorkCompCells;
vec2 cellId = floor(cell);
vec2 cellP  = fract(cell) - 0.5;

// Sample luma at the cell center to keep the glyph stable
vec2 center = (cellId + 0.5) / uWorkCompCells;
float lum = luma(sampleQuadrant(center));
lum = clamp((lum - 0.5) * uWorkContrast + 0.5, 0.0, 1.0);

// Per-cell rotation jitter
float a = (vHash(cellId) - 0.5) * uWorkCompJitter;
mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
vec2 p = R * cellP;
float r = 0.5 - uWorkCompPadding;

// Glyph tiers, dark → light: solid disc, plus, asterisk-like X, dot, blank
float gDisc = sdCircle(p, r * 0.9);
float gPlus = sdPlus(p, r, r * 0.18);
float gX    = sdX(p, r * 0.85, r * 0.16);
float gDot  = sdCircle(p, r * 0.18);

float d =
  lum < uWorkCompPivots.x ? gDisc :
  lum < uWorkCompPivots.y ? gPlus :
  lum < uWorkCompPivots.z ? gX    : gDot;

float fw = max(fwidth(d) * 1.2, 0.001);
float glyph = 1.0 - smoothstep(-fw, fw, d);
// Blank tier: no glyph in the brightest pivot band
glyph *= step(lum, uWorkCompPivots.z + 0.05);
return vec3(glyph);
```

**Scroll behavior.** `CompCells` densifies from idle 60 → peak 100 → exit 50 — type "tightens" at the dwell, then loosens. `CompJitter` is highest at idle (cold-set type), tightens at peak (clean impression), loosens at exit (the press is wearing again).

**Failure mode.** If the glyph palette includes anything ASCII-coded (letters, numbers), it reads as terminal output, not a specimen page. Stick to ornaments and ruling characters — these are *typographic*, not *typographic-of-language*. Dot, plus, X, disc, blank. Five tiers is plenty.

**Top knob.** `uWorkCompCells` — the grid scale is the sole determinant of whether you're reading a Bodoni opening (~50 cells) or a 6pt agate column (~120). Everything else is grace notes.

---

## Recommended palette for the `WORK_PRESETS` map

| Preset name | Concept | Combo affinity |
|---|---|---|
| `Burin`       | Wood engraving      | Editorial (replaces *Ghost*) |
| `Mezzo`       | Mezzotint           | Recommended (replaces *Saddle*) |
| `Riso`        | Riso misregistration| Loud (replaces *Reveal*) |
| `Aquatint`    | Etching/aquatint    | Print (replaces *Bleach*) |
| `Compositor`  | Type-specimen       | new — pairs with `Pinpoint` Contact |

Five presets matches the existing slot count (Newsprint/Saddle/Ghost/Bleach/Reveal). Each top knob (`BurinFreq` / `MezzoFloor` / `RisoOffset` / `AquaBite` / `CompCells`) is the dimensional axis a designer would use to A/B variants — keep it as the only single-folder knob in Leva and tuck the rest behind a `WorkScrollArc`-style sub-folder, mirroring how `Hero`/`Contact` are already organized.
