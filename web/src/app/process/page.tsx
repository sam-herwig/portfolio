import type { Metadata } from 'next';
import Link from 'next/link';
import SpotlightSlot from '@/components/case-study/SpotlightSlot';
import { SITE_URL } from '@/lib/siteUrl';

const PAGE_TITLE = 'Process — Sam Herwig';
const PAGE_DESCRIPTION =
  'AI engineering for frontend. How I run multi-agent pipelines that ship production WebGL — what they pull off, where humans still own it.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: '/process' },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: '/process',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    creator: '@samherwig',
  },
};

const GOOD_FOR = [
  {
    title: 'Reference research',
    body: 'Pull 5+ live sites from a brief. Annotate steal-from, avoid, and motion budget per reference. Cuts the inspiration-gathering pass from a half-day to a coffee break.',
  },
  {
    title: 'Component scaffolding under tight rules',
    body: 'Given approved direction, palette, and motion budget, agents produce R3F + GLSL components that compile, render, and pass smoke tests. Output is small enough to QA by hand.',
  },
  {
    title: 'Style enforcement',
    body: 'Banned patterns blocked at PostToolUse. Wildcard Three imports, console.log calls, suppressed lint rules — agents physically cannot ship slop because the harness rejects it.',
  },
  {
    title: 'Repetitive operations',
    body: 'Asset conversion, video compression, file moves, mission scaffolding. Deterministic, well-defined work. Native agent territory.',
  },
  {
    title: 'QA and audit',
    body: 'Bundle size, FPS validation, motion-budget claims. Agents run the audit before the PR opens. Faster than manual, more consistent than spot-checks.',
  },
];

const BAD_FOR = [
  {
    title: 'Taste calls on direction',
    body: 'Picking 1 of 3 references requires brand fit, cultural read, trend timing. Agents over-fit to averages. I make the call at Mission Approval — every mission, every time.',
  },
  {
    title: 'Mobile legibility',
    body: 'Does this read on a 375px screen at 14px in motion? Has to be tested on a real phone. Agents miss this. I sit at Creative Review B with the build on my desk and in my pocket.',
  },
  {
    title: 'Compounding architecture',
    body: 'Naming conventions, module boundaries, registry shapes. Agents pick fine-looking answers that compound badly over 100 components. The bones are mine.',
  },
  {
    title: 'Deep stack debugging',
    body: 'Race conditions, GPU vendor quirks, Apple Silicon Metal vs ANGLE, shader precision drift across mobile. Agents flounder. Humans pattern-match.',
  },
  {
    title: 'The "is this any good" gut read',
    body: 'Agents will tell you everything looks great. They cannot replace the gut read of "this is unmissable" versus "this is competent." That is the human gate, full stop.',
  },
];

export default function ProcessPage() {
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'AI Engineering for Frontend',
    description: PAGE_DESCRIPTION,
    url: `${SITE_URL}/process`,
    author: { '@type': 'Person', name: 'Sam Herwig', url: SITE_URL },
  };

  return (
    <main id="main-content" className="min-h-screen w-full">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <nav className="absolute left-8 top-8 z-20 md:left-16">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.3em] text-foreground/55 hover:text-foreground"
          style={{ fontFamily: 'var(--font-geist-mono)' }}
        >
          ← Index
        </Link>
      </nav>

      <article className="w-full pb-24 pt-32 md:pb-32 md:pt-40">
        <header className="mx-auto mb-20 max-w-4xl px-8 md:mb-28 md:px-12 lg:px-16">
          <p
            className="mb-6 text-[14px] tracking-[0.18em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
          >
            Process · AI Engineering for Frontend
          </p>
          <h1
            className="mb-8 text-balance text-5xl font-medium leading-[0.95] tracking-tight md:text-6xl lg:text-7xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
            }}
          >
            I run multi-agent pipelines that ship production WebGL.
          </h1>
          <p
            className="text-balance text-2xl italic leading-[1.2] text-foreground/85 md:text-3xl"
            style={{ fontFamily: 'var(--font-instrument)' }}
          >
            Five specialists. Four human gates I sit at personally. One brief in. One pull request out.
          </p>
        </header>

        <section className="mx-auto mb-24 max-w-3xl px-8 md:mb-32 md:px-12 lg:px-16">
          <p className="text-base leading-relaxed text-foreground/75 md:text-lg">
            The pipeline I built at CraftedKit takes a hero brief — palette, motion budget, industry, restraint tier —
            and routes it through five specialist agents. Research, design, build, QA, and an orchestrator. I sit at
            four hard gates: mission approval, two creative reviews, and ship. Nothing moves between agents without my
            read. The harness enforces style and safety at every Write and Edit, so the output that lands at my desk is
            already past the slop threshold. The point of the system is not to remove me from the loop. It is to put me
            only where my judgment is the binding constraint.
          </p>
        </section>

        <section className="mx-auto mb-24 max-w-6xl px-4 md:mb-32 md:px-12 lg:px-16">
          <SpotlightSlot spotlightId="craftedkit-pipeline" />
        </section>

        <section className="mx-auto mb-24 max-w-4xl px-8 md:mb-32 md:px-12 lg:px-16">
          <p
            className="mb-6 text-[14px] tracking-[0.18em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
          >
            Section 02
          </p>
          <h2
            className="mb-12 text-balance text-4xl font-medium leading-[0.95] tracking-tight md:text-5xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
            }}
          >
            Where agents pull their weight.
          </h2>
          <ul className="grid gap-10 md:gap-14">
            {GOOD_FOR.map((item, i) => (
              <li key={item.title} className="grid gap-3 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                  <p
                    className="text-[12px] tracking-[0.18em] text-foreground/55"
                    style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </p>
                </div>
                <div className="md:col-span-9">
                  <h3
                    className="mb-2 text-xl italic leading-snug text-foreground md:text-2xl"
                    style={{ fontFamily: 'var(--font-instrument)' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-base leading-relaxed text-foreground/70 md:text-lg">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto mb-24 max-w-4xl px-8 md:mb-32 md:px-12 lg:px-16">
          <p
            className="mb-6 text-[14px] tracking-[0.18em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
          >
            Section 03
          </p>
          <h2
            className="mb-12 text-balance text-4xl font-medium leading-[0.95] tracking-tight md:text-5xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
            }}
          >
            Where humans still own it.
          </h2>
          <ul className="grid gap-10 md:gap-14">
            {BAD_FOR.map((item, i) => (
              <li key={item.title} className="grid gap-3 md:grid-cols-12 md:gap-8">
                <div className="md:col-span-3">
                  <p
                    className="text-[12px] tracking-[0.18em] text-foreground/55"
                    style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </p>
                </div>
                <div className="md:col-span-9">
                  <h3
                    className="mb-2 text-xl italic leading-snug text-foreground md:text-2xl"
                    style={{ fontFamily: 'var(--font-instrument)' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-base leading-relaxed text-foreground/70 md:text-lg">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-4xl border-t border-foreground/10 px-8 pt-16 md:px-12 md:pt-20 lg:px-16">
          <p
            className="mb-6 text-[14px] tracking-[0.18em] text-foreground/50"
            style={{ fontFamily: 'var(--font-geist-pixel-square)' }}
          >
            Section 04
          </p>
          <h2
            className="mb-10 text-balance text-3xl font-medium leading-[1] tracking-tight md:text-4xl"
            style={{
              fontFamily: 'var(--font-fraunces)',
              fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
            }}
          >
            Hire the engineer or hire the studio.
          </h2>
          <div className="flex flex-col gap-4">
            <a
              href="mailto:hello@craftedkit.io"
              className="inline-flex w-fit items-baseline gap-3 text-2xl font-medium tracking-tight text-foreground transition-opacity hover:opacity-70 md:text-3xl"
              style={{
                fontFamily: 'var(--font-fraunces)',
                fontVariationSettings: '"opsz" 144, "SOFT" 100, "WONK" 0',
              }}
            >
              hello@craftedkit.io {'↗︎'}
            </a>
            <a
              href="https://craftedkit.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-baseline gap-3 text-base text-foreground/60 underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground/80 md:text-lg"
              style={{ fontFamily: 'var(--font-instrument)' }}
            >
              craftedkit.io {'↗︎'}
            </a>
          </div>
        </section>
      </article>
    </main>
  );
}
