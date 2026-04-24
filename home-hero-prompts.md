# Home Hero Asset Prompts — Google Flow / Imagen

This document contains the prompt configurations for generating the Home Hero parallax layers. The goal is to generate these as flat layers that can be masked/alpha-channeled and stacked in the 3D scene (`UnifiedScene.tsx` -> `HeroSceneGroup`).

Generate these as **16:9** or wide-aspect images in Google Flow (or Imagen / Gemini / Midjourney), then post-process to remove backgrounds and convert to transparent WebP.

---

## Shared Style Preamble (Prepend to all prompts)

> A hand-carved woodblock / linocut illustration in the style of John Fellows and vintage U.S. National Park posters. Pure black ink on pure white background, no color, no gradients, no soft shadows. Confident uneven line weights, visible tool marks, subtle ink bleed at edges, tiny authentic imperfections like a real carved stamp. Wide landscape orientation. No text, no lettering, no typography of any kind.

---

## 1. Distant Ridge / Mountains (`02-mountains.webp`)

**Role:** The farthest background layer, establishes the horizon and scale.

**Prompt:**
> [PREAMBLE] A massive, prominent mountain ridgeline. Smooth, sweeping peaks with striking woodcut contour lines suggesting rocky crags and rugged alpine terrain. Generous pure white negative space in the sky above the mountains for easy background removal. The bottom half of the image should have heavy ink coverage to ground the layer.

---

## 2. Far Bank / Midground (`03-far-bank.webp`)

**Role:** The middle-distance layer.

**Prompt:**
> [PREAMBLE] A mid-distance riverbank or gentle terrain shelf stretching horizontally across the frame. Covered in stylized grass tufts, sparse rugged pine trees, and smooth river rocks. The top edge of the bank must be distinctly silhouetted against a pure white background, while the bottom extends downwards with heavy ink coverage. Generous pure white negative space above the bank for easy background removal.

---

## 3. Near Bank / Foreground (`06-near-bank.webp`)

**Role:** The closest layer to the camera, framing the bottom and sides of the viewport. Needs highest contrast and detail.

**Prompt:**
> [PREAMBLE] A close-up foreground riverbank framing the bottom edge of the scene. Detailed, expressive foreground brush, rugged ferns, and large stylized stream-bed boulders. Rendered with intense, dense black ink coverage and high-contrast woodblock tool marks on the rocks and leaves to create a strong silhouette effect. The top edge must be uneven and organic, sharply silhouetted against a pure white background for easy extraction.

---

## 4. Overhanging Tree (Optional Framing Element)

**Role:** Used to frame the top edge of the viewport to create depth (like a theatre proscenium).

**Prompt:**
> [PREAMBLE] A large, gnarled pine or ancient cedar tree branch overhanging from the top corner of the frame. Dramatic, sweeping silhouette with dense, chunky needle clusters. Rendered in pure, heavy black ink. The branch should frame the scene without obstructing the center. The background must be completely pure white for easy alpha extraction.

---

## 5. Mist / Fog Layer (`05-mist.webp`)

**Role:** Semi-transparent filler layers between the terrain to create atmospheric depth.

**Prompt:**
> [PREAMBLE] Wispy, stylized fog banks and low-hanging mist, floating horizontally. Rendered as abstract, sweeping shapes with smooth, carved edges typical of bold linocut prints. The mist shapes themselves should be solid black or heavily hatched black ink. The background must be completely pure white so the mist shapes can be easily isolated and inverted into transparent white overlays later.

---

## 6. Forest Background (`04-forest.webp`)

**Role:** A dense midground layer that sits behind the far bank but in front of the mountains, creating a wall of trees to transition the viewer into the forest zone.

**Prompt:**
> [PREAMBLE] A dense, impenetrable wall of old-growth pine and cedar trees. The trees are packed tightly together, overlapping to create a continuous vertical barrier. Rendered with intense, chunky black ink coverage, high-contrast woodblock tool marks, and sharp, jagged needle clusters. The top edge must be uneven and organic, sharply silhouetted against a pure white background for easy extraction. The bottom half should fade into solid black ink.

---

## Post-Processing Workflow

1. Download the generated images.
2. Use Photoshop / Magic Wand / AI background removal to isolate the black ink elements and delete the pure white backgrounds.
3. For the **Mist** layer specifically: invert the colors (so the black mist becomes white) before applying transparency if you need it to be white in the scene.
4. Export as 32-bit PNGs with transparency.
5. Convert to WebP via CLI:
   ```bash
   for f in ~/Downloads/*-layer.png; do
     cwebp -q 92 -alpha_q 100 "$f" -o "web/public/grove/$(basename ${f%.png}).webp"
   done
   ```
