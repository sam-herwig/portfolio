# Work Module — Abstract Fragment Shader Concepts

Replacement candidates for `modeWork` in `web/src/components/sections/BackgroundField.tsx`.
Drops the Bayer-dithered 4-quadrant thumbnail reel in favor of pure procedural form.
All five concepts are B&W, single-pass, render in the existing `modeWork(vec2 p, float t) -> vec3`
signature, and respond to `uScroll` with idle → peak → exit envelopes (using the same
`smoothstep`-around-`workMid` pattern already in the file).

Naming follows the print/craft register so the WORK_PRESETS dropdown reads as a typesetter's
toolkit, parallel to the existing Switchback / Ferrofluid / etc. for hero.

---

## 1. Forme — Letterpress Proof Grid

**Concept.** A field of rectangular type-blocks of varying density, locked together like a
letterpress *forme* (the metal frame holding the lock-up). Each block is a flat tone — black,
mid, white — and the layout shifts on scroll as if the chase is being re-quoined.

**Lineage.** Wim Crouwel's New Alphabet specimens; Massimo Vignelli grids; Gerrit Noordzij's
type-block notation; Karl Gerstner's *Designing Programmes*.

**Visual structure.** Anisotropic domain repetition: the canvas is partitioned into rectangles
of two or three aspect ratios via a pseudo-random column-then-row split (BSP-flavored, but
evaluated analytically). Each rectangle's tone comes from `hash(blockId)` quantized to N levels.
Distinct from About's *isotropic* plus-grid because cells here are rectangular and irregular —
not glyphs in cells, but the cells themselves are the composition.

**Uniforms** (5).
- `uWorkBlockScale` — base density of the block field (4 → 16)
- `uWorkSplitBias` — column-vs-row split preference (-1 → 1)
- `uWorkLevels` — quantization steps for tone (2 → 5, integer-coded)
- `uWorkLockup` — scroll-driven re-quoin amount (0 → 1)
- `uWorkBleed` — black/white bleed bias (-0.3 → 0.3)

**GLSL sketch.**
```glsl
vec3 modeWork(vec2 p, float t) {
  // scroll envelope
  float t1 = smoothstep(winStart, winMid, uScroll);
  float t2 = smoothstep(winMid, winEnd, uScroll);
  float lock = mix(0.0, uWorkLockup, t1) * (1.0 - t2);

  // recursive-ish split via two passes of domain warp
  vec2 q = p * uWorkBlockScale;
  vec2 cellA = floor(q);
  float h1 = vHash(cellA);
  // re-split each cell along its longer axis
  vec2 inner = fract(q);
  float splitX = step(0.5 + uWorkSplitBias * 0.3, h1);
  vec2 sub = mix(vec2(inner.x, floor(inner.y * 2.0 + h1 * lock)),
                 vec2(floor(inner.x * 2.0 + h1 * lock), inner.y),
                 splitX);
  vec2 cellB = cellA * 2.0 + sub;

  float h2 = vHash(cellB + 17.3);
  float tone = floor(h2 * uWorkLevels) / max(uWorkLevels - 1.0, 1.0);
  tone = clamp(tone + uWorkBleed, 0.0, 1.0);

  return vec3(tone);
}
```

**Scroll behavior.** Idle: low `uWorkLockup`, blocks read as a stable grid. Peak: lockup rises
and a few blocks slide one cell over — the forme is being re-quoined. Exit: bleed swings toward
black, the page goes to print.

**Why it fits Work.** The forme is literally where a body of work is locked up before
impression. It reads as catalog/inventory without using thumbnails — exactly the unification
goal.

**Tradeoffs.** Failure mode: with the wrong `uWorkLevels` it flattens to checkerboard noise.
Most load-bearing knob is `uWorkSplitBias` — without anisotropy in cell shape the eye reads
it as a bad mosaic. Sharp block edges are an asset, not a flaw — no AA pass needed.

---

## 2. Specimen — Voronoi Cell Atlas

**Concept.** A Voronoi tessellation where every cell hosts a different abstract mark — a
short stroke, a dot cluster, an arc, a hatched fill. Reads as a contact sheet of unknown
specimens. Each cell is unique; the composition is a *collection*.

**Lineage.** Type specimen sheets (Caslon, Garamond catalogs); Bauhaus Vorkurs exercises;
Moholy-Nagy's *Vision in Motion* cell studies; the back of an Emigre issue.

**Visual structure.** Standard 2D Voronoi (3×3 neighbor probe of a jittered lattice), but
the *content* of each cell is selected by `hash(cellId) % 4` — drawing one of: stroke, dot,
arc, hatch. The cell border is hairline. Distinct from About's plus-grid because cells are
irregular polygons and contents vary, not a single glyph morph.

**Uniforms** (6).
- `uWorkCellScale` — Voronoi point density (3 → 12)
- `uWorkJitter` — point jitter (0 → 1)
- `uWorkBorder` — cell border thickness (0 → 0.04)
- `uWorkMarkWeight` — interior mark stroke (0.01 → 0.08)
- `uWorkVariety` — chance of "filled" vs "marked" cells (0 → 1)
- `uWorkDrift` — slow time-drift of cell points (0 → 0.3)

**GLSL sketch.**
```glsl
vec3 modeWork(vec2 p, float t) {
  vec2 q = p * uWorkCellScale;
  vec2 cellId; vec2 cellOffset;
  float minDist = 1e9;
  for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2 nb = floor(q) + vec2(i, j);
      vec2 jit = (vec2(vHash(nb), vHash(nb + 7.0)) - 0.5) * uWorkJitter;
      jit += vec2(sin(t * 0.3 + nb.x), cos(t * 0.3 + nb.y)) * uWorkDrift;
      vec2 site = nb + 0.5 + jit;
      float d = length(site - q);
      if (d < minDist) { minDist = d; cellId = nb; cellOffset = q - site; }
    }
  // cell border via second-nearest distance approximation
  float border = smoothstep(uWorkBorder + 0.01, uWorkBorder, minDist - 0.45);
  // pick a mark by cellId hash: 0=stroke 1=dot 2=arc 3=hatch
  int mark = int(mod(vHash(cellId) * 4.0, 4.0));
  float fill = 0.0;
  if (mark == 0) fill = step(uWorkMarkWeight, abs(cellOffset.y));      // stroke
  if (mark == 1) fill = 1.0 - step(uWorkMarkWeight * 1.5, length(cellOffset)); // dot
  if (mark == 2) fill = 1.0 - smoothstep(0.18, 0.18 + uWorkMarkWeight,
                                         abs(length(cellOffset) - 0.22)); // arc
  if (mark == 3) fill = step(0.5, fract((cellOffset.x + cellOffset.y) * 14.0)); // hatch
  fill = mix(fill, 1.0, uWorkVariety * step(0.7, vHash(cellId + 3.1)));
  return vec3(max(border, fill));
}
```

**Scroll behavior.** Idle: cells static, mark variety low. Peak: `uWorkDrift` and
`uWorkVariety` rise — the atlas becomes denser, more "filled" cells appear, points wander
slowly. Exit: drift damps, jitter freezes — the atlas is annotated and bound.

**Why it fits Work.** Direct visual metaphor for a portfolio: many distinct artifacts,
each one a self-contained specimen, organized in a non-grid that reads as curation rather
than spreadsheet.

**Tradeoffs.** Failure mode: at low cell density the four mark types read as noise rather
than collection. Most load-bearing knob is `uWorkCellScale` — must be in the 5–9 range.
Cost is the 9-cell neighbor probe — single octave, no FBM, well within budget.

---

## 3. Plate — Posterized Worley Lithograph

**Concept.** A flat 2-level B&W lithograph: large soft Worley regions, hard-thresholded.
The image looks printed, not rendered — like a single-color screen pull on cotton paper.

**Lineage.** Albers's *Interaction of Color* tipped-in plates; Kara Walker silhouettes;
Bauhaus poster work; the Mac System 7 "Hand" pattern, scaled.

**Visual structure.** First-order Worley distance, hard-thresholded against a slowly drifting
boundary. The threshold itself is mildly perturbed by a single-octave fbm to break the cell
edges into deckled paper edges. Distinct from Concept 2 — here the regions are large (3–6
across the screen), unstructured, and there is no internal mark, only flat tone.

**Uniforms** (5).
- `uWorkPlateScale` — Worley density (1.5 → 5)
- `uWorkThreshold` — base black/white split (0.2 → 0.6)
- `uWorkDeckle` — edge irregularity from fbm (0 → 0.15)
- `uWorkPress` — scroll-driven threshold sweep (-0.3 → 0.3)
- `uWorkInk` — invert / polarity (0 or 1)

**GLSL sketch.**
```glsl
vec3 modeWork(vec2 p, float t) {
  vec2 q = p * uWorkPlateScale + vec2(t * 0.04, t * 0.025);
  // Worley first distance
  float d1 = 1e9;
  for (int j = -1; j <= 1; j++)
    for (int i = -1; i <= 1; i++) {
      vec2 nb = floor(q) + vec2(i, j);
      vec2 site = nb + 0.5 + 0.5 * vec2(vHash(nb), vHash(nb + 9.0));
      d1 = min(d1, length(site - q));
    }
  float t1 = smoothstep(winStart, winMid, uScroll);
  float t2 = smoothstep(winMid, winEnd, uScroll);
  float thr = uWorkThreshold + uWorkPress * (t1 - t2);
  thr += (fbm(p * 3.0 + t * 0.08) - 0.5) * uWorkDeckle;
  float bw = step(thr, d1);
  bw = mix(bw, 1.0 - bw, uWorkInk);
  return vec3(bw);
}
```

**Scroll behavior.** The threshold sweeps across the work window — `uWorkPress` pushes
black regions outward at peak, then pulls them back at exit. The plate appears to be
"running" through the press once.

**Why it fits Work.** A single pull off a stone — the most reductive way to say "made,
printed, finished." Pairs naturally with the existing Newsprint/Bleach combo presets.

**Tradeoffs.** Failure mode: too high `uWorkThreshold` and the screen goes solid black or
white. `uWorkDeckle` is the load-bearing knob — without it edges are too clean and read CGI
rather than print.

---

## 4. Imprint — Reaction-Diffusion Stain

**Concept.** A static frame of reaction-diffusion-like blotting — high-contrast organic
stain patterns, as if ink soaked into damp paper. The pattern is a *frozen* RD configuration
(no actual stepping), evaluated analytically from layered fbm and a sharp threshold band.

**Lineage.** Gray-Scott RD textures; Karl Sims's *Evolving 3D Morphology* prints; Rorschach
plates; Jenny Holzer's xeroxed runs.

**Visual structure.** Two octaves of fbm at different scales are subtracted to fake a
reaction term, then thresholded with a thin AA band. The result is high-contrast islands
with sharp boundaries and lacy interiors. Distinct from anything else in the system — the
only module with organic, non-grid form.

**Uniforms** (5).
- `uWorkStainScale` — base feature size (1 → 6)
- `uWorkSpread` — relative scale of the second fbm (1.2 → 3.0)
- `uWorkThreshold` — band center (0.3 → 0.7)
- `uWorkBandWidth` — feathering of the boundary (0.005 → 0.05)
- `uWorkSoak` — scroll-driven dilation of the stain (0 → 0.4)

**GLSL sketch.**
```glsl
vec3 modeWork(vec2 p, float t) {
  float a = fbm(p * uWorkStainScale + t * 0.03);
  float b = fbm(p * uWorkStainScale * uWorkSpread - t * 0.02);
  float field = a - 0.5 * b;
  float t1 = smoothstep(winStart, winMid, uScroll);
  float t2 = smoothstep(winMid, winEnd, uScroll);
  float soak = uWorkSoak * (t1 - 0.5 * t2);
  float thr = uWorkThreshold - soak;
  float fw = max(fwidth(field), 0.001);
  float band = smoothstep(thr - uWorkBandWidth - fw, thr - fw, field)
             - smoothstep(thr + fw, thr + uWorkBandWidth + fw, field);
  float fill = step(thr, field);
  return vec3(max(fill, band * 0.6));
}
```

**Scroll behavior.** At idle, a sparse stain. At peak, `uWorkSoak` pushes the threshold down
— black islands grow and merge as if more ink absorbs. At exit, the soak retracts; the
stain settles. The whole module reads like a single moment of impression captured.

**Why it fits Work.** Stains are the residue of doing work. The metaphor is direct: traces
left behind. Also — and this matters — it's organic where every neighbor is geometric,
giving the system tonal variety.

**Tradeoffs.** Failure mode: with low `uWorkBandWidth` it loses the ink-bleed quality and
goes back to flat shapes. Two fbm calls = 8 octaves total — within the 4-octave-per-call
budget but the most expensive concept here.

---

## 5. Tally — Cellular Automaton Stack

**Concept.** Horizontal rows of a 1D cellular automaton (Wolfram rule 30 / 90 / 184),
stacked top-to-bottom, evolving as scroll progresses. Reads as a logbook accumulating row by
row — work being tallied. Pure black/white pixel field, no AA.

**Lineage.** Wolfram's *A New Kind of Science*; Vera Molnár's algorithmic prints; Sol LeWitt
wall drawings; punched-card aesthetics.

**Visual structure.** Each row of the screen is a generation of the automaton. We don't
*step* the automaton on the GPU — instead, we evaluate the rule analytically by tracing
back to the seed via a deterministic hash chain seeded by `(rowIndex, colIndex, ruleId)`.
Practically, an approximation: hash-driven 2-state field that *imitates* rule-30 statistics
and reveals top-down with scroll. (True rule-30 needs an FBO; the approximation reads
identically to a casual viewer.)

**Uniforms** (5).
- `uWorkRowScale` — number of stacked rows (40 → 240)
- `uWorkColScale` — cells per row (60 → 360)
- `uWorkRule` — rule selector (0 → 3, integer; maps to 30 / 90 / 184 / 110 lookup)
- `uWorkReveal` — scroll-driven top-down reveal (0 → 1)
- `uWorkAge` — fade of older rows (0 → 0.6)

**GLSL sketch.**
```glsl
vec3 modeWork(vec2 p, float t) {
  // p is centered; remap to [0,1]^2
  vec2 uv = p + 0.5;
  float row = floor(uv.y * uWorkRowScale);
  float col = floor(uv.x * uWorkColScale);

  // pick rule-flavored hash mix; not literal rule-30 but reads similar
  float seed = vHash(vec2(row, col));
  float left = vHash(vec2(row - 1.0, col - 1.0));
  float center = vHash(vec2(row - 1.0, col));
  float right = vHash(vec2(row - 1.0, col + 1.0));
  float xor3 = step(0.5, fract(left + center + right + uWorkRule * 0.137));
  float on = mix(step(0.5, seed), xor3, 0.85);

  // top-down reveal
  float rowT = row / uWorkRowScale;
  float t1 = smoothstep(winStart, winMid, uScroll);
  float t2 = smoothstep(winMid, winEnd, uScroll);
  float reveal = mix(0.0, uWorkReveal, t1) - 0.3 * t2;
  float visible = step(rowT, reveal + 0.001);
  // fade old rows
  float age = 1.0 - uWorkAge * smoothstep(reveal, reveal - 0.4, rowT);
  return vec3(on * visible * age);
}
```

**Scroll behavior.** Idle: empty page. As scroll enters, rows accumulate from the top down,
locking in. Peak: full field. Exit: top rows fade slightly, suggesting the page is being
turned. The literal *accumulation* of marks across time is the key payoff.

**Why it fits Work.** This is the only concept where the *scroll itself produces the work*
on the screen. Every row visible = a piece in the tally. Most direct mapping of "body of
work" to a procedural form.

**Tradeoffs.** Failure mode: the hash-based rule approximation can read as random TV static
if `uWorkRule` lookup is wrong — needs careful tuning per rule constant. `uWorkReveal` is
the most load-bearing — without the top-down sweep the metaphor disappears. No AA is
intentional; pixel-perfect cells are part of the read.

---

## Recommendation

Strongest two for first build: **Forme** (closest to existing Newsprint/Saddle/Bleach mood,
trivially lit, hardest-edged) and **Tally** (the only concept where scroll *is* the
content). Together they bracket the system: one plate-static, one tally-accumulating.
**Imprint** is the wildcard — propose only if the user wants organic contrast against the
geometric neighbors.
