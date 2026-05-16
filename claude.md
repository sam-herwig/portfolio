# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Standard Workflow
1. Think through the problem, read the codebase for relevant files, and write a plan to `todo.md`.
2. The plan should have a list of todo items that you can check off as you complete them.
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made.
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to `todo.md` with a summary of the changes you made and any other relevant information.

## Repository Structure

This is a multi-project monorepo:

- **`web/`** — Active Next.js 16 portfolio (primary development target)
- **`nuxt/`** — Legacy Nuxt 3 portfolio (mostly inactive)
- **`sanity/`** — Sanity CMS Studio (content schemas)
- **`specs/`** — Architecture/design specification documents

## Commands

All commands run from within `web/`:

```bash
cd web
npm run dev      # Start dev server (Next.js)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (eslint-config-next + TypeScript)
```

Additional scripts:

```bash
cd web
npm run typecheck      # TypeScript check (tsc --noEmit)
npm run format         # Prettier format all src files
npm run format:check   # Prettier check (CI)
npm run guardrails     # lint + typecheck + asset check + build
```

No test framework is configured.

## Anti-Slop Protocol

Automated enforcement chain — these are not advisory. Violations are blocked.

**Pre-commit (Husky + lint-staged):**
- Prettier auto-formats all staged `.ts`, `.tsx`, `.css` files
- ESLint auto-fixes and blocks on errors

**CI (GitHub Actions — `guardrails.yml`):**
- Format check (Prettier)
- Lint (ESLint — all rules below are enforced)
- Typecheck (`tsc --noEmit`)
- Build (`next build`)

**Claude Code hooks (PostToolUse):**
- Every Write/Edit on `.ts`/`.tsx`/`.css` auto-runs Prettier

**Banned patterns (ESLint errors):**
- `import * as THREE from 'three'` — use named imports for tree-shaking
- `console.log` — use `console.warn` or `console.error` only
- Unused variables (without `_` prefix)

**Do not suppress lint rules.** Fix the code, don't add `eslint-disable`.

## Tech Stack (web/)

- **Next.js 16** (App Router, Server Components by default)
- **React 19**, **TypeScript 5**
- **Three.js** + React Three Fiber + Drei (3D scenes)
- **Framer Motion** (scroll-driven UI animations)
- **GSAP** (lower-level animation hooks)
- **Tailwind CSS v4** (styling, via PostCSS)
- **Zustand** (global state — minimal, just preloader flag in `useAppStore`)
- **Phosphor Icons** (icon library)
- Path alias: `@/*` maps to `web/src/*`

## Architecture: Scroll-Driven Module Timeline

The homepage is a single long-scroll section pinned to the viewport, with a single Three.js Canvas behind four HTML overlays. A fragment shader renders all four module backgrounds (Hero / About / Work / Contact) and crossfades between them based on scroll progress.

The critical architectural piece is the **Module Timeline Contract** (`src/lib/moduleTimeline.ts`) — the single source of truth for scroll windows. Both the HTML overlays AND the shader weights consume `MODULE_WINDOWS`; the shader receives `exitStart/exitEnd` as `vec2` uniforms so the JS and GLSL never drift.

### Module ownership windows (% of total scroll)

| Module   | Range       | HTML overlay                      |
|----------|-------------|-----------------------------------|
| hero     | 0.00–0.27   | name + tagline                    |
| about    | 0.14–0.51   | bio paragraph                     |
| work     | 0.39–0.79   | corner case-study cards           |
| contact  | 0.66–1.00   | email CTA + studio link           |

Each transition window is `~0.129` wide (144 svh / 1120 svh total). Adjacent modules overlap on enter/exit — that overlap IS the crossfade region in both the overlay opacity and the shader weight blending. Shader mode names live in `backgroundPresets.ts` and shift as presets evolve; treat that file as the source of truth.

### Inter-module HOLD beat — the chemical reaction

Each transition's HOLD beat (~60 svh, the middle of the 144 svh transition window) hosts a **shader-on-shader chemical reaction**: both the outgoing and incoming module shaders run at fullscreen, and each one's luminance distorts the other's UV. Direction flips at the HOLD midpoint — outgoing imprints on incoming first, incoming disturbs outgoing late. Code lives in `BackgroundField.tsx`'s fragment shader (`chemistryEnvelope` / `chemistryOffset` helpers, `uChem*` uniforms, Leva `Chemistry` folder). Replaced the old letter-moment shader (`LetterFillField`, deleted). See `web/docs/adr/0001-chemical-reaction-replaces-letter-moment.md`.

### Key components

- **`HomeSceneRoot.tsx`** — top-level container. Owns the `useScroll` motion value, the long-scroll section (height = `TIMELINE_HEIGHT_SVH`), the sticky overlay layer, and the pointer listener that writes `mouseTarget` to the scene store.
- **`SceneCanvas.tsx`** — owns the R3F Canvas + clip-path wrapper. Mounts `BackgroundField` and `CaseStudyHeroLayer` inside the Canvas; smooth-lerps the visible canvas slot rect via per-rAF MotionValues.
- **`BackgroundField.tsx`** — single fullscreen `<ScreenQuad>` with all four module modes packed into one fragment. Hosts the chemistry warp during HOLD and the cursor magnet for the whole canvas.
- **`{Hero|About|Work|Contact}Overlay.tsx`** — HTML overlays. Each calls `useTransform` on the scroll progress to derive its own opacity from `overlayOpacity(v, MODULE_WINDOWS[name])`.

### Color management gotcha

Three's `outputColorSpace = SRGBColorSpace` (default in r152+) auto-converts `new Color('#xxxxxx')` uniforms to LINEAR space when uploaded to the shader. Custom `<shaderMaterial>` shaders are responsible for converting back to sRGB at output. `BackgroundField.tsx` ends with `pow(col, vec3(1.0/2.2))` — **do not remove this**, or all the Color-uniform-driven modes will render ~3× too dark and look invisible against the body bg.

### Custom systems

- **Dispersion lab**: `src/components/lab/DispersionMaterial.tsx` — RYGCBV per-channel IOR transmission material for `/lab/dispersion`.
- **Soft blob backdrop**: `src/components/lab/BlobBackdrop.tsx` — fallback for `/lab` routes.

## Routing

Next.js App Router in `src/app/`:
- `/` — Homepage (scroll-driven modules)
- `/work/[slug]` — Case study detail page
- `/@modal/work/[slug]` — Parallel route for case study modal overlay

## Styling

- Tailwind CSS v4 with PostCSS plugin (`postcss.config.mjs`)
- CSS custom properties for theming (light/dark via `prefers-color-scheme`) in `globals.css`
- Custom design properties: `--design-variance`, `--motion-intensity`, `--visual-density`
