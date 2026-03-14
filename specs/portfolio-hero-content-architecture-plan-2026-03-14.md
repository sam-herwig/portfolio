# Portfolio Hero + Content Architecture Plan — 2026-03-14

## Decision
Move all meaningful text content out of 3D and into protected HTML overlays/cards.
Keep 3D for atmosphere, depth, motion, and transitions only.

---

## Core Rule
If removing WebGL makes a section unreadable or confusing, the content is in the wrong layer.

**HTML owns:**
- headline
- subhead
- CTA
- section intros
- explanatory copy
- case study metadata

**3D owns:**
- environment
- parallax
- mood
- ambient motion
- decorative/non-essential text only

---

## Exact Plan

### 1. Rebuild the hero as a protected HTML overlay
Replace scene-dependent hero text with a foreground content panel inside `HomeClient.tsx`.

**Hero panel contents:**
- eyebrow / short positioning label
- main headline
- 1 short supporting paragraph
- primary CTA
- optional secondary link

**Hero panel behavior:**
- fixed visual composition over the 3D scene
- readable on 15" laptop first
- constrained width (`max-w-*`)
- left-aligned copy
- subtle glass/smoked backdrop for separation from scene noise

### 2. Remove meaningful 3D text from the hero scene
In `UnifiedScene.tsx`, demote hero text from content to decoration or remove it entirely.

**Allowed after cleanup:**
- faint ambient/decorative type
- ghost text in background
- non-essential labels only

**Not allowed:**
- core headline
- paragraph copy
- CTA text
- any required messaging

### 3. Promote Alpine cards into the canonical content system
Use the alpine content treatment as the model for all content-bearing overlays.

**Canonical system pieces:**
- `HeroPanel`
- `ContentCard`
- optional `MiniMetaChip` / `TagRail`

**Shared style language:**
- smoked or glass background
- high-contrast text
- controlled blur
- border + shadow restraint
- scroll reveal motion
- responsive padding/width rules

### 4. Standardize scroll-reveal behavior
Use one consistent entrance pattern for protected content.

**Pattern:**
- slight translateY + fade-in
- no huge cinematic drift
- no content dependent on viewport-perfect camera framing
- reduced motion should still be readable and calm

### 5. Quiet the hero scene behind the text zone
Reduce visual competition directly behind the hero panel.

**Adjustments:**
- lower contrast behind copy
- soften or darken backdrop under panel
- avoid duplicate/echo image reads near the text block
- stabilize camera in the intro section

### 6. Keep the Alpine section mostly as-is
The alpine cards are working better than the hero. Do not reinvent them.

**Keep:**
- protected card treatment
- scroll reveal
- clear thumbnail/title/subtitle structure
- left/right alternating rhythm

**Tune later if needed:**
- reduce hover gimmicks if they distract
- ensure static state is fully legible without hover

### 7. Use the same rule for later sections
Forest/camp/summit should follow the same layer model:
- meaningful content = HTML
- environmental storytelling = 3D

---

## Implementation Sequence

### Slice 1 — Hero rescue
- Add protected HTML hero panel in `HomeClient.tsx`
- Remove scene-dependent hero copy
- Calm hero camera/framing

### Slice 2 — Shared content system
- Extract reusable hero/card styling primitives
- Align hero panel and alpine cards into one visual family

### Slice 3 — Scene cleanup
- Reduce competing backdrop detail behind text zones
- Audit decorative text and remove anything that reads like required copy

### Slice 4 — Motion polish
- Normalize scroll reveal timing/easing
- Ensure all key content works on laptop and mobile without fragile framing

---

## Success Criteria
- Hero message is immediately readable on 15" laptop
- No core text exists only in 3D
- Alpine cards and hero feel like one system
- 3D enhances the page without carrying meaning
- If WebGL fails, the page still communicates clearly

---

## Brief Explanation
We are separating **meaning** from **atmosphere**.

Right now the hero asks 3D to do both, which causes readability and responsiveness problems.
The fix is to let **HTML carry the message** and let **3D carry the feeling**.
That keeps the cinematic identity while making the portfolio actually usable and easier to polish.
