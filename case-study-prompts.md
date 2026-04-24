# Case Study Asset Prompts — Google Flow / Imagen

This document contains prompt configurations for generating bespoke, case-study-specific assets (landmarks and specimens) for the 4 projects. They use the same John Fellows linocut style as the Home Hero layers.

Generate these as **1:1 square** images, then post-process to remove the white backgrounds to create transparent WebP sprites.

---

## Shared Style Preamble (Prepend to all prompts)

> A hand-carved woodblock / linocut illustration in the style of John Fellows and vintage U.S. National Park posters. Pure black ink on pure white background, no color, no gradients, no soft shadows. Confident uneven line weights, visible tool marks, subtle ink bleed at edges, tiny authentic imperfections like a real carved stamp. Centered composition. No text, no lettering, no typography of any kind.

---

## 1. New Belgium & Friends (Brewery / Platform)

**Asset A: The Ranger Cabin (Signature Landmark)**
> [PREAMBLE] A rustic, A-frame backcountry ranger cabin nestled among a few rugged pine trees. Heavy black ink shadows under the roof, detailed wood-grain tool marks on the siding. Grounded on a small patch of rocky soil. Generous pure white negative space around the entire cabin for easy background removal.

**Asset B: The Hop Vine (Specimen)**
> [PREAMBLE] A botanical illustration of a single large, layered hop cone growing from a thick, twisting vine with a couple of jagged leaves. Intense, dense black ink coverage outlining the overlapping petals of the hop. Scaled like a scientific specimen. Pure white background.

---

## 2. CraftedKit (AI / WebGL Tooling)

**Asset A: The Crystal Formation (Signature Landmark)**
> [PREAMBLE] A cluster of sharp, geometric quartz crystals jutting out from a rough, organic rock base. The precise, straight lines of the crystals contrast with the rugged, hand-carved texture of the rock. Heavy black ink shading on the shaded sides of the crystals to give them 3D form. Pure white background.

**Asset B: The Circuit Fern (Specimen)**
> [PREAMBLE] A detailed botanical illustration of a single fern frond, but upon close inspection, the veins of the leaves subtly resemble angled, geometric circuit board traces with tiny node dots. A fusion of organic nature and technology. Rendered in pure black ink with sharp, confident tool marks. Pure white background.

---

## 3. Mission Bell (Architectural Millwork)

**Asset A: The Bell Tower (Signature Landmark)**
> [PREAMBLE] A traditional, timber-framed California mission bell tower with a single large cast bell hanging inside. Detailed wood-grain carving on the heavy timber beams, and rugged stonework on the base. Dramatic black ink shading under the roof. Pure white background.

**Asset B: The Hand Plane (Specimen)**
> [PREAMBLE] A vintage woodworker's hand plane resting next to a curled, spiral wood shaving. High-contrast carving marks highlighting the grain of the wood and the heavy iron blade of the tool. Rendered as a standalone object. Pure white background.

---

## 4. Consume & Create (Digital Agency / Performance)

**Asset A: The Lighthouse (Signature Landmark)**
> [PREAMBLE] A tall, cylindrical coastal lighthouse perched on the edge of a jagged, rocky cliff. Heavy black ink used to define the dark, rugged rocks and the shadowed side of the lighthouse tower. A few stylized waves crashing at the base. Pure white background.

**Asset B: The Chemex (Specimen)**
> [PREAMBLE] A stylized, glass pour-over coffee maker (Chemex style) with a wooden collar and leather tie. Wispy, carved steam rising from the top. Rendered in pure black ink with thick, uneven line weights. Pure white background.

---

## Post-Processing Workflow

1. Download the generated images.
2. Use Photoshop / Magic Wand / AI background removal to isolate the black ink elements and completely delete the pure white backgrounds.
3. Export as 32-bit PNGs with transparency.
4. Convert to WebP via CLI:
   ```bash
   for f in ~/Downloads/*.png; do
     cwebp -q 92 -alpha_q 100 "$f" -o "web/public/assets/graphics/case-study/$(basename ${f%.png}).webp"
   done
   ```