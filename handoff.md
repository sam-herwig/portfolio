# Phase 1 Handoff — Dispersive 3D Type Signature

> Self-contained briefing for the next session (or post-compact resume). Read this first, then `todo.md` for the strategic brief and `copy-archive.md` if you need original copy.

---

## You are here

**Branch:** `staging` (Phase 0 committed at `9c73245`, pushed to origin).
**Trail-theme rollback:** `archive/trail-theme` (pushed to origin — `git checkout archive/trail-theme` recovers everything).
**State:** All trail vocabulary, atmospheric shaders, themed components and assets removed. Theme-neutral scaffold compiles green and prerenders 12 static pages (homepage placeholder + 4 case studies + OG images + 404).

**Goal of Phase 1:** Build the **signature dispersive 3D type material** as a standalone test surface at `/lab/dispersion`. This is the single highest-leverage piece of the redesign — it has to flex hard enough that an agency-tier recruiter clocks "this person hand-engineered this" in two seconds. Everything else in the site is a delivery vehicle for this one material.

---

## Locked decisions — DO NOT REOPEN

These are settled. If you find yourself debating them, stop and just execute.

| Axis | Locked value |
|---|---|
| Theme | Removed entirely. No metaphor, no regional vocabulary. |
| Buyer | US agencies + studios (Active Theory / Lusion / Hello Monday / Watson DG tier). Peer-judged. |
| Register | Confident-cheeky (clean + senior + a touch of wit; **not** toy, **not** lifestyle, **not** illustrated). |
| Signature | 3D type-mesh + custom dispersive/refractive material with 10% viscous undertone. |
| Architecture | Stacked-panel scroll, single fixed R3F canvas, 3-panel ruthless homepage. |
| Color | Dark default. `#0a0a0a` bg / `#fafafa` fg / muted gray mono. Single accent emerges from dispersion chroma. |
| Typography | Fraunces (display) + Geist Sans (body) + Geist Mono (utility). All OFL/MIT. Already wired in `layout.tsx`. |
| Identity | Sam Herwig as personal brand, not a studio shell. |
| Stack | Next.js 16, React 19, R3F, drei, GSAP, **Lenis**, **@14islands/r3f-scroll-rig**, **three-custom-shader-material**, Tailwind v4. |

Open questions still pending (do not block Phase 1):
- "Selected Work" section rename — `Field Notes` / `Drops` / `Work / 12` / TBD. Currently `Selected Work / 04` in placeholder.

---

## Phase 1 — explicit instructions, broken into commits

Each commit should pass `npm run guardrails` before landing. No commit ships with broken build.

### Commit 1: download Fraunces .ttf and prove drei `<Text>` works

```bash
mkdir -p web/public/fonts
# Download Fraunces variable from https://github.com/undercasetype/Fraunces/raw/main/fonts/variable/Fraunces[SOFT,WONK,opsz,wght].ttf
# Save to web/public/fonts/Fraunces.ttf
```

Create `web/src/app/lab/dispersion/page.tsx` (must be `'use client'`):

```tsx
'use client';

import { Canvas } from '@react-three/fiber';
import { Text, OrbitControls } from '@react-three/drei';

export default function DispersionLab() {
  return (
    <main className="h-screen w-full bg-background">
      <Canvas camera={{ position: [0, 0, 5], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Text
          font="/fonts/Fraunces.ttf"
          fontSize={1.2}
          color="#fafafa"
          anchorX="center"
          anchorY="middle"
          maxWidth={6}
        >
          Sam Herwig
        </Text>
        <OrbitControls />
      </Canvas>
    </main>
  );
}
```

Verify:
- `npm run dev` → visit `http://localhost:3000/lab/dispersion` → see Fraunces "Sam Herwig" rendered as 3D text on dark background.
- `npm run guardrails` passes.

Commit: `phase 1: dispersion lab — Fraunces text in R3F`

### Commit 2: drop in MeshTransmissionMaterial as the floor baseline

Wrap the `<Text>` in a `<mesh>` and apply `<MeshTransmissionMaterial>` from drei. This gives the "drei drop-in" baseline — the floor we have to beat. Set `transmission={1} ior={1.5} chromaticAberration={0.05} thickness={0.5} backside={true} backsideThickness={0.8}` as starting numbers (per Agent 4 research).

Add a render-target backdrop to give the transmission something to refract: a plane behind the text with a subtle gradient or a noise texture, so the dispersion shows.

Verify in browser: text now refracts what's behind it. Note quality — this is the bar to clear.

Commit: `phase 1: dispersion lab — MeshTransmissionMaterial baseline`

### Commit 3: replace with custom THREE-CustomShaderMaterial doing per-channel IOR

Install `three-custom-shader-material` is already done. Create `web/src/components/lab/DispersionMaterial.tsx`. Extend MeshPhysicalMaterial via CSM. Custom fragment that:

- Samples the scene (rendered to FBO via `useFBO`) three times with `refract()` called per-channel for R/G/B with three slightly different IOR values
- Combines per-channel samples back into final color
- Adds Fresnel via Schlick approximation

Reference (read these BEFORE writing GLSL):
- https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/ — definitive walkthrough with code
- https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/ — closest-match to our use case
- https://github.com/pmndrs/drei/blob/master/src/core/MeshTransmissionMaterial.tsx — read the source to understand FBO plumbing

Apply via `material={<CustomShaderMaterial ... />}` prop on drei `<Text>`. Note the troika instancing gotcha (per Agent 4): use `modelMatrix * vec4(position, 1.0)` for world-space, never `instanceMatrix` (troika uses instancing internally per glyph).

Goal: visibly different from the drei drop-in. Per-channel dispersion should make the chromatic split smoother than `chromaticAberration` uniform jitter.

Commit: `phase 1: dispersion lab — custom per-channel IOR material`

### Commit 4: upgrade to rygcbv 6-channel spectral split

Per Petrick → Heckel (this is the *killer detail* from research): refract six times across the visible spectrum at offset IORs (red/yellow/green/cyan/blue/violet), then matrix-multiply the six samples back through a spectral basis to RGB.

This is the technique that crosses the "engineered vs drei drop-in" line. Read https://taylorpetrick.com/blog/post/dispersion-opengl for the spectral-to-RGB matrix.

Cost: ~2× a 3-channel refraction. Stays beautiful at extreme dispersion values where 3-channel breaks into obvious red/blue fringes.

Add a debug uniform `uMode` (0 = drei baseline, 1 = 3-channel, 2 = rygcbv). Toggle via key press in the lab page so you can A/B all three modes side by side.

Commit: `phase 1: dispersion lab — rygcbv 6-channel spectral split`

### Commit 5: cursor-velocity coupling (Anatole Touvron's signature)

Create `web/src/lib/useMouseVelocity.ts`:

```ts
'use client';
import { useEffect, useRef } from 'react';

export function useMouseVelocity() {
  const velocity = useRef({ x: 0, y: 0, magnitude: 0 });
  const last = useRef({ x: 0, y: 0, t: performance.now() });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const now = performance.now();
      const dt = Math.max(1, now - last.current.t);
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      // Smooth: lerp toward current velocity
      const vx = dx / dt;
      const vy = dy / dt;
      const mag = Math.sqrt(vx * vx + vy * vy);
      velocity.current.x = velocity.current.x * 0.85 + vx * 0.15;
      velocity.current.y = velocity.current.y * 0.85 + vy * 0.15;
      velocity.current.magnitude = velocity.current.magnitude * 0.85 + mag * 0.15;
      last.current = { x: e.clientX, y: e.clientY, t: now };
    };
    window.addEventListener('pointermove', handler);
    return () => window.removeEventListener('pointermove', handler);
  }, []);

  return velocity;
}
```

In the lab page, pass `velocity.current.magnitude` into the dispersion material as a uniform that scales the IOR delta. At rest = 0 effect (looks like calm glass). On swipes = peak dispersion.

This is the move that makes the material *feel alive* without any geometry change. It's the single most defining signature behavior.

Commit: `phase 1: dispersion lab — cursor-velocity coupled IOR`

### Commit 6: back-face thickness FBO pre-pass

Text geometry is deeply non-convex (counters in `o`, `e`, `a`, descenders). Naive front-face thickness breaks. Render back-face depth to an FBO, compute per-fragment thickness as `frontDepth - backDepth`. Use that thickness in Beer-Lambert absorption term for proper "glass body" tinting.

This is the third leg of the "engineered" stool (per-channel IOR + thickness-FBO + cursor-velocity). With all three, the material reads as hand-engineered to a senior creative engineer in 2 seconds.

Reference: drei MeshTransmissionMaterial source has the FBO plumbing pattern; LB Project's blog (https://blog.lbproject.dev/creating-a-refractive-material-with-chromatic-aberration-in-three-js) has from-scratch backside thickness code.

Commit: `phase 1: dispersion lab — back-face thickness FBO`

### Commit 7: 10% viscous undertone

Add subtle vertex displacement using curl-noise on the text vertices, animated on `uTime`. Very low amplitude — the type still reads as type, just *barely* breathes. Reference: ShaderToy https://www.shadertoy.com/view/WccXDj for the noise pattern.

Combined with the dispersion, the type now: refracts (engineering), splits (spectral), responds to cursor velocity (alive), has correct thickness (real optics), and breathes faintly (10% weird-art-school).

Verify: at rest the material looks calm and authoritative. On cursor swipes it intensifies. Closely watching, you can see the faint breath. This is the **brief in pixels**.

Commit: `phase 1: dispersion lab — 10% viscous undertone, signature complete`

### Commit 8: validate against the bar

Side-by-side compare your `/lab/dispersion` to the three closest references:
- Roman Jean-Elie portfolio: https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/
- Codrops glass torus tutorial: https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
- Anatole Touvron: https://anatoletouvron.fr

If yours doesn't read as *at the bar or above*, iterate. Common failure modes: too-low dispersion (looks like CSS filter), no Fresnel (looks flat), no thickness (looks like a sticker).

Once the bar is met: Phase 2 begins (refractive cursor reusing the same lens math).

---

## Architecture rules — must, not nice-to-have

These are non-negotiable per the agency-tier 2026 consensus from research:

1. **Persistent R3F Canvas in root `layout.tsx`**, not per-page. Tunnel-rat or 14islands/r3f-scroll-rig handles DOM↔mesh sync. Phase 1 lab page can be the exception (its own Canvas) but Phase 3 onward = single root canvas.
2. **Lenis for smooth scroll**, not native + Framer Motion `useScroll`. Mount `<ReactLenis root>` in root layout.
3. **GSAP ScrollTrigger orchestrates**, R3F renders. Framer Motion is component-level only.
4. **Drei `ScrollControls` is BANNED** — conflicts with ScrollTrigger pin. Use Lenis + IntersectionObserver instead.
5. **Next.js View Transitions** for route changes. **Critical:** wrap the persistent Canvas with `style={{ viewTransitionName: 'none' }}` — otherwise the browser snapshots WebGL as bitmap on every nav and you get flicker.
6. **Variable font axis morphing in 3D type is NOT viable in 2026.** Pick the cut, bake the atlas, swap atlases for major weight changes only. Live VF axis interpolation in MSDF is research-tier. (DOM type can still animate VF axes via CSS — those rules differ.)

---

## Watch out for — known gotchas

- **Sandbox blocks broad globs on `public/`**. Use named-file deletions: `rm -f public/foo.webp public/bar.webp`, not `rm public/*.webp`.
- **Stale `.next/` cache after deletions**. If typecheck fails with `Cannot find module .../page.js` for a deleted route, run `rm -rf .next && npm run typecheck`.
- **troika-three-text uses internal instancing** in its patched shader. In custom vertex code, use `modelMatrix * vec4(position, 1.0)` for world-space, never `instanceMatrix`. This bites everyone once.
- **iOS Safari `scroll-snap-type: mandatory`** disables momentum scrolling (WebKit bug 243582). Use `proximity` or skip CSS snap entirely and let Lenis handle near-snap.
- **Hot reload + R3F + custom shaders** sometimes leaks GPU memory. If dev server gets sluggish, full reload.
- **Anti-slop hooks are armed.** `console.log` is banned (use `console.warn`/`console.error`). `import * as THREE from 'three'` is banned (use named imports). `eslint-disable` is banned — fix the code instead.

---

## Three references to read before writing GLSL

1. **Maxime Heckel — Refraction, dispersion, and other shader light effects**
   https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/
   *Definitive walkthrough with code. Read in full. Has the FBO plumbing, per-channel IOR loop, and the rygcbv extension.*

2. **Codrops — Warping 3D Text Inside a Glass Torus (Mar 2025)**
   https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
   *Closest match to our use case. R3F + drei `<Text>` + transmission. Read for the composition; we'll diverge with custom dispersion.*

3. **Taylor Petrick — Simulating Dispersion With OpenGL**
   https://taylorpetrick.com/blog/post/dispersion-opengl
   *The original rygcbv 6-channel spectral split. Has the spectral-to-RGB matrix and IOR offsets per wavelength. Read before commit 4.*

---

## What survived for later phases

These exist intact, do not touch in Phase 1:

- `web/src/data/projects.ts` — all project content (titles, bodies, station subtitles, frieze items, masthead blocks). Schema migration happens Phase 4.
- `web/src/components/spotlights/` — CraftedKitPipelineSpotlight + NewBelgiumSpotlight. Bespoke case study content. Wired in during Phase 4.
- `web/public/work/` — case study images and videos.
- `web/public/images/diagrams/` — methodology + agent-pipeline diagrams.
- `web/public/assets/graphics/case-study/` — case study spotlight images.
- `web/public/fonts/` — currently has the existing fonts; you'll add Fraunces.ttf in Phase 1 commit 1.
- `copy-archive.md` (repo root) — voice/copy reference.
- `todo.trail-archive.md` — historical planning, ignore.

---

## Phase order ahead (do not start out of order)

- **Phase 1** (you are here) — dispersive material at `/lab/dispersion`, standalone test surface.
- **Phase 2** — refractive lens cursor reusing the same shader math, on the same lab page first.
- **Phase 3** — homepage rebuild: persistent root-layout Canvas, 3 panels (hero / work grid / contact), Lenis + GSAP plumbing.
- **Phase 4** — case study template rebuild + projects.ts schema migration (`station` → numbered chapter, `specimen`/`frieze` → media-block, `masthead` → 3D type title panel) + rewire spotlights.
- **Phase 5** — `/lab` per-case-study sub-routes (Immersive Garden's `/backstage` pattern, but named `/lab` per Sam's pick) + 404 + loading + footer + easter eggs.

Each phase ends with `npm run guardrails` green and a single commit.

---

## If you're a fresh Claude reading this

1. `git log --oneline -5` to see where commits are.
2. `cat todo.md` for the strategic brief.
3. `cat copy-archive.md` if you need to reference original copy voice.
4. **Do not relitigate the locked decisions table above.** Sam already grilled through them.
5. Ask Sam before pushing to `origin/staging` — the "shared state" convention applies.
6. Auto mode may or may not be active when you arrive. Either way, the project workflow is: plan → check in → execute → commit. Verify the plan in this file and the user's latest message; do not invent new direction.

Last touched: Phase 0 commit `9c73245` shipped + pushed. Phase 1 is the work that defines whether this redesign reads as agency-tier or amateur. Take it seriously.
