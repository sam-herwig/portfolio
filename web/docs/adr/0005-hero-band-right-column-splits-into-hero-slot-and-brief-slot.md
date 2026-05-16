# Hero band right column splits into Hero slot and Brief slot

The case-study **Hero band** (~200svh pinned scroll region at the top of every
`/work/[slug]` page) currently runs a 2-col desktop layout: the canvas pins to
the left half, the right column holds a single `CaseStudyHero` component at
`md:min-h-[100svh]` (year/role/client, title, overview headline + body, tag
chips, "Visit live ↗" CTA). The hero shader runs **cycles = 1** across the
full 200svh, traversing K0→K3 once. Because the hero component occupies only
the top viewport of the band, ~100svh of the right column sits empty while the
shader continues running through K2→K3 — there is nothing to read on the
right while the left half keeps moving.

We're splitting the Hero band's right column into two vertically stacked
`min-h-[100svh]` rectangles: the **Hero slot** on top (unchanged content —
`CaseStudyHero`), and a new **Brief slot** below it. The Brief slot hosts
chapter-01 content sliced from `project.blocks[]` — by convention, the
"01 The Brief" chapter mark plus its first text-block. The slice cuts at the
first `chapter === '02'` marker: everything before it renders in the Brief
slot via a new `variant: 'brief'` render path on the existing
`ChapterMark` / `TextBlockRender` components; everything from chapter 02
onward renders unchanged in the **Body column**. The shader cycle does not
stretch — K0→K1 paces the Hero slot, K2→K3 paces the Brief slot. The band
length, mobile strip behavior, and `heroBandVisibility` exit fade are all
unchanged.

## Why

The "shader continues with nothing to read" stretch in the bottom half of the
band reads as a dead zone. The shader is one of the most expensive pieces of
the page — running its climactic keypoints (K2 and K3) against an empty right
column undersells both halves of the layout. The fix is to keep the right
column moving for the full band, paced against the same shader runway that
already exists.

Chapter 01 ("The Brief") was an obvious source for that content because every
project in `projects.ts` already opens with it as a narrative entry beat. The
chapter mark plus its first text-block form a tight, self-contained intro
that already lives in the data — pulling it up into the band rather than
inventing a new `project.brief` field means there is one authoring surface
(`projects.ts blocks[]`) and one place to evolve the brief copy per project.

Splitting the right column into two named rectangles ("Hero slot" + "Brief
slot") rather than letting brief content flow at natural height beneath the
hero is deliberate: the rigid `min-h-[100svh]` per slot guarantees the right
column has reading content at every scroll position inside the band. A
natural-flow brief would shrink to its content height and leave residual
slack at the bottom of the band — a smaller version of the same problem this
ADR is solving. Two equal slots also map cleanly to the existing shader cycle:
50svh per keypoint × 4 keypoints = 200svh; Hero slot = K0+K1, Brief slot =
K2+K3.

## Considered alternatives

- **Grow the band (e.g., 280–320svh) so chapter-01 has its own dedicated
  scroll runway after the hero.** Avoids reshuffling the existing
  `min-h-[100svh]` hero. Rejected: stretches the shader cycle, diluting each
  keypoint's dwell. The 50svh/keypoint pacing was tuned for the current
  200svh band; growing the band slows the cycle without making it more
  legible.
- **Add a new `project.brief` field (separate from `project.blocks[]` and
  `project.overview`) authored explicitly for this slot.** Rejected:
  introduces a third content surface alongside `overview` and `blocks[]`.
  Chapter-01 already encodes the same narrative beat in `blocks[]`; a parallel
  field would create authoring drift and two places to keep in sync.
- **Render chapter-01 in the right column at its natural content height,
  flowing under the hero.** Rejected: leaves residual slack at the bottom of
  the band because chapter-01 today is ~30–60svh of content inside a 100svh
  budget. The "shader continues with nothing to read" problem reappears at
  smaller scale.
- **Shrink `CaseStudyHero` to its natural content height and give chapter-01
  the rest of the band's right column.** Rejected: changes the hero's
  existing pacing/feel that is already tuned, and re-tunes the hero to fit
  the brief rather than designing the brief to fit the existing hero.
- **Slice viewport-aware (mobile gets no brief slice, returns
  `{ brief: [], body: allBlocks }`).** Rejected: makes the slicing helper
  conditional on viewport, and forces the desktop/mobile render paths to
  diverge in *content shape*, not just layout. Keeping the helper
  viewport-agnostic and collapsing the brief variant's mobile styles to
  body-equivalent gives both viewports the same content with viewport-
  appropriate presentation.
- **Build a parallel `BriefBlockRenderer` + brief-only variant components
  for each block type.** Rejected: duplicates rendering logic and creates
  drift risk between brief and body styling. A `variant: 'body' | 'brief'`
  context prop on the existing renderers keeps brief and body sharing one
  source of truth per block type.
- **Move tags + "Visit live ↗" CTA from the Hero slot to the bottom of the
  Brief slot.** Rejected: dilutes the chapter-mark → text-block rhythm in
  the brief, and separates project-identity metadata (tags, CTA) from the
  hero where it semantically belongs. Tags + CTA stay anchored to the
  Hero slot.

## Consequences

- New `splitBlocks(project) → { brief: ContentBlock[]; body: ContentBlock[] }`
  helper co-located with `projects.ts`. Slice rule: walk `project.blocks[]`,
  collect into `brief` until the first block satisfying
  `block.type === 'chapter' && block.number === '02'`; that block and
  everything after go into `body`. Empty `brief` (project with no
  chapter-01) is a valid output.
- New `CaseStudyBrief.tsx` component renders the brief slice. Mounts inside
  the Hero band's right column as a sibling of `CaseStudyHero`, structured
  as `min-h-[100svh]` with content vertically centered (matching the hero
  slot's pacing).
- `app/work/[slug]/page.tsx` updates: the Hero band's `<section>` right
  column renders both `<CaseStudyHero project={...} />` and
  `<CaseStudyBrief blocks={brief} />`; the Body column maps over `body`
  rather than `project.blocks`. The `min-h-[200svh]` on the section stays.
- `ChapterMark.tsx` and `TextBlockRender.tsx` gain a `variant?: 'body' |
  'brief'` prop (default `'body'`). Brief variant collapses
  `TextBlockRender`'s 12-col grid to a vertical stack, shrinks heading and
  body padding to fit a half-viewport column, narrows the reading column
  (~`max-w-[44ch]`). Brief variant of `ChapterMark` drops the number from
  `clamp(5rem,12vw,12rem)` to ~`clamp(3rem,6vw,5rem)`, the title from
  `md:text-7xl lg:text-[5.5rem]` to ~`md:text-3xl lg:text-4xl`, and the
  slot `min-h` from `60vh` to whatever fits inside the Brief slot's 100svh.
- `BlockRenderer.tsx` accepts the `variant` prop and threads it to the
  individual block renderers. Body usage stays default; brief usage passes
  `variant="brief"`.
- Mobile case-study (`isMobileCaseStudy`): no layout change. The right
  column doesn't exist on mobile — the brief slice renders in the natural
  flow beneath the hero (still inside `<CaseStudyBrief />`), and the brief
  variant's mobile styles collapse to body-equivalent so the reader sees
  visually consistent block typography.
- Authoring constraint (soft): chapter 01 content must fit comfortably in
  ~100svh of right-column reading on desktop. Today's data (chapter-mark +
  one short text-block per project) is well within that budget. Projects
  that exceed it overflow visually inside the right column's natural flow
  — the canvas pin would lose parity with the band's scroll runway. Caught
  by visual review, not enforced by the type system.
- `CONTEXT.md` updated with `Hero slot` and `Brief slot` entries; `Hero
  band`'s definition revised to reference both and to spell out the
  K0→K1 / K2→K3 shader pacing split.
- `caseStudyTimeline.ts` constants (`HERO_BAND_SVH`,
  `HERO_BAND_EXIT_FADE_SVH`) unchanged. `heroBandVisibility` unchanged.
  `CaseStudyHeroLayer`'s `uScroll` binding to `csHeroBandProgress`
  unchanged.
- ADR 0003 (Hero band replaces omnipresent backdrop) stands. This ADR
  refines the layout *inside* the Hero band's right column without changing
  the band's role, length, or shader lifecycle.
