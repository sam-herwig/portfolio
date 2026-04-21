'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { EGG_REGISTRY, type EggId } from '@/lib/eggs/eggRegistry';
import { useFoundEggs } from '@/lib/eggs/useFoundEggs';

const CHECKLIST: { id: EggId; label: string; note: string }[] = [
  { id: 'trailhead', label: 'Trailhead Stamp', note: 'Hero — logo corner' },
  { id: 'owl', label: 'Forest Owl', note: 'Forest — perched card-side' },
  { id: 'ember', label: 'Camp Ember Pop', note: 'Camp — around the fire' },
  { id: 'pennant', label: 'Summit Pennant', note: 'Summit — planted flag' },
  { id: 'station-stamp', label: 'Trail Station Stamp', note: 'Case studies — ranger station' },
  { id: 'margin-note', label: 'Margin Note', note: 'Case studies — folded paper' },
  { id: 'cairn', label: 'The Cairn', note: 'Alpine — three stones' },
];

const STATIONS: { slug: string; src: string; title: string }[] = [
  { slug: 'new-belgium', src: '/stamps/trail-station-nb.webp', title: 'New Belgium' },
  { slug: 'craftedkit', src: '/stamps/trail-station-ck.webp', title: 'CraftedKit' },
  { slug: 'mission-bell', src: '/stamps/trail-station-mb.webp', title: 'Mission Bell' },
  { slug: 'consume-and-create', src: '/stamps/trail-station-cc.webp', title: 'Consume & Create' },
];

const ASCII_MAP = `
        .'.
      .'   '.            ▲
    .'       '.        .'  '.
   /    ▲      \\    .'       '.
  /  .'   '.    '--'            \\
 /  .       '.                   \\
'·'·'·   TRAIL   ·'·'·'·'·'·'·'·'·
          v
       (camp)
          v
   ~~ forest ~~
          v
      [ hero ]
`.trim();

export default function NotebookPage() {
  const foundIds = useFoundEggs((s) => s.foundIds);

  useEffect(() => {
    useFoundEggs.getState().markFound('notebook');
  }, []);

  const isFound = useMemo(() => (id: EggId) => foundIds.includes(id), [foundIds]);
  const totalFound = foundIds.length;
  const totalEggs = EGG_REGISTRY.length;

  return (
    <main className="relative min-h-screen w-full bg-background text-foreground">
      {/* Stitched binding — tiled vertically on the left edge */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 hidden h-full w-[60px] md:block"
        style={{
          backgroundImage: 'url(/notebook/stitched-binding.svg)',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '60px auto',
          opacity: 0.7,
        }}
      />

      {/* Topo page texture */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.08]" aria-hidden="true">
        <Image src="/notebook/topo-bg.svg" alt="" fill className="object-cover" priority />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-20 pl-8 md:px-16 md:py-28 md:pl-24">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">
          Ranger&apos;s Field Journal · Vol. IV
        </p>
        <h1 className="font-instrument text-6xl font-bold leading-none tracking-tight md:text-8xl">Notebook.</h1>
        <p className="mt-6 max-w-xl font-instrument text-xl italic text-foreground/70">
          Everything you found along the way — and a little note from the end of the trail.
        </p>

        {/* Hunt checklist */}
        <section className="mt-16">
          <div className="mb-6 flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">The Hunt</p>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/60">
              {totalFound}/{totalEggs} found
            </p>
          </div>
          <ul className="space-y-4">
            {CHECKLIST.map((item) => {
              const found = isFound(item.id);
              return (
                <li
                  key={item.id}
                  className={`flex items-center gap-5 border-b border-foreground/10 pb-4 ${found ? '' : 'opacity-55'}`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center border ${found ? 'border-foreground/60' : 'border-foreground/20'}`}
                    aria-hidden="true"
                  >
                    {found && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12 L10 17 L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="font-instrument text-xl leading-tight">{item.label}</p>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/45">{item.note}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Station stamps collected */}
        <section className="mt-20">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">
            Trail Station Stamps
          </p>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {STATIONS.map((s) => (
              <figure key={s.slug} className="flex flex-col items-center gap-2">
                <div className="relative aspect-square w-full max-w-[160px] opacity-80">
                  <Image src={s.src} alt="" fill className="object-contain mix-blend-multiply" sizes="160px" />
                </div>
                <figcaption className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55">
                  {s.title}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Handwritten thank-you */}
        <section className="mt-20">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">A Note</p>
          <div className="relative mx-auto h-[80px] w-full max-w-[800px] md:h-[120px]">
            <Image
              src="/notebook/thank-you-handwritten.svg"
              alt="you made it further than most — Sam, from Denver."
              fill
              className="notebook-handwritten object-contain"
              priority
            />
          </div>
        </section>

        {/* ASCII map */}
        <section className="mt-20">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">
            The Map (Unofficial)
          </p>
          <pre className="whitespace-pre font-mono text-[11px] leading-[1.25] text-foreground/55 md:text-xs">
            {ASCII_MAP}
          </pre>
        </section>

        {/* Dev credits — the actual fourth wall */}
        <section className="mt-20 border-t border-foreground/10 pt-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.35em] text-foreground/50">Field Notes</p>
          <p className="max-w-2xl font-instrument text-lg italic leading-[1.5] text-foreground/65">
            Built in Next.js with Three.js, GSAP, and a lot of black ink. Shaders are hand-cut GLSL; the compass is a
            real luminance sampler. No analytics on this page. You can press{' '}
            <span className="rounded border border-foreground/25 bg-foreground/5 px-1.5 py-0.5 font-mono text-xs">
              ]
            </span>{' '}
            from anywhere to come back.
          </p>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">
            Sam Herwig · Denver · 2026
          </p>
        </section>

        <div className="mt-20">
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/60 transition-colors hover:text-foreground"
          >
            ← Back to trail
          </Link>
        </div>
      </div>

      <style jsx global>{`
        .notebook-handwritten path {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: notebook-draw 2.4s ease-out forwards;
        }
        .notebook-handwritten path:nth-of-type(n + 2) {
          animation-delay: calc(0.05s * var(--i, 1));
        }
        @keyframes notebook-draw {
          to {
            stroke-dashoffset: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .notebook-handwritten path {
            stroke-dashoffset: 0;
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}
