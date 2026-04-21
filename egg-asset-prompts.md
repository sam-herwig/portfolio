# Egg Asset Prompts — Google Flow / Imagen · PNG → WebP

Round 2: generate the remaining raster assets as **1024×1024 PNGs** in Google
Flow (or Imagen / Gemini). Convert each to **WebP** for shipping. Text will be
overlaid in code via SVG `<textPath>`, so we prompt the images **without any
lettering** — Google image gen is unreliable at text and we want interchangeable
slugs anyway.

---

## Assets already acquired (no re-prompt needed)

| File | Final path |
|---|---|
| `~/Downloads/owl-a.svg` | `web/public/eggs/forest-owl.svg` |
| `~/Downloads/embers-a.svg` | `web/public/eggs/camp-embers.svg` |
| `~/Downloads/pennant-a.svg` | `web/public/eggs/summit-pennant.svg` |
| `~/Downloads/cairn-a.svg` | `web/public/eggs/alpine-cairn.svg` |
| `~/Downloads/marker-b.svg` | `web/public/cairn/back-to-trail-marker.svg` |
| `~/Downloads/binding-a.svg` | `web/public/notebook/stitched-binding.svg` |
| `~/Downloads/topo-a.svg` | `web/public/notebook/topo-bg.svg` |

---

## One-time style preamble (prepend to every prompt below)

> A hand-carved woodblock / linocut illustration in the style of John Fellows
> and vintage U.S. National Park posters. Pure black ink on pure white
> background, no color, no gradients, no soft shadows. Confident uneven line
> weights, visible tool marks, subtle ink bleed at edges, tiny authentic
> imperfections like a real carved stamp. Centered composition, square frame,
> generous negative space, no lettering or typography of any kind.

---

## 1. Trailhead Stamp (Hero egg)

Final path: `web/public/stamps/trailhead-stamp.webp`

> Circular ink-stamp illustration, 1024×1024, centered. Heavy carved double
> ring forming the stamp border with ~20% inner margin — the inner field must
> be empty enough to host arc text later. At the center of the ring: a
> hand-carved mountain silhouette with a single pine tree in front and a small
> five-pointed compass-rose star just below the mountain peak. Stamp looks
> used: 4–6 tiny ink-bleed spots along the outer ring, one small area of
> slightly uneven ink coverage. Transparent background. No text, no letters,
> no numbers, no characters anywhere.

---

## 2–5. Trail Station Stamps (one per case study)

Identical border + ink texture across all 4 — **only the centerpiece motif
changes.** Generate each separately to keep the ring consistent.

Final paths:
- `web/public/stamps/trail-station-nb.webp`
- `web/public/stamps/trail-station-ck.webp`
- `web/public/stamps/trail-station-mb.webp`
- `web/public/stamps/trail-station-cc.webp`

Shared prompt skeleton (swap CENTERPIECE for each):

> Circular ink-stamp illustration, 1024×1024, centered. Heavy carved double
> ring forming the stamp border with ~20% inner margin — inner field empty
> for text overlay. At the center of the ring: **CENTERPIECE**. Stamp looks
> well-used: 4–6 tiny ink-bleed dots along the outer ring, one small patch of
> uneven ink. Transparent background. No text, no letters, no numbers.
> Strictly single-subject centerpiece rendered as one iconic shape readable at
> small sizes.

Centerpieces:

- **NB (New Belgium):** a single hand-carved hop cone (pinecone-like flower),
  shown in profile, thick tool-mark outline, simple crosshatch interior texture.
- **CK (CraftedKit):** a single hand-carved chef/carving knife, blade pointing
  up-right at 45°, carved wooden handle, visible bevel along the blade.
- **MB (Mountain Brand):** a single caribou antler shed, one side only, rugged
  branching tines, hand-carved tool marks along the beam.
- **CC (Coffee Client):** a single Chemex-style coffeemaker silhouette
  (hourglass flask shape with a wooden collar and leather tie), steam wisps
  rising from the top.

---

## 6. Cairn Monogram Frame (`/cairn` page)

Final path: `web/public/cairn/monogram-frame.webp`

> Ornamental oval frame carved in woodblock style, 1024×1024, centered, facing
> forward. Roughly oval/rounded-rectangle border formed from hand-carved
> laurel-and-pine branches on the left and right sides, meeting at a small
> carved mountain-peak ornament at the top and a small carved crossed-trail
> mark at the bottom. The center of the frame is completely empty — pure
> negative space to host user initials later. Letterpress-ornament meets
> park-ranger-passport feel. Transparent background. No text, no letters.

---

## 7–8. Margin Note (two-state asset)

Folded paper that uncrumples on click. Generate as **two separate images** so
code can crossfade between them.

Final paths:
- `web/public/eggs/margin-note-folded.webp`
- `web/public/eggs/margin-note-unfolded.webp`

### 7. Folded state

> A small crumpled folded paper scrap, hand-carved woodblock illustration,
> 1024×1024, centered. Rough torn edges, visible fold creases zigzagging
> across the paper, slight tilt for natural feel. A tapered pencil-sketched
> arrow extends down-and-left from the edge of the paper, pointing outward.
> Pure black ink on transparent background. No text, no writing, no words.

### 8. Unfolded state

> A flattened-open sheet of notebook paper, hand-carved woodblock illustration,
> 1024×1024, centered. Faint fold-crease lines still visible across the
> surface from where it had been folded. Rough torn edges on all sides.
> Horizontal ruled notebook lines fill the interior. The writing area is
> completely blank — no text, no handwriting, no words, no marks other than
> ruled lines. A tapered pencil-sketched arrow extends down-and-left from
> the edge of the paper. Pure black ink on transparent background.

---

## ⚠️ Still needs to be SVG — cannot be raster

### Thank-You Handwritten Note

Final path: `web/public/notebook/thank-you-handwritten.svg`

This one animates via `stroke-dashoffset` — each letter draws on stroke-by-
stroke. Raster PNGs cannot do this. Keep this one in the SVG batch (claude.ai
+ artifacts) using the Batch 3 / Asset 4 prompt from the previous plan, or
hand-letter it once in Procreate / iPad and export as traced SVG strokes.

---

## Post-process each PNG → WebP

```bash
# one-liner per asset (requires cwebp: `brew install webp`)
cwebp -q 92 -alpha_q 100 ~/Downloads/trailhead-stamp.png \
  -o ~/Code/Github/portfolio/web/public/stamps/trailhead-stamp.webp
```

Or batch-convert a whole folder:

```bash
for f in ~/Downloads/*.png; do
  cwebp -q 92 -alpha_q 100 "$f" -o "${f%.png}.webp"
done
```

**Quality note:** keep `-q 92` — these are illustrations with fine linework,
not photos. Lower quality smears the carved-block texture.

---

## Asset checklist — remaining work

- [ ] Generate 8 PNGs in Google Flow / Imagen (prompts above)
- [ ] Convert each to WebP at quality 92
- [ ] Drop into the `web/public/` paths listed under each prompt
- [ ] Move the 7 already-downloaded SVGs into their final paths (table at top)
- [ ] Generate the one remaining SVG (thank-you handwriting) via claude.ai
