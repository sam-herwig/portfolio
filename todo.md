# samherwig.dev — Pre-launch Audit & Plan (2026-05-16)

> Live target: `staging--vocal-hamster-363b22.netlify.app` → `samherwig.dev`. Awaiting verification before any code is written. Original redesign plan preserved below.

## Audit summary

The build is in good shape on the fundamentals — per-route metadata, JSON-LD, OG image generation, dynamic sitemap/robots, skip link, reduced-motion fallback, WebGL fallback, lazy R3F bundle, optimized image formats. The launch-blockers are narrow:

1. **Staging is wide open to Google** and every page canonicalizes to `samherwig.dev`, which guarantees duplicate-content / cross-domain canonical confusion the moment anyone shares the staging URL.
2. **Skip-to-content link is dead** on `/process` and `/work/[slug]` — both routes use `<main>` without `id="main-content"`.
3. **`netlify.toml` security headers aren't applied** to HTML responses (`Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` declared but absent live — Next adapter shadows them).
4. **`/process` ships no `og:image`/`twitter:image`** — Next isn't inheriting the root `opengraph-image.tsx` because `/process` declares its own `openGraph` block without `images`.
5. **Font preload bloat**: 10 woff2 preloads in `<head>`, including 5 Geist Pixel variants when only `Square` + `Grid` are imported in layout.tsx — Geist's pixel module is preloading sibling variants.

The rest are polish, not blockers.

## Findings by area

### SEO (mostly green)
- ✅ Title, description, canonical, OG, Twitter card, JSON-LD Person (root) + CreativeWork (case study) + Article (process).
- ✅ `generateMetadata` per-slug; per-slug OG image at `/work/[slug]/opengraph-image`.
- ✅ Sitemap covers `/`, `/process`, all 5 `/work/*`. Robots disallows `/lab/`.
- ⚠️ Canonical points at `samherwig.dev` regardless of host — staging deploys will leak to search.
- ⚠️ `/process` missing OG image (root inheritance didn't apply because it overrides `openGraph`).
- ⚠️ `twitter:site` not set (only `twitter:creator`). Minor.
- ⚠️ `personJsonLd` uses `image: ${SITE_URL}/opengraph-image` — that's the route handler URL, not a static .png; works but Google occasionally caches the redirect.

### Accessibility
- ✅ `lang="en"`, skip-link present with visible focus state, reduced-motion fallback path.
- ✅ Videos `aria-hidden="true" role="presentation"`, Canvas wrapper `aria-hidden`.
- ✅ WorkCard has `aria-label="Visit X case study"`, decorative arrows `aria-hidden`.
- ✅ `next/image` with `alt` on every case-study media via `DitheredImage`.
- ✅ Headings: one h1 per page, hierarchy intact (h1 → h2 → h3) on home/process/case study.
- ❌ Skip link points to `#main-content` but only HomeSceneRoot sets that id. `/process` and `/work/[slug]` render `<main>` with no id — skip link goes nowhere for keyboard users on those routes.
- ⚠️ Contrast: a lot of micro-copy uses `text-foreground/40`–`/55` against a near-black shader-driven background. Mostly readable but several spots will fail WCAG AA on lighter shader frames. Worth a contrast pass on the eyebrow labels (`Section 02`, `© Sam Herwig · 2026`, etc.) and the `text-foreground/45` "Denver, CO" line.
- ⚠️ `DitheredImage` renders the `next/image` at `opacity-0` so the WebGL View can paint over it. If WebGL fails on a case study page, the user sees an empty box — there's no fallback path to make the image visible.

### Performance
- ✅ R3F/Three/Drei/GSAP/Framer in `optimizePackageImports`. Canvas is `dynamic({ ssr: false })`. Frameloop pauses on hidden tab. Mobile drops DPR + antialias.
- ✅ Images: AVIF/WebP enabled. Videos `preload="metadata"`, immutable 1y cache.
- ✅ Static prerender (`x-nextjs-prerender: 1`) + Netlify Durable cache.
- ❌ 10 woff2 preloads in `<head>` — 5 Geist Pixel variants (Circle, Grid, Line, Square, Triangle) preloaded though only Square + Grid are imported. Almost certainly `geist/font/pixel` re-exports the bundle. Need to either pin to the imported variants only or drop the unused ones.
- ⚠️ `<SceneCanvasClient />` is mounted in the root layout — every route loads the SceneCanvas chunk after hydration, including `/process` where it returns `null`. Worth gating mount at the route level (Canvas only on `/` and `/work/*`).
- ⚠️ `DitheredImage` requests the full webp via `next/image` AND streams the same texture through `TextureLoader` in `DitheredPlane` — double download per image. Worth a single-source-of-truth (e.g. drop the next/image, or feed `DitheredPlane` from the next/image-served URL only).
- ⚠️ Case study pages are 60KB of HTML — that's the JSON-LD + content blocks inline. Acceptable.

### Content
- ✅ 5 case studies with hero/brief/body blocks, captions, credits, related-sites.
- ✅ Process page reads cleanly.
- ⚠️ Hero tagline + about copy + contact CTA are clear and on-brand.
- ⚠️ No 404 fallback for `/work/<bad-slug>` content beyond the global not-found (the case study page calls `notFound()`, good). Verified `not-found.tsx` exists with `robots: { index: false }` ✅.
- ⚠️ No `/sitemap.xml` entries for any future blog/notes section — fine since none exist yet.

### Security / Headers
- ✅ HSTS, `X-Content-Type-Options: nosniff` ship live.
- ❌ `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options` declared in `netlify.toml` but **not present in live HTML response headers**. The `@netlify/plugin-nextjs` adapter writes Next's own response headers and the toml `[[headers]]` block doesn't merge for prerendered routes.
- ❌ No `Content-Security-Policy` (acceptable for portfolio but a nice-to-have).

## Plan (prioritized)

### P0 — launch blockers
- [ ] **Block staging from search.** Add an `X-Robots-Tag: noindex, nofollow` header for any deploy where `CONTEXT !== 'production'` (Netlify build env) — easiest path is a `_headers` file written at build time, or branch-conditional metadata: in `app/layout.tsx`, return `robots: { index: false, follow: false }` when `process.env.CONTEXT !== 'production'`. Also gate `SITE_URL` so canonicals point at the staging host on staging.
- [ ] **Fix skip-link target.** Add `id="main-content"` to the `<main>` on `app/process/page.tsx` and `app/work/[slug]/page.tsx`.
- [ ] **Add `/process` OG image.** Create `app/process/opengraph-image.tsx` (or add explicit `images: ['/opengraph-image']` to the `openGraph` block in `app/process/page.tsx`).

### P1 — visible polish before launch
- [ ] **Cull font preloads.** Investigate `geist/font/pixel` import — switch to per-variant imports only if available, or drop the unused 3 pixel variants. Goal: 7 → ~4 woff2 preloads.
- [ ] **Route-gate the Canvas mount.** Move `<SceneCanvasClient />` out of `app/layout.tsx`. Mount it only inside `HomeSceneRoot` and the case-study layout. Eliminates ~Three/R3F chunk fetch on `/process` and `/404`.
- [ ] **Live security headers.** Convert `netlify.toml` `[[headers]]` to a `public/_headers` file (which the Next plugin respects) or set headers via `next.config.mjs` `headers()`. Verify with `curl -I` after deploy.
- [ ] **Contrast pass on micro-copy.** Audit `text-foreground/40`–`/55` instances against the darkest shader frames (HOLD beats); bump to `/65` minimum where they fall under AA.
- [ ] **`DitheredImage` WebGL fallback.** When `useWebGLSupport()` returns false, render the `next/image` at `opacity-100` so case studies remain visually meaningful without WebGL.

### P2 — post-launch
- [ ] Add `twitter:site` (e.g. `@samherwig`) alongside `twitter:creator`.
- [ ] Deduplicate the `DitheredImage` image fetch (drop the `next/image` request and source the texture only).
- [ ] Run a real Lighthouse pass against production once `/process` OG + headers + canonical are fixed; capture LCP/CLS/TTI numbers.
- [ ] Consider a minimal `Content-Security-Policy` (script-src 'self' + the Next chunks, img-src 'self' data:, etc.).
- [ ] Add a small `/og` static fallback PNG for older clients that don't render the ImageResponse.

## Verification checklist (after P0 + P1)
- `curl -I` against staging shows `X-Robots-Tag: noindex, nofollow`.
- `curl -I` against production shows `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options`.
- View source on `/process` includes `og:image` + `twitter:image`.
- Tabbing on `/process` and `/work/phantom-labs` from URL bar lands the skip link target inside `<main>`.
- `<head>` preload count drops from 10 → ≤7.
- `/process` and `/404` show no R3F chunk in the Network tab.

## Lighthouse pass — 2026-05-16 (post-deploy)

Ran Lighthouse 13 (desktop preset + mobile default) against staging once the P0+P1 changes shipped. All header / OG / canonical / skip-link / font-preload fixes confirmed live on staging via `curl -I`.

### Scores

| Route | Device | Perf | A11y | Best | SEO |
|---|---|---|---|---|---|
| `/` | Desktop | 94 | 90 | 100 | 66* |
| `/` | Mobile | 57 | 90 | 100 | 66* |
| `/process` | Desktop | 99 | 94 | 100 | 66* |
| `/work/phantom-labs` | Desktop | 97 | 91 | 100 | 69* |
| `/work/phantom-labs` | Mobile | 73 | 91 | — | — |

*SEO 66 is the noindex penalty (intentional on staging — production will score 95+).

### New findings + fixes applied in this pass

1. **Leva auto-mounts a default panel in production.** Both `DevLeva` and `CaseStudyDebugPanel` returned `null` outside dev — but `useControls()` calls in `BackgroundField` / `CaseStudyHeroLayer` still ran, triggering Leva's fallback panel injection. That panel was the source of every "form elements without labels" + "contrast" finding outside of intentional micro-copy. **Fix:** both panels now render `<Leva hidden />` instead of returning null. Should bump a11y from 90/91 → 95+ once deployed.
2. **NextProject `aria-label="Next project: Mission Bell"` vs visible text "Mission Bell"** — accessible name didn't start with visible text (WCAG 2.5.3). **Fix:** flipped to `aria-label="${title} — next project"`.

### Real findings to follow up (deferred)

1. **Mobile LCP on `/` is 10.3 s** under 4× CPU throttle. The Hero `PixelTitle` uses a `clip-path` wipe over 900 ms which probably defers LCP measurement until the wipe settles. Combined with the Canvas/Three init blocking the main thread, this is the biggest opportunity. Worth: render the hero text with its final visible width and animate something cheaper (opacity / transform) instead of clip-path width.
2. **`/process` heading-order failure** — the `CraftedKitPipelineSpotlight` renders `h3`s between the page `h1` and the first `h2`. Either promote the spotlight's headings to `h2`, or downgrade them to `div role="heading" aria-level=...` to match document order.
3. **`/process` contrast findings on Todd / Orchestrator pill** are Lighthouse capturing the scroll-reveal mid-animation. The `m.div style={{ opacity: toddOpacity }}` starts low and ramps as the user scrolls; Lighthouse measures the page state at capture time. Real users see full opacity once they scroll into the section. Fix only if you want a perfect a11y score: bump the initial opacity in the spotlight or move the reveal off `opacity` (which axe-core composites against the bg).
4. **Unused JS estimate: 388 KiB.** Mostly Three.js + R3F + Drei subsystems that ship but aren't used on every route. Real win would come from splitting BackgroundField + CaseStudyHeroLayer into separate dynamic chunks so case-study pages don't ship BackgroundField (and vice versa).
5. **Total byte weight `/` ≈ 2.4 MB** — acceptable for a 3D portfolio. Consider compressing the case-study .webp originals; some look 200–400 KB each.

### Verified live on staging
- `x-frame-options: DENY`, `referrer-policy: strict-origin-when-cross-origin`, `permissions-policy: camera=(), microphone=(), geolocation=()` all ship on HTML.
- `robots.txt` returns `Disallow: /` on staging; HTML carries `<meta name="robots" content="noindex, nofollow">`.
- Canonicals on staging point at the staging host (was: cross-domain to samherwig.dev).
- `/process` carries `og:image` + `twitter:image` (1200×630, with alt).
- `<main id="main-content">` present on `/process` and `/work/[slug]`.
- Font preload count: **10 → 7** woff2s on every route.

## Review (2026-05-16)

All P0 + P1 items shipped. `npm run typecheck`, `npm run lint`, and `npm run build` all green.

**Files touched**
- `web/src/lib/siteUrl.ts` — derives SITE_URL from `CONTEXT` / `DEPLOY_PRIME_URL`, exposes `ALLOW_INDEXING`.
- `web/src/app/layout.tsx` — sets `robots: { index: false, follow: false }` on non-prod deploys; swaps `geist/font/pixel` barrel for two direct `next/font/local` declarations (Square, Grid only).
- `web/src/app/robots.ts` — returns `Disallow: /` on non-prod deploys.
- `web/src/app/process/page.tsx` — adds `id="main-content"`; contrast bump on /40 eyebrow.
- `web/src/app/process/opengraph-image.tsx` *(new)* — bespoke /process OG card.
- `web/src/app/work/[slug]/page.tsx` — adds `id="main-content"`; contrast bump on related-sites tag.
- `web/src/components/SceneCanvasClient.tsx` — gates the dynamic SceneCanvas import on `/` and `/work/*` only.
- `web/next.config.ts` — adds `headers()` for X-Frame-Options / Referrer-Policy / Permissions-Policy.
- `web/src/components/case-study/DitheredImage.tsx` — when WebGL is unsupported, renders `next/image` at opacity-100 instead of an empty box.
- `web/src/components/case-study/{ChapterMark,SpotlightSlot}.tsx`, `web/src/components/sections/{Hero,About,Contact}Overlay.tsx`, `web/src/components/spotlights/{NewBelgium,CraftedKitPipeline}Spotlight.tsx` — `text-foreground/40` and `/45` micro-copy → `/55` (WCAG AA at small sizes).
- `web/src/fonts/GeistPixel-{Square,Grid}.woff2` *(new)* — copied out of `geist` to bypass the barrel.

**Build-verified results**
- Head preload count: **10 → 7** woff2s. Dropped GeistPixel Circle/Line/Triangle.
- `/process` head now ships full `og:image` + `twitter:image` (1200×630, with alt).
- `/process` and `/work/phantom-labs` both render `<main id="main-content">`.
- New prerendered route `/process/opengraph-image` confirmed in build output.

**Notes / deferred**
- `geist` dep stays in `package.json` (still works, just not used for pixel fonts). Removal is a P2 cleanup.
- `netlify.toml` `[[headers]]` are left as-is (they're harmless even if shadowed for HTML; they still apply to assets/webp/mp4 which is what we actually want them for). The Next-level `headers()` covers HTML.
- Security headers fix requires a real Netlify deploy to verify with `curl -I` — couldn't test locally without spinning the prod server.
- Contrast bump kept conservative: only `/40` and `/45` got pushed to `/55`. `/50`+ instances left alone. NewBelgium tab inactive hover bumped to `/85` (was `/75`) to keep the hover gap visible after the bump.

---

## North star

A confident-cheeky, agency-tier portfolio whose single signature is **3D type rendered through a custom dispersive/refractive material** — recurring across hero, section breaks, every case study cover, and the cursor itself. Editorial typographic spine carries taste; one weird-but-clean shader carries engineering. Two things, executed at peak quality. Buyer = US agencies & studios at the Active Theory / Lusion / Hello Monday / Watson DG tier.

## Locked decisions

| Axis | Locked |
|---|---|
| Theme | **Removed entirely.** No metaphor, no regional vocabulary, no trail/forest/summit anywhere. |
| Buyer | US agencies + studios (peer-judged) |
| Organizing principle | Typography + material + motion, converged into one signature |
| Register | Confident-cheeky (clean + senior + a touch of wit; not toy, not lifestyle, not illustrated) |
| Signature | 3D type-mesh + custom dispersive/refractive material, 10% viscous undertone |
| Architecture | Stacked-panel scroll, single fixed R3F canvas, 3-panel ruthless homepage |
| Color | Dark default. Near-black bg, off-white type, mono labels in muted gray. Single accent emerges from dispersion chroma. |
| Motion language | Springy + slight overshoot. Fast in, slow settle. Cursor has momentum. Transitions ramp dispersion intensity, not opacity. |
| Identity | Sam Herwig the freelancer. Personal name as wordmark. |
| Typography | Display: **Fraunces** (OFL, variable, opsz/wght/SOFT/WONK). Body: **Geist Sans** (OFL). Utility: **Geist Mono** (OFL). All free. Hot-swappable later. |

## Highest-signal research findings (the 4 that matter most)

1. **Roman Jean-Elie's portfolio (Codrops, Nov 2025)** is the closest extant match for our exact signature — project titles as WebGL textures with stretch-on-scroll-velocity. Use as architectural reference. https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/
2. **Stack pivot is required, not optional.** Agency-tier 2026 consensus: Lenis + virtual scroll + GSAP ScrollTrigger orchestrating, R3F rendering, Framer Motion downgraded to component-level only. Current site uses Framer Motion `useScroll` everywhere — wrong primitive for this signature.
3. **The "engineered" tell over drei drop-in** is three techniques together: (a) per-channel IOR refraction (or 6-channel rygcbv spectral split), (b) back-face depth FBO pre-pass for thickness on non-convex text geometry, (c) cursor *velocity* (not position) coupled to dispersion uniform. Source: Heckel, Petrick, Anatole Touvron.
4. **Whitespace named explicitly:** no one at agency tier has paired dispersive 3D type with a serif display face. Every existing demo uses geometric sans. Fraunces in dispersion is genuinely differentiated territory.

## Information architecture

### Homepage (3 panels, ruthless)

1. **Hero** — full viewport. Name + one tagline as 3D dispersive type. Cursor is a refractive lens. That's it.
2. **Selected Work** (rename pending — candidates: `Field Notes`, `Drops`, `Work / 12`). Grid of case study tiles. Each tile auto-generates a cover from project title + signature material. Hover deforms.
3. **Contact** — single typographic statement + email. Possibly the Hello-Monday 4-bucket intent split (`work / hi / collab / learn`).

Visible UI tells: scroll-progress numeric (`0.00–1.00`) in a corner, doubling as the dispersion-intensity uniform display.

### Case study pages

- **Title panel:** project name in 3D dispersive type, metadata triple inline below (`Year · Role · Client · Stack · Awards`).
- **Body:** numbered chapters (`01`, `02`, `03`) — free-form count per project, no enforced 5-act schema.
- **Rhythm:** paragraph → visual → paragraph, no text block over ~80 words before a visual break.
- **Outro:** "Next Project" — never "Get in touch" inside a case study.
- **`/lab` sub-route per case study** (Immersive Garden pattern): public surface stays calm and taste-driven; one click reveals shader breakdown, code snippets, easter eggs. Solves the dual-audience problem in one move.

### Other surfaces

- 404 page — high-leverage micro-stage for the signature material
- Loading state — quiet, possibly the dispersion uniform ramping from 0 → 1
- Footer — Rauno-style declarative repetition with clipped fragment

## Tech stack pivot

| Layer | Current (dies) | New |
|---|---|---|
| Smooth scroll | Native + Framer `useScroll` | **Lenis** (`<ReactLenis root>` in root layout) |
| R3F canvas | Per-page | **Persistent in root `layout.tsx`** |
| DOM ↔ mesh sync | Manual | **14islands/r3f-scroll-rig** (or tunnel-rat for lighter touch) |
| Choreography | Framer Motion useScroll + transforms | **GSAP ScrollTrigger** drives shader uniforms via single store |
| Route transitions | None | **Next.js View Transitions API** (`viewTransition: true`) — Canvas wrapped with `viewTransitionName: 'none'` to prevent flicker |
| Triggers | scroll-progress math | **IntersectionObserver** for set-piece triggers |
| Text rendering | Plain DOM | **drei `<Text>` (troika)** + **THREE-CustomShaderMaterial** layered over MeshTransmissionMaterial. Pre-baked MSDF atlas via `msdf-bmfont-web` |
| Variable font axes | n/a | DOM uses live VF axis play (CSS `font-variation-settings`); 3D type uses baked atlas of one chosen variant (live axis morph in MSDF not viable in 2026) |
| Component motion | Framer Motion (full) | Framer Motion (component-level only) |

Stays the same: Next.js 16, React 19, Tailwind v4, ESLint/Prettier/Husky chain, anti-slop hooks.

## Migration matrix

### KEEP (content)
- `src/data/projects.ts` — all project metadata: title, subtitle, slug, tags, projectUrl, year, role, client, stack
- All case study text bodies
- All case study images (`/public/images/...`, project galleries)
- All case study videos (MP4s)
- `text-block`, `media-block`, `video-block`, `spotlight-block` block types — these are theme-neutral

### KILL
- All 19 atmospheric shaders (`src/components/shaders/*Material.ts` — Woodcut, Alpine, Camp, Forest, Sumi, Paper, Water, Fire, Cloud, Dawn, Night, Grove, Silhouette, Ground)
- All trail/atmosphere assets (`/public/forest/`, `/public/alpine/`, `/public/camp/`, `/public/grove/`, `/public/cairn/`, `/public/trail-fork/`, `/public/home-hero/`, animal sprites — fox/bunny/bird, parallax layers)
- Audio assets (`/public/audio/`)
- Trail-themed components: `HeroLandscape`, `DeepForest`, `CaseStudyScene`, `UnifiedScene`, `ScrollLinkedSprite`, `PaperAtmosphere*`, etc.
- `moduleTimeline.ts` — replaced by simpler stacked-panel choreography
- `TRAIL_STATIONS` constant + `StationBreak`, `SpecimenBlock`, `FriezeBlock`, `MastheadBlock` types
- `eggs/` system (trail-themed easter eggs) — replaced with new ones inside the dispersive lens
- `Preloader.tsx` topographic altitude animation
- The custom cursor (replaced with dispersive-lens cursor)

### TRANSFORM
- `src/lib/heroParams.ts`, scroll math helpers — replaced with Lenis + GSAP store
- Custom cursor → refractive-lens cursor
- 5-station case study spine → numbered free-form chapters

## Implementation phases

### Phase 0 — branch & scaffold ✅ shipped (commit `9c73245`)
Trail theme stripped, theme-neutral scaffold compiles, archive branch pushed.

### Phase 1 — signature material ✅ shipped (commits `019ae78`–`11a180f`, `e2c9aac`)
- ✅ Fraunces TTF + drei Text3D + opentype.js typeface.json bake script
- ✅ MeshTransmissionMaterial baseline for A/B
- ✅ Custom per-channel IOR via three-custom-shader-material extending MeshPhysicalMaterial
- ✅ rygcbv 6-channel spectral split (Petrick → Heckel) with 1/2/3 keyboard mode toggle + visible button row
- ✅ Cursor velocity coupling via useMouseVelocity + self-decaying rAF loop
- ✅ Back-face thickness FBO + Beer-Lambert absorption (per-mesh material swap, no scene.overrideMaterial)
- ✅ 10% viscous undertone (multi-axis sin/cos breath)
- ✅ Leva live-tune panel (IOR, refract/fresnel/saturation/absorption/breath) + studio HDRI on all modes
- ✅ Soft 5-blob radial-gradient backdrop replaces test-card stripes
- ✅ Lab `← Index` nav link (no longer one-way)
- 🟡 Validate against bar (Roman Jean-Elie / Codrops glass torus / Anatole) — *user visual review remaining*

### Phase 2 — refractive cursor (1 sitting) — *not started*
- Title-layer render-to-RT
- Cursor as small WebGL plane with same lens math, sampling RT
- Smoothed cursor velocity → dispersion strength uniform
- Magnetic snap to interactive elements via DOM event handoff

### Phase 3 — homepage 3D + persistent canvas (1–2 sittings) — *partial*
- ✅ Hero panel: 3D dispersive type wired into homepage (commit `88506bc`) — *isolated canvas, not yet persistent*
- ✅ Reduced-motion + mobile fallback (static Fraunces title under 768px or with prefers-reduced-motion via useSyncExternalStore)
- ⏳ Persistent Canvas in root layout (current hero is per-page, will need promotion when Phase 2 cursor lands)
- ⏳ Lenis + ReactLenis + GSAP ScrollTrigger plumbing
- ⏳ Selected Work grid: per-project tile material with hover deformation
- ⏳ Scroll-progress numeric in corner (case studies have a thin scroll-progress bar from audit pass — `commit f1bfb1b`)
- ⏳ Next.js View Transitions API (Canvas wrapped in `viewTransitionName: 'none'`)

### Phase 4 — case study template ✅ shipped (commits `1c626be`–`ed51489`, `f1bfb1b`)
- ✅ Schema migration: ChapterBlock replaces station/specimen/frieze/metric/masthead; openingQuote/signatureLandmark/TRAIL_STATIONS dropped
- ✅ Per-project block migration (4 case studies, ~17 blocks each, all theme-neutral; year/role/client/deliverables filled with drafts to tighten)
- ✅ Nine render components (`CaseStudyHero`, `ChapterMark`, `TextBlockRender`, `MediaBlockRender`, `VideoBlockRender`, `SpotlightSlot`, `BlockRenderer`, `NextProject`, `ScrollProgress`)
- ✅ Spotlight registry (CraftedKitPipelineSpotlight, NewBelgiumSpotlight) wired via dynamic import + ssr:false
- ✅ Instrument Serif font wired up via next/font
- ✅ NextProject full-bleed reveal footer (per 2026 dominant pattern from research)
- ✅ Reveal wrapper (framer-motion in-view fade + blur) on every block
- ✅ Homepage: editorial 2-column grid w/ thumbnails, mono index/year strip, Fraunces title, Instrument subtitle (now with Reveal language to match case studies)
- ✅ Case study hero: full-bleed banner image with title seated into bottom gradient + 4/8 editorial lede grid (audit pass — was a text-wall before)
- ✅ Thin scroll progress bar pinned to top of `/work/[slug]`
- ✅ Dual-track `/work/[slug]/lab` sub-route for backstage notes (CraftedKit + New Belgium have content; others 404 — only depth-warranted projects get a lab)
- ⚠ Note: year/role/client placeholders are *drafts* — verify before shipping public

### Phase 5 — final polish (1 sitting) — *partial; remaining items*
- ⏳ 404 with the dispersion signature
- ⏳ Loading state
- ⏳ Site footer (currently minimal copyright line on home only)
- ⏳ Easter eggs
- ⏳ Section name decision: `Selected Work` vs `Field Notes` / `Drops` / `Work / 12`

## Branch plan (RESOLVED)

- **Trail-theme code preserved on `archive/trail-theme`** (pushed to origin, permanent reference).
- **Redesign work happens directly on `staging`** going forward.
- Strategy: aggressive delete of KILL list in Phase 0 on `staging` → keep only infrastructure (Next config, ESLint, Husky, package.json, Tailwind, anti-slop hooks) + content (projects.ts data, case study assets).
- Rollback: `git checkout archive/trail-theme` recovers everything.

## Open questions for Sam

1. ~~Plan directionally right?~~ ✅ Confirmed.
2. ~~Branch strategy?~~ ✅ Archive at `archive/trail-theme`; redesign on `staging`.
3. `Selected Work` section rename — `Field Notes` / `Drops` / `Work / 12` / something else? *(can be tuned later, not blocking)*
4. ~~`/backstage` route name?~~ ✅ `/lab`.

## Reference dump (curated, not exhaustive)

### Direct architectural matches
- Roman Jean-Elie portfolio (Codrops Nov 2025): https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/
- Stefan Vitasović portfolio (Codrops Mar 2025): https://tympanus.net/codrops/2025/03/05/case-study-stefan-vitasovic-portfolio-2025/
- Arnaud Rocca portfolio (Codrops Mar 2026): https://tympanus.net/codrops/2026/03/31/arnaud-roccas-portfolio-from-a-gsap-powered-motion-system-to-fluid-webgl/
- Corentin Bernadou portfolio (Codrops Mar 2026): https://tympanus.net/codrops/2026/03/05/inside-corentin-bernadous-portfolio-swiss-inspired-layouts-webgl-geometry-and-thoughtful-motion/

### Signature material references
- Codrops "Warping 3D Text Inside a Glass Torus" (Mar 2025): https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
- Maxime Heckel "Refraction, dispersion": https://blog.maximeheckel.com/posts/refraction-dispersion-and-other-shader-light-effects/
- Taylor Petrick "Simulating Dispersion": https://taylorpetrick.com/blog/post/dispersion-opengl
- drei MeshTransmissionMaterial source: https://github.com/pmndrs/drei/blob/master/src/core/MeshTransmissionMaterial.tsx
- Codrops Anatole Touvron case study: https://tympanus.net/codrops/2022/01/14/case-study-anatole-touvrons-portfolio/
- ShaderToy liquid glass (viscous undertone): https://www.shadertoy.com/view/WccXDj

### Cursor lens
- Ben Godfrey 3D cursor DOM refraction: https://www.awwwards.com/inspiration/3d-cursor-dom-refraction-link-hover-animation-ben-godfrey-selected-work
- Dorian Lods refraction hover: https://www.awwwards.com/inspiration/webgl-refraction-hover-effect-dorian-lods-portfolio-2025
- Codrops "Progressively Enhanced WebGL Lens": https://tympanus.net/codrops/2023/10/10/progressively-enhanced-webgl-lens-refraction/
- Codrops mouse flowmap (OGL): https://tympanus.net/codrops/2019/09/25/mouse-flowmap-deformation-with-ogl/

### Stack & architecture
- pmndrs/react-three-next (persistent canvas template): https://github.com/pmndrs/react-three-next
- pmndrs/tunnel-rat: https://github.com/pmndrs/tunnel-rat
- 14islands/r3f-scroll-rig: https://github.com/14islands/r3f-scroll-rig
- Lenis: https://www.lenis.dev/
- Codrops "Composite Rendering" (Feb 2026): https://tympanus.net/codrops/2026/02/23/composite-rendering-the-brilliance-behind-inspiring-webgl-transitions/
- Next.js viewTransition config: https://nextjs.org/docs/app/api-reference/config/next-config-js/viewTransition

### Text rendering
- drei `<Text>`: https://drei.docs.pmnd.rs/abstractions/text
- troika createDerivedMaterial: https://protectwise.github.io/troika/troika-three-utils/createDerivedMaterial/
- THREE-CustomShaderMaterial: https://github.com/FarazzShaikh/THREE-CustomShaderMaterial
- countertype/three-text: https://github.com/countertype/three-text
- msdf-bmfont-web: https://msdf-bmfont.donmccurdy.com/

### Senior creative engineer peers
- Anatole Touvron: https://anatoletouvron.fr
- Henry Heffernan: https://henryheffernan.com
- Maxime Heckel: https://maximeheckel.com
- Rauno Freiberg: https://rauno.me
- Robin Noguier: https://robin-noguier.com
- Cody Bennett: https://codyb.co
- Robin Mastromarino: https://www.awwwards.com/sites/robin-mastromarino-portfolio-1

### Agency benchmarks
- Active Theory: https://activetheory.net
- Lusion: https://lusion.co
- Immersive Garden (Awwwards Agency 2025): https://immersive-g.com
- Malvah Studio (Awwwards Studio 2025): https://malvah.co
- Hello Monday: https://hellomonday.com
- Watson DG: https://watsondg.com
- Tendril: https://tendril.studio

### Microcopy / IA
- Rauno: https://rauno.me
- Linear: https://linear.app
- Anyways Studio: https://anyways.studio
- Bonhomme: https://bonhomme.lol
- Hello Monday (4-bucket contact): https://hellomonday.com

### Typography
- Fraunces: https://fonts.google.com/specimen/Fraunces (OFL)
- Newsreader: https://fonts.google.com/specimen/Newsreader (OFL, Production Type)
- Instrument Serif: https://fonts.google.com/specimen/Instrument+Serif (OFL)
- Geist Sans: https://vercel.com/font (OFL)
- Geist Mono: https://fonts.google.com/specimen/Geist+Mono (OFL)

---

# Feedback pass — 2026-05-18

Four independent plans from a feedback round. Each is small and reversible. Each was grilled with the user via `/grill-with-docs` before this writeup; decisions are captured.

## Plan 1 — INDEX link: history-back behavior + viewport-pinned

**Goal:** Clicking "← INDEX" inside a case study returns the visitor to the homepage with their **Work grid** scroll position preserved (mimicking the browser back button). Link stays reachable at any scroll depth.

**Decisions:**
- Smart fallback: `router.back()` only when `document.referrer` has the same origin AND `history.length > 1`; otherwise `router.push('/')` (covers deep links / direct URLs / refresh).
- Pin behavior: fixed to the viewport, always visible from scroll=0 (no threshold/appear).
- Visual: keep the current naked text (`text-foreground/55 hover:text-foreground`) — no chip / no backdrop-blur.

**Tasks:**
- [ ] Extract INDEX into a small client component (`web/src/components/case-study/IndexLink.tsx`). `page.tsx` is currently a Server Component.
- [ ] Click handler: check same-origin referrer + `history.length > 1` → `router.back()`; else `router.push('/')`.
- [ ] Change positioning from `absolute left-8 top-8 z-20` → `fixed left-8 top-8 z-30 md:left-16` so it stays pinned through scroll.
- [ ] Confirm stacking against the case-study `ScrollProgress` bar (also `z-30`, but at `top-0` as a thin bar — shouldn't collide).
- [ ] Verify on mobile that the fixed link doesn't collide with the hero-band title.
- [x] `web/CONTEXT.md`: add "Index link" glossary entry (done during grilling).

**Files:** `web/src/app/work/[slug]/page.tsx:69–77`, new `web/src/components/case-study/IndexLink.tsx`.

## Plan 2 — Mission Bell "missing" images (silent DitheredPlane failures)

**Goal:** Image blocks on case-study pages never silently disappear. When `DitheredPlane`'s texture load throws, fall back to the plain Next.js `<Image>` already mounted in the tree.

**Diagnosis:**
- All referenced files exist on disk. NOT an asset-missing issue.
- `DitheredPlane` runs `useTexture(src)` inside `<Suspense fallback={null}>` with no error boundary (`DitheredImage.tsx:35`, `DitheredPlane.tsx:93`). Failures get swallowed. The `<Image>` stays at `opacity-0` (`DitheredImage.tsx:31`); the caption keeps rendering because it lives in the parent `MediaBlockRender.tsx:27`.
- User confirmed other case studies have broken images too → architectural, not asset-specific.

**Decisions:**
- Both patch AND log: graceful UI fallback + `console.warn` for root-cause breadcrumbs.
- Per-block error boundary (one bad image doesn't take down the rest).

**Tasks:**
- [ ] Add a small `ErrorBoundary` class component (or use `react-error-boundary` if it's in deps — verify first).
- [ ] Wrap `DitheredPlane` inside `DitheredImage.tsx` with the boundary.
- [ ] On caught error: `console.warn('[DitheredImage] texture failed', { src, error })`, then promote the underlying `next/image` from `opacity-0` → `opacity-100`.
- [ ] Smoke-test every case study (MB, NB, C&C, CK, PL) by viewing all media blocks.
- [ ] Capture the actual error message from console once logging lands — feeds a follow-up root-cause investigation.

**Files:** `web/src/components/case-study/DitheredImage.tsx`, `web/src/components/case-study/DitheredPlane.tsx`.

## Plan 3 — WebGL slot motion: more glide

**Goal:** The canvas slot rect traveling between Hero / About / Work / Contact feels softer and has more "weight" relative to scroll. Same total travel distance — just trails the scroll instead of snapping.

**Diagnosis:**
- Slot rect (clip-path) is exponentially damped at `k = 30` (`SceneCanvas.tsx:221`) — current half-life ≈ 23ms.
- User wants more glide, not more scroll runway. (Widening transition windows in `moduleTimeline.ts` was explicitly rejected.)

**Decisions:**
- Lower `k` from `30` → `15` (~46ms half-life, 2× the current lag).
- A/B in the browser; dial up/down from there.

**Tasks:**
- [ ] `web/src/components/SceneCanvas.tsx:221` — change `const k = 30` → `const k = 15`.
- [ ] Open `localhost:3000`. Scroll through hero→about, about→work, work→contact on desktop. Compare to "before" feel.
- [ ] If too sluggish → bump to `k = 20`. If still too tight → drop to `k = 10`. One number knob.
- [ ] Confirm `uModuleCenter` (line 240, derives from the same MotionValues) still tracks correctly — shapes should remain anchored to the slot center.

**Files:** `web/src/components/SceneCanvas.tsx` (one line).

## Plan 4 — Contact module typography: fewer fonts

**Goal:** Reduce typeface count on the Contact overlay from 4 → 3, matching Hero/About/Work.

**Diagnosis:**
- Contact currently uses: **Pixel Square** (heading), **Instrument** (body + sub-line), **Fraunces** with variable-axis (email CTA), **Geist Mono** (meta) = 4 typefaces in one ~60svh block.
- Other overlays use 3 max.
- User explicitly said *"sizing and hierarchy seems pretty good"* — so we do NOT touch sizes, hierarchy, or any other element.
- Fraunces IS used elsewhere on the site (WorkOverlay, case-study pages, /process). Removing it from Contact doesn't shrink the site-wide font system, only this one block.

**Decisions:**
- Swap email CTA `var(--font-fraunces)` (with `"opsz" 144, "SOFT" 100, "WONK" 0`) → `var(--font-geist-pixel-square)` (matches the "Contact" PixelTitle above it).
- Drop `fontVariationSettings` (pixel font isn't variable).
- Leave body paragraph, "Or run the studio" sub-line, and mono meta UNTOUCHED.
- Bold/quirky choice acknowledged: pixel-font email at md:text-5xl / lg:text-6xl is unusual but intentional. Fall back to inheriting the default body sans only if it reads as a layout bug.

**Tasks:**
- [ ] `web/src/components/sections/ContactOverlay.tsx:33–37` — swap inline `fontFamily` to `var(--font-geist-pixel-square)`, drop the `fontVariationSettings` line.
- [ ] Scroll to Contact at `localhost:3000`, confirm the email reads as intentional craft and not as a bug.
- [ ] If it feels wrong, fall back to removing `fontFamily` entirely so the email inherits the default sans.
- [ ] No font-import changes — Fraunces still loaded for the rest of the site.

**Files:** `web/src/components/sections/ContactOverlay.tsx` (lines 33–37 only).

## Suggested execution order

Independent — pick any order. Suggested by ascending size:

1. **Plan 4** — 1 file, 1 line. Fastest visible win.
2. **Plan 3** — 1 file, 1 number. Tune live in the browser.
3. **Plan 2** — error boundary + fallback. Restores broken images.
4. **Plan 1** — new client component + smart back behavior. Largest of the four but still small.

## Review

All four plans shipped. `npm run guardrails` green (lint, typecheck, asset check, build).

**Files touched**
- `web/src/components/sections/ContactOverlay.tsx` — email CTA: `var(--font-fraunces)` w/ WONK/SOFT axis settings → `var(--font-geist-pixel-square)`. Dropped `fontVariationSettings`. 4 typefaces → 3 on the Contact block.
- `web/src/components/SceneCanvas.tsx:221` — slot-rect damping `k = 30` → `k = 15` (~46ms half-life, 2× the prior lag). Comment block above updated to reflect the new value.
- `web/src/components/case-study/DitheredImage.tsx` — added inline `DitheredErrorBoundary` class component wrapping `<Suspense>` inside `<View>`. On caught error: `console.warn('[DitheredImage] texture failed', { src, error })` + flips `shaderFailed` state, promoting the underlying `next/image` from opacity-0 to opacity-100. Per-block: one bad texture doesn't take down siblings.
- `web/src/components/case-study/IndexLink.tsx` *(new)* — client component. Smart fallback: `router.back()` if `document.referrer` is same-origin AND `history.length > 1`; else `router.push('/')`. Modifier-key check (`metaKey|ctrlKey|shiftKey|button!==0`) early-returns so cmd-click / middle-click still open in new tab. Fixed `top-8 left-8 md:left-16 z-40` so it pins to the viewport at any scroll depth.
- `web/src/app/work/[slug]/page.tsx` — removed inline `<nav>` + `<Link>` for INDEX; imported and rendered `<IndexLink />`. Removed now-unused `import Link from 'next/link'`.
- `web/CONTEXT.md` — added "Index link" glossary entry (during grilling, not in this execution pass).

**Verification done**
- Lint: clean. (Initial pass flagged `@next/next/no-html-link-for-pages` for the `<a href="/">` in IndexLink — fixed by swapping to Next's `<Link>` with onClick. Link respects `event.defaultPrevented`.)
- Typecheck: clean.
- Asset size check: clean.
- Build: succeeds. All 19 static pages generated. /work/[slug] still SSG.

**Manual checks still to do**
- Open `localhost:3000`, scroll through the homepage. Confirm the slot motion `k=15` glide feels right; dial to 10 or 20 if not.
- Open a case study with broken images (any of the 5). Confirm the static `next/image` now renders where the DitheredPlane was silently failing. Open devtools and grab the `[DitheredImage] texture failed` console warning + the error message — feeds a follow-up root-cause investigation.
- Open Contact module. Confirm pixel-font email reads as intentional design at md:text-5xl / lg:text-6xl, not as a layout bug. If it reads wrong, fall back to removing `fontFamily` entirely so it inherits the default body sans.
- Click INDEX from a case study reached via the homepage → confirm scroll position restores in the Work grid section.
- Open a case study via a fresh tab (direct URL). Click INDEX → confirm fresh navigation to `/`, no off-site redirect.
- Cmd-click / middle-click INDEX → confirm new tab opens with `/`.

**Deferred**
- Root-cause of why `DitheredPlane`'s `useTexture` was failing — we now have a fallback + log, but the underlying cause (CORS / decode / R3F race) is still unknown. Capture the console warnings once they appear and investigate in a follow-up.
- Fraunces is still loaded site-wide for WorkOverlay, CaseStudyHero, ChapterMark, NextProject, /process, /not-found, /lab/dispersion. Not removed.
