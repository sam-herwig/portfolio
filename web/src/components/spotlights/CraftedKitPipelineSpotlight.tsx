'use client';

import { useRef } from 'react';
import { m, useScroll, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';

/**
 * Sticky 250vh scroll-driven pipeline. Todd pinned as conductor. 9 beats —
 * 4 agents × 4 HITL gates + an intro — crossfade through on scroll. Counts
 * strip reveals on the final beat.
 */

type Beat =
  | {
      kind: 'agent';
      step: string;
      title: string;
      role: string;
      annoHeading: string;
      annoBody: string;
      annoArtifact: string;
      start: number;
      end: number;
    }
  | {
      kind: 'gate';
      step: string;
      title: string;
      annoHeading: string;
      annoBody: string;
      start: number;
      end: number;
    };

const BEATS: Beat[] = [
  {
    kind: 'agent',
    step: '01',
    title: 'Jackson',
    role: 'Research',
    annoHeading: 'Jackson · Research',
    annoBody:
      'Reads the brief. Pulls 5+ live reference sites. Drafts three directions with motion budget, palette, and interaction constraints — each with what-to-steal / what-to-avoid notes per reference.',
    annoArtifact: 'RESEARCH_DECK.md',
    start: 0.05,
    end: 0.14,
  },
  {
    kind: 'gate',
    step: 'G1',
    title: 'Mission Approval',
    annoHeading: 'Sam reviews — Mission Approval',
    annoBody:
      'I walk every reference one by one, pick 1 of 3 directions, set the motion budget, edit the reference list, and add anything the deck missed. No mission moves past this without me.',
    start: 0.14,
    end: 0.22,
  },
  {
    kind: 'agent',
    step: '02',
    title: 'Chad',
    role: 'Design',
    annoHeading: 'Chad · Design',
    annoBody:
      'Translates the approved direction into design tokens and a scroll-by-scroll scene description. Palette (P3), lighting, materials, interaction model, restraint tier — all structured so Kyle can build without guessing.',
    annoArtifact: 'DESIGN_TOKENS.json + SCENE_DESCRIPTION.md',
    start: 0.22,
    end: 0.31,
  },
  {
    kind: 'gate',
    step: 'G2',
    title: 'Creative Review A',
    annoHeading: 'Sam reviews — Creative Review A',
    annoBody:
      'The scene description has to read like a real interaction. Palette, motion budget, mobile legibility, and industry fit all pass before we touch code.',
    start: 0.31,
    end: 0.39,
  },
  {
    kind: 'agent',
    step: '03',
    title: 'Kyle',
    role: 'Build',
    annoHeading: 'Kyle · Build',
    annoBody:
      "Builds the R3F component. Custom GLSL when standard-PBR won't get there. Hard gate — no dev begins without all five upstream artifacts on disk.",
    annoArtifact: 'components/heroes/[slug]/',
    start: 0.39,
    end: 0.48,
  },
  {
    kind: 'gate',
    step: 'G3',
    title: 'Creative Review B',
    annoHeading: 'Sam reviews — Creative Review B',
    annoBody:
      'Live on localhost, desktop and phone. I score the Useful Test: text readability, industry fit, interaction purpose, first impression, mobile-first motion. Two rounds max.',
    start: 0.48,
    end: 0.56,
  },
  {
    kind: 'agent',
    step: '04',
    title: 'Brad',
    role: 'QA',
    annoHeading: 'Brad · QA',
    annoBody:
      'Runs hero:audit, build, and smoke. Validates the motion-budget claim. Blocks on 60-FPS violations, bundle size, and style drift. Zero flags or it goes back to Kyle.',
    annoArtifact: 'Clean audit, or back to Kyle',
    start: 0.56,
    end: 0.65,
  },
  {
    kind: 'gate',
    step: 'G4',
    title: 'Ship',
    annoHeading: 'Sam reviews — Ship',
    annoBody:
      'Todd opens the PR with a narrative mission summary. I run one more pass on desktop and phone, approve, and merge. Hero promotes to live with .webm + .webp previews generated.',
    start: 0.65,
    end: 0.73,
  },
];

const COUNTS = [
  { value: '5', label: 'Agents' },
  { value: '22', label: 'Commands' },
  { value: '8', label: 'Hook Matchers' },
  { value: '2', label: 'Pipelines' },
];

export default function CraftedKitPipelineSpotlight({ caption }: { caption?: string }) {
  const reduced = useReducedMotion();
  const outerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
  });

  // Which beat is active — -1 = intro, 0..7 = BEATS index, 8 = final counts
  const activeIdx = useTransform(scrollYProgress, (p) => {
    if (p >= 0.73) return 8;
    for (let i = BEATS.length - 1; i >= 0; i--) {
      if (p >= BEATS[i].start) return i;
    }
    return -1;
  });

  const toddOpacity = useTransform(scrollYProgress, [0, 0.05], [0.2, 1]);
  const introOpacity = useTransform(scrollYProgress, [0, 0.04, 0.06], [1, 1, 0]);
  const countsOpacity = useTransform(scrollYProgress, [0.7, 0.78], [0, 1]);

  return (
    <figure className="relative mx-auto max-w-6xl">
      <div ref={outerRef} className="relative h-[250vh]">
        <div className="sticky top-[100vw] flex h-[calc(100svh-100vw)] items-center justify-center md:top-0 md:h-screen">
          <div className="w-full">
            <PipelineFrame
              activeIdx={activeIdx}
              toddOpacity={toddOpacity}
              introOpacity={introOpacity}
              countsOpacity={countsOpacity}
              reduced={reduced ?? false}
            />
          </div>
        </div>
      </div>

      {caption ? (
        <p className="mt-5 text-center font-instrument text-base italic text-foreground/55">{caption}</p>
      ) : (
        <p className="mt-5 text-center font-instrument text-base italic text-foreground/55">
          One brief in. One pull request out. Four specialists, four gates — I sit at every one.
        </p>
      )}
    </figure>
  );
}

function PipelineFrame({
  activeIdx,
  toddOpacity,
  introOpacity,
  countsOpacity,
  reduced: _reduced,
}: {
  activeIdx: MotionValue<number>;
  toddOpacity: MotionValue<number>;
  introOpacity: MotionValue<number>;
  countsOpacity: MotionValue<number>;
  reduced: boolean;
}) {
  return (
    <div className="relative border border-foreground/20 bg-background/60 p-3 shadow-[0_8px_48px_-12px_rgba(0,0,0,0.15)] md:p-10">
      <p className="mb-5 hidden text-center font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/55 md:block">
        Interactive Specimen — The Pipeline
      </p>
      {/* Todd — pinned conductor */}
      <m.div style={{ opacity: toddOpacity }} className="mb-3 flex justify-center md:mb-6">
        <div className="flex items-center gap-3 rounded-full border border-foreground/30 bg-background px-4 py-1.5 md:px-5 md:py-2">
          <span aria-hidden className="block size-1.5 rounded-full bg-foreground" />
          <span className="font-instrument text-base italic text-foreground md:text-lg">Todd</span>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-foreground/50 md:text-[10px]">
            Orchestrator
          </span>
        </div>
      </m.div>

      {/* Beat ribbon — desktop only: full horizontal ribbon, all cells visible */}
      <div className="hidden md:flex md:flex-row md:items-center md:gap-0">
        {BEATS.map((beat, i) => (
          <BeatCell key={beat.step} beat={beat} index={i} activeIdx={activeIdx} />
        ))}
      </div>

      {/* Beat zone — mobile only: single active cell, others hidden, swaps as
          scroll advances. Same idiom the annotation panel below uses. */}
      <div className="relative h-16 md:hidden">
        {BEATS.map((beat, i) => (
          <MobileBeatCell key={beat.step} beat={beat} index={i} activeIdx={activeIdx} />
        ))}
      </div>

      {/* Annotation panel — absolute-stacked crossfade */}
      <div className="relative mt-4 min-h-[160px] border-t border-foreground/10 pt-4 md:mt-6 md:min-h-[180px] md:pt-6">
        <m.div style={{ opacity: introOpacity }} className="absolute inset-x-0 mx-auto max-w-3xl px-2 md:px-6">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/55">The Pipeline</p>
          <h3 className="font-instrument text-2xl italic text-foreground md:text-3xl">
            One brief in. One pull request out.
          </h3>
          <p className="mt-3 font-instrument text-base leading-relaxed text-foreground/70 md:text-lg">
            Four specialist agents. Four human gates I sit at personally. Todd routes every mission.
          </p>
        </m.div>

        {BEATS.map((beat, i) => (
          <BeatAnnotation key={beat.step} beat={beat} index={i} activeIdx={activeIdx} />
        ))}

        <FinalAnnotation activeIdx={activeIdx} />
      </div>

      {/* Counts strip — fades in on the final beat */}
      <m.div
        style={{ opacity: countsOpacity }}
        className="mt-4 grid grid-cols-4 gap-y-3 border-t border-foreground/10 pt-4 md:mt-6 md:gap-y-0 md:pt-5"
      >
        {COUNTS.map((c) => (
          <div key={c.label} className="flex flex-col items-center text-center">
            <span className="font-instrument text-4xl text-foreground md:text-5xl">{c.value}</span>
            <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55">{c.label}</span>
          </div>
        ))}
      </m.div>
    </div>
  );
}

function BeatCell({ beat, index, activeIdx }: { beat: Beat; index: number; activeIdx: MotionValue<number> }) {
  // Dim when the beat hasn't been reached yet, full when active or passed.
  const opacity = useTransform(activeIdx, (v): number => (v >= index ? 1 : 0.3));
  const scale = useTransform(activeIdx, (v): number => (v === index ? 1.04 : 1));
  const borderOpacity = useTransform(activeIdx, (v): number => (v === index ? 1 : v > index ? 0.7 : 0.35));
  const borderColor = useTransform(borderOpacity, (o) => `rgba(24, 24, 27, ${o})`);

  if (beat.kind === 'agent') {
    return (
      <m.div style={{ opacity, scale }} className="flex-1 md:min-w-0">
        <m.div
          style={{ borderColor }}
          className="flex flex-row items-center justify-between border bg-background px-4 py-3 md:flex-col md:items-start md:gap-1 md:px-5 md:py-4"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/50">{beat.step}</span>
          <span className="font-instrument text-2xl italic text-foreground md:self-center md:text-2xl">
            {beat.title}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55 md:self-end">
            {beat.role}
          </span>
        </m.div>
      </m.div>
    );
  }

  // HITL gate — diamond
  return (
    <m.div style={{ opacity }} className="flex items-center justify-center py-1 md:px-2 md:py-0">
      <div className="relative h-10 w-10 md:h-12 md:w-12">
        <m.div style={{ scale, borderColor }} className="absolute inset-0 rotate-45 border bg-background" />
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] font-semibold uppercase tracking-[0.15em] text-foreground/70 md:text-[9px]">
          HITL
        </span>
      </div>
    </m.div>
  );
}

// Mobile-only: single active beat. All cells stack absolutely in the same row,
// only the cell whose index matches `activeIdx` is visible. Crossfades as scroll
// advances — same idiom as `BeatAnnotation` below.
function MobileBeatCell({ beat, index, activeIdx }: { beat: Beat; index: number; activeIdx: MotionValue<number> }) {
  const opacity = useTransform(activeIdx, (v): number => (v === index ? 1 : 0));

  if (beat.kind === 'agent') {
    return (
      <m.div style={{ opacity }} className="pointer-events-none absolute inset-x-0 top-0">
        <div className="flex items-center justify-between border border-foreground/70 bg-background px-4 py-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/50">{beat.step}</span>
          <span className="font-instrument text-2xl italic text-foreground">{beat.title}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/55">{beat.role}</span>
        </div>
      </m.div>
    );
  }
  return (
    <m.div
      style={{ opacity }}
      className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center py-1"
    >
      <div className="relative size-12">
        <div className="absolute inset-0 rotate-45 border border-foreground/70 bg-background" />
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-foreground/70">
          HITL
        </span>
      </div>
    </m.div>
  );
}

function BeatAnnotation({ beat, index, activeIdx }: { beat: Beat; index: number; activeIdx: MotionValue<number> }) {
  const opacity = useTransform(activeIdx, (v) => (v === index ? 1 : 0));
  const y = useTransform(activeIdx, (v) => (v === index ? 0 : 8));

  return (
    <m.div style={{ opacity, y }} className="pointer-events-none absolute inset-x-0 mx-auto max-w-3xl px-2 md:px-6">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/55">
        {beat.kind === 'agent' ? `Stage ${beat.step}` : `Gate ${beat.step.replace('G', '')} — ${beat.title}`}
      </p>
      <h3 className="font-instrument text-2xl italic text-foreground md:text-3xl">{beat.annoHeading}</h3>
      <p className="mt-3 font-instrument text-base leading-relaxed text-foreground/70 md:text-lg">{beat.annoBody}</p>
      {beat.kind === 'agent' && (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.25em] text-foreground/50">
          Output → {beat.annoArtifact}
        </p>
      )}
    </m.div>
  );
}

function FinalAnnotation({ activeIdx }: { activeIdx: MotionValue<number> }) {
  const opacity = useTransform(activeIdx, (v) => (v === 8 ? 1 : 0));
  return (
    <m.div style={{ opacity }} className="pointer-events-none absolute inset-x-0 mx-auto max-w-3xl px-2 md:px-6">
      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/55">The Machine</p>
      <h3 className="font-instrument text-2xl italic text-foreground md:text-3xl">Four agents. Four gates. One PR.</h3>
      <p className="mt-3 font-instrument text-base leading-relaxed text-foreground/70 md:text-lg">
        The numbers below are the scaffolding — five agents including Todd, twenty-two Claude commands wiring up each
        mission, eight hook matchers enforcing style and safety, two pipelines (net-new and enhance).
      </p>
    </m.div>
  );
}
