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

The homepage is a single long scroll divided into five "zones" that control both 2D content and 3D scene rendering. The critical architectural piece is the **Module Timeline Contract** (`src/lib/moduleTimeline.ts`).

### Module ownership windows (% of total scroll)

| Module  | Range       | Content                        |
|---------|-------------|--------------------------------|
| Hero    | 0.00–0.22   | Interactive 3D hero            |
| Forest  | 0.22–0.44   | Storytelling cards             |
| Camp    | 0.44–0.64   | Video section                  |
| Alpine  | 0.64–0.84   | Case study cards               |
| Summit  | 0.84–1.00   | Footer                         |

Each module defines `enterStart/enterEnd` and `exitStart/exitEnd` sub-windows for crossfade transitions. Both the HTML overlay (`HomeClient.tsx`) and the 3D scene (`UnifiedScene.tsx`) consume these windows — **never hard-code scroll ranges in components**.

### Key patterns

- **Single Canvas**: One unified Three.js Canvas (`UnifiedScene.tsx`) with modular scene groups — avoids multiple WebGL contexts.
- **Opacity envelope**: Scene groups crossfade via `sceneOpacity()` / `applyGroupOpacity()` from `moduleTimeline.ts`. Content fades use Framer Motion `useTransform`.
- **Content flow**: `HomeClient.tsx` drives scroll progress via Framer Motion `useScroll`, transforms it into per-module opacity/position values.
- **Case study data**: Baked static data in `src/data/projects.ts` (no runtime CMS dependency).

### Custom systems

- **Custom shaders**: `src/components/shaders/` — WoodcutMaterial, RefractionMaterial
- **Custom cursor**: `CustomCursor.tsx` — velocity-reactive, zone-aware, hidden on touch devices
- **Preloader**: `Preloader.tsx` — topographic altitude animation, gates on WebGL readiness
- **Timeline debug**: `src/lib/timelineDebug.ts` — runtime HUD for module timing

## Routing

Next.js App Router in `src/app/`:
- `/` — Homepage (scroll-driven modules)
- `/work/[slug]` — Case study detail page
- `/@modal/work/[slug]` — Parallel route for case study modal overlay

## Styling

- Tailwind CSS v4 with PostCSS plugin (`postcss.config.mjs`)
- CSS custom properties for theming (light/dark via `prefers-color-scheme`) in `globals.css`
- Custom design properties: `--design-variance`, `--motion-intensity`, `--visual-density`
