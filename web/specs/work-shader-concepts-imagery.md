# Work Shader — Imagery-Forward Concepts

Net-new fragment shader treatments to replace the 4×4 Bayer dithered project reel
in `BackgroundField.tsx :: modeWork`. Each concept still samples
`uWorkTex0..3` so the four featured case-study thumbnails remain recognizable.
All concepts run inside the existing single-fragment shader (no extra textures,
no MRT) and reduce to a small uniform set so they slot into the `WorkPreset`
record in `backgroundPresets.ts`.

Existing scaffolding to keep: 2×2 quadrant routing, `coverUV`, `lum =
dot(col, vec3(0.299, 0.587, 0.114))`, contrast remap. Treat each concept as a
swap for the lines downstream of the contrast remap (i.e. replace the
`bayer4 → step` block).

---

## 1. Engraving

**Concept** — line-engraving where every pixel is a hairline cross-hatch stroke
whose darkness matches local luminance, like a Wall Street Journal hedcut.

**Lineage** — copperplate engraving / steel engraving (Dürer, banknote portraits,
WSJ hedcuts). Closest shader cousin: McGuire's *hatching*, but hand-wavy
sin-stripe rather than a tonal atlas — keeps it one-pass.

**Visual structure** — the thumbnail luminance becomes the *only* signal; tone
is reproduced by stacking up to four rotated stripe systems (0°, 45°, 90°, 135°),
each one switching on as luminance darkens past a threshold. The thumbnail's
silhouette reads instantly; mid-tones get a single direction, shadows get a
plaid of all four.

**Uniforms**
- `uWorkLineDensity` — stripes per screen height (40–220)
- `uWorkLineWeight` — stroke half-width in stripe-space (0.05–0.45)
- `uWorkHatchSoftness` — analytic AA falloff (0.001–0.04)
- `uWorkTone1..4` — four luminance breakpoints where each rotated layer engages
- `uWorkScrollFlex` — how much density swings idle → peak → exit

**GLSL sketch**
```glsl
float stripe(vec2 q, float w, float aa) {
  float d = abs(fract(q.y) - 0.5);
  return 1.0 - smoothstep(w, w + aa, d);
}
float hatch(vec2 p, float lum, float density, float w, float aa) {
  float a45 = 0.7853981, a90 = 1.5707963, a135 = 2.3561944;
  vec2 p0 = p * density;
  vec2 p1 = mat2(cos(a45),-sin(a45),sin(a45),cos(a45)) * p0;
  vec2 p2 = mat2(cos(a90),-sin(a90),sin(a90),cos(a90)) * p0;
  vec2 p3 = mat2(cos(a135),-sin(a135),sin(a135),cos(a135)) * p0;
  float h = 0.0;
  if (lum < uWorkTone1) h = max(h, stripe(p0, w, aa));
  if (lum < uWorkTone2) h = max(h, stripe(p1, w, aa));
  if (lum < uWorkTone3) h = max(h, stripe(p2, w, aa));
  if (lum < uWorkTone4) h = max(h, stripe(p3, w, aa));
  return 1.0 - h; // ink on white
}
// after lum remap:
float ink = hatch(vUv * vec2(uResolution.x/uResolution.y, 1.0),
                  lum, ditherScale, uWorkLineWeight, uWorkHatchSoftness);
```

**Scroll behavior** — `uWorkLineDensity` ramps idle → peak → exit (replacing
the current `ditherScale` lerp). At idle: sparse, almost decorative cross-hatch.
At peak: dense, photographic. At exit: density falls off so thumbnails dissolve
into discrete strokes before contact takes over.

**Tradeoffs** — failure mode is moiré at certain density × screen-DPI combos.
Make-or-break knob: `uWorkHatchSoftness`. Too sharp and you alias; too soft and
the strokes muddy into halftone gray, losing the engraving signal.

---

## 2. Topography

**Concept** — luminance read as elevation, rendered as concentric contour lines
like a USGS map; the four thumbnails become four small terrain panels of pure
contour without infill.

**Lineage** — USGS quadrangle maps; Casey Reas's contour studies. Shader idiom:
`fract(lum × N)` band-pass, popularized by Iñigo Quílez plotting tutorials.

**Visual structure** — each quadrant samples its thumbnail, derives luminance,
quantizes it into N elevation bands, and draws only the band edges. The four
thumbnails read as topographic charts of themselves — works especially well for
images with strong tonal gradients (skies, faces, product shots). Pairs nicely
with the existing trail-themed Hero presets (Switchback / Saddle / Ridgeline).

**Uniforms**
- `uWorkContourBands` — number of elevation steps (6–32)
- `uWorkContourWeight` — line thickness in band-units (0.02–0.18)
- `uWorkIndexEvery` — every Nth band drawn heavier ("index contour", 0=off, 2–10)
- `uWorkContourBlur` — small fwidth multiplier for AA (0.5–2.5)
- `uWorkScrollDrift` — how much bands shift across scroll (creates breathing)

**GLSL sketch**
```glsl
float contour(float lum, float bands, float w, float blur) {
  float h = lum * bands;
  float band = abs(fract(h) - 0.5);
  float aa = fwidth(h) * blur;
  return 1.0 - smoothstep(w, w + aa, band);
}
// drift the elevations across the scroll arc so peaks "rise"
float drift = uWorkScrollDrift * scrollT;
float lumD = clamp(lum + drift, 0.0, 1.0);
float line = contour(lumD, uWorkContourBands, uWorkContourWeight, uWorkContourBlur);
// every Nth band heavier:
if (uWorkIndexEvery > 1.0) {
  float idx = floor(lumD * uWorkContourBands);
  float isIndex = step(0.5, abs(fract(idx / uWorkIndexEvery)) < 0.001 ? 1.0 : 0.0);
  line = max(line, isIndex * contour(lumD, uWorkContourBands,
                                     uWorkContourWeight * 1.8, uWorkContourBlur));
}
float bw = 1.0 - line; // black line on white
```

**Scroll behavior** — at idle: 8–10 broad bands, the thumbnail reads as a soft
topo. Through peak: bands subdivide (`uWorkContourBands` ramps up to 24+) and
`uWorkScrollDrift` slides the elevations, so contours appear to flow across
the image like a slow tidal pull. At exit: collapse back to 4–5 bands, leaving
a stark silhouette.

**Tradeoffs** — flat thumbnails (low local contrast) draw almost nothing.
Make-or-break: `uWorkContourBlur`. Too small → broken stitched-line aliasing;
too large → contours swell into halftone bands, losing the map signal.

---

## 3. Letterpress

**Concept** — risograph two-color separation: pure ink vs paper, but with the
"paper" being a tinted off-black (the foreground color) and the "ink" pulled
out as a posterized inverse — high-contrast newsprint with faint registration
noise.

**Lineage** — risograph posters, mid-century newsprint, two-color silk-screen.
Shader cousin: Tatsuro Hori's woodcut posters; but built from a posterize plus
a registration-jitter (per-quadrant constant offset).

**Visual structure** — luminance is posterized into 2–4 levels, the highest
level becomes "paper" (off-white), the rest collapse into "ink" (off-black).
Each of the 4 quadrants gets a tiny static UV offset (the registration error)
and a slight color cast. Reads as a printed contact sheet of the case studies.

**Uniforms**
- `uWorkPosterLevels` — quantization steps (2–5)
- `uWorkPosterPivot` — luminance threshold splitting ink/paper (0.35–0.7)
- `uWorkRegisterJitter` — UV offset per quadrant in px (0.0–4.0)
- `uWorkInkBleed` — blur radius for ink (0.0–1.5 px)
- `uWorkPaperGrain` — film-grain hash strength (0.0–0.15)

**GLSL sketch**
```glsl
// 4-tap registration-jitter sample (poor man's bleed)
vec2 jit = uWorkRegisterJitter / uResolution.xy;
float l0 = luma(texture2D(tex, sampleUV).rgb);
float l1 = luma(texture2D(tex, sampleUV + jit).rgb);
float l2 = luma(texture2D(tex, sampleUV - jit).rgb);
float l3 = luma(texture2D(tex, sampleUV + jit.yx * vec2(1.0,-1.0)).rgb);
float lum = (l0 + l1 + l2 + l3) * 0.25;
float steps = uWorkPosterLevels;
float lp = floor(lum * steps + 0.5) / steps;
float ink = step(uWorkPosterPivot, lp);              // 0 = ink, 1 = paper
float grain = (vHash(gl_FragCoord.xy) - 0.5) * uWorkPaperGrain;
float bw = clamp(ink + grain, 0.0, 1.0);
```

**Scroll behavior** — `uWorkPosterLevels` ramps 2 → 4 → 2 across idle → peak →
exit, so the image gains midtones during the dwell and slams back to bitonal
on the way out. `uWorkRegisterJitter` jiggles slightly with `sin(uTime)` for
a hand-printed flutter.

**Tradeoffs** — at very low pivot the entire frame goes white; at very high
pivot it goes black. Make-or-break: `uWorkPosterPivot`. Per-thumbnail
content makes a single global pivot look uneven; consider letting each
quadrant carry its own pivot if the look feels muddy.

---

## 4. Weave

**Concept** — woven cloth: warp (vertical) and weft (horizontal) threads cross
in a checker pattern; thread thickness modulates with luminance, so dark areas
of the thumbnail thicken into a tight weave and bright areas thin into open
mesh.

**Lineage** — textile macros, cyanotype on linen, Bauhaus weaving (Anni
Albers). Shader cousin: weave SDFs from ShaderToy `lsXSzn` family.

**Visual structure** — fragment coords are split into a weave grid. Within each
cell, two perpendicular pill-shaped threads alternate which one is "on top"
based on a checker. Thread half-width is driven by sampled luminance so the
weave densifies in shadows. Recognizability is preserved because thread
*thickness* tracks tone monotonically.

**Uniforms**
- `uWorkWeaveScale` — threads per screen height (60–240)
- `uWorkWeaveThicknessMin` — thinnest thread width (0.05–0.25)
- `uWorkWeaveThicknessMax` — thickest thread width (0.30–0.70)
- `uWorkWeaveOver` — over/under contrast (0.0–0.4)
- `uWorkWeaveSlant` — degrees of bias-cut (-15..+15)

**GLSL sketch**
```glsl
float pill(float x, float halfW, float aa) {
  float d = abs(x - 0.5);
  return 1.0 - smoothstep(halfW, halfW + aa, d);
}
mat2 R = rot(radians(uWorkWeaveSlant));
vec2 g  = (R * (p)) * uWorkWeaveScale;
vec2 cellId = floor(g);
vec2 cellP = fract(g);
float thick = mix(uWorkWeaveThicknessMin, uWorkWeaveThicknessMax, 1.0 - lum);
float aa = fwidth(cellP.x) * 1.2;
float warp = pill(cellP.x, thick * 0.5, aa);
float weft = pill(cellP.y, thick * 0.5, aa);
float checker = mod(cellId.x + cellId.y, 2.0); // which thread is on top
float threads = mix(max(warp, weft - uWorkWeaveOver),
                    max(weft, warp - uWorkWeaveOver), checker);
float bw = 1.0 - threads; // dark threads on light ground
```

**Scroll behavior** — `uWorkWeaveScale` halves between idle and peak (zoom-in
on the textile), then snaps back coarser at exit. `uWorkWeaveSlant` lerps
−5° → 0° → +5° to suggest the cloth being pulled straight then re-skewed.

**Tradeoffs** — at tight weave scales the moiré with screen pixel grid is
brutal. Make-or-break: `uWorkWeaveScale` × DPR interaction — pin scale to a
multiple of `uResolution.y` if it bites.

---

## 5. Mezzotint

**Concept** — stochastic ink dots with size driven by luminance — like a
Goya etching or a silver-gelatin print under heavy magnification. Differs from
halftone by being non-grid (no rosette) and from Bayer by being non-ordered.

**Lineage** — mezzotint engraving (the rocker-built tonal field); analog
silver-grain photography. Shader idiom: jittered Voronoi cells with radius
modulated by sampled luminance.

**Visual structure** — screen is tessellated into hexagonal-ish jittered cells
via cheap Voronoi. Each cell's center samples the thumbnail, gets a luminance,
and draws a soft-edged dot whose radius = (1 − luminance) × cell-size. The
random jitter means no rosette ever forms — it reads as photographic grain
at distance and as ink at close range.

**Uniforms**
- `uWorkGrainScale` — cells per screen height (80–320)
- `uWorkGrainJitter` — cell-center random offset (0.0–0.5 of cell width)
- `uWorkGrainGamma` — power applied to luminance before mapping to radius (0.4–2.5)
- `uWorkGrainSoftness` — dot edge AA (0.001–0.06)
- `uWorkGrainTwinkle` — micro-radius wobble keyed to `uTime` (0.0–0.12)

**GLSL sketch**
```glsl
vec2 g = p * uWorkGrainScale;
vec2 cellId = floor(g);
vec2 cellP  = fract(g) - 0.5;
vec2 jit = (vec2(vHash(cellId), vHash(cellId + 13.7)) - 0.5)
            * uWorkGrainJitter;
vec2 center = jit;
// sample tex once per cell using cell center, in image space:
vec2 cellUV = (cellId + 0.5 + jit) / uWorkGrainScale;
float lumC = luma(quadrantTex(cellUV).rgb);
float r = pow(1.0 - lumC, uWorkGrainGamma) * 0.5;
r += sin(uTime * 2.0 + cellId.x * 3.7 + cellId.y * 1.9)
     * uWorkGrainTwinkle * 0.05;
float d = length(cellP - center);
float aa = fwidth(d) + uWorkGrainSoftness;
float dot = 1.0 - smoothstep(r, r + aa, d);
float bw = 1.0 - dot; // dark grain on bright paper
```

**Scroll behavior** — at idle: coarse grain (`uWorkGrainScale` low) so the
image reads as a printed photograph. Through peak: scale ramps up, grain
becomes microscopic and nearly continuous. Exit: scale plummets and gamma
inverts to leave only the deepest shadows visible — a vignetting fade-out.

**Tradeoffs** — sampling the texture per cell means the effective pixel grid
is the cell grid; if `uWorkGrainScale` drops below ~30 the thumbnail collapses
into a few mega-dots. Make-or-break: `uWorkGrainGamma`. Tuning this nails the
"middle gray" perception — too low and everything feels soot-black, too high
and shadows wash out.

---

## 6. Cipher

**Concept** — ASCII / glyph mosaic where each cell renders a procedurally-built
glyph whose stroke density tracks the local luminance. Reads as a coded
specimen sheet of the case studies.

**Lineage** — `cmatrix`, ASCII video filters, Saul Bass title sequences.
Shader idiom: SDF-glyph-per-cell, picking from a small set keyed to luma — no
texture atlas needed if the glyph set is procedural (line, V, X, plus, hash,
solid).

**Visual structure** — domain repetition mirrors the existing About module's
plus-grid. For each cell, sample the thumbnail, derive luminance, pick one of
6 glyphs (light → heavy: blank, dot, dash, plus, X, hash, block) using
quantized luma as an index. Each glyph is a tiny SDF inside the cell.

**Uniforms**
- `uWorkCipherCols` — cells across screen width (40–160)
- `uWorkCipherStroke` — glyph stroke width in cell units (0.06–0.18)
- `uWorkCipherJitter` — per-cell sub-pixel shake driven by uTime (0.0–0.4)
- `uWorkCipherTilt` — rotation of the whole grid in degrees (-12..+12)
- `uWorkCipherLevels` — number of luminance buckets / glyph variants (3–7)

**GLSL sketch**
```glsl
mat2 R = rot(radians(uWorkCipherTilt));
vec2 g = R * p * uWorkCipherCols;
vec2 cellId = floor(g);
vec2 cellP  = fract(g) - 0.5;
float lumC = luma(quadrantTex((cellId + 0.5) / uWorkCipherCols).rgb);
float lvl = floor((1.0 - lumC) * uWorkCipherLevels);
float sw = uWorkCipherStroke;
float d = 1e3;
if (lvl >= 1.0) d = min(d, sdBox(cellP, vec2(0.06)));               // dot
if (lvl >= 2.0) d = min(d, sdBox(cellP, vec2(0.4, sw)));            // dash
if (lvl >= 3.0) d = min(d, sdPlus(cellP, 0.4, sw));                 // plus
if (lvl >= 4.0) d = min(d, sdX(cellP, 0.4, sw));                    // X
if (lvl >= 5.0) d = min(d, min(sdPlus(cellP, 0.4, sw),
                                sdX(cellP, 0.4, sw)));               // hash
if (lvl >= 6.0) d = min(d, sdBox(cellP, vec2(0.45)));               // block
float aa = fwidth(d) * 1.2;
float glyph = 1.0 - smoothstep(-aa, aa, d);
float bw = glyph;
```

**Scroll behavior** — `uWorkCipherCols` ramps 64 → 120 → 80; the mosaic gets
denser through peak then loosens. `uWorkCipherJitter` rises only at peak so
glyphs vibrate during the dwell, then settle as the section exits. Optional:
phase-offset glyph index by `sin(uScroll * τ)` so glyphs scrub through tones
even at constant luminance.

**Tradeoffs** — relies on the SDF helpers already in the file (`sdBox`,
`sdPlus`, `sdX`) so it's cheap; failure mode is reading like the About module
(also a plus-grid). Make-or-break: `uWorkCipherCols`. Too few glyphs reduces
to a typographic mood and loses the thumbnail; too many kills GPU time and
collapses each glyph below a pixel.

---

## Picking order

If only one ships, **Engraving** is the safest editorial bet — distinct from
the existing dither, B&W-native, holds up at every density, and the four
ramped tone uniforms give a strong leva story.

If two ship, add **Topography** — pairs verbally with the trail-themed
Hero/About preset names already in the codebase and is the most novel
*motion* (the bands flow with scroll).

**Mezzotint** is the highest-risk, highest-reward — get the gamma right and it
looks like a printed photograph, get it wrong and it looks like JPEG noise.
