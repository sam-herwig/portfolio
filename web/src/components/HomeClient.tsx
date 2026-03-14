'use client';

import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import CaseStudyCard from '@/components/CaseStudyCard';
import CredentialStrip from '@/components/CredentialStrip';
import CustomCursor from '@/components/CustomCursor';
import ElevationBar from '@/components/ElevationBar';
import GearRack from '@/components/GearRack';
import Preloader from '@/components/Preloader';
import { useAppStore } from '@/store/useAppStore';
import { Project } from '@/data/projects';
import { MODULE_TIMELINE, moduleRange, childRanges } from '@/lib/moduleTimeline';

// Single unified Canvas — avoids 5x WebGL context overhead
const UnifiedScene = dynamic(() => import('@/components/UnifiedScene'), { ssr: false });

/* ── Derive all content ranges from the shared contract ──────────────── */

const heroRange = moduleRange('hero');
const forestChildRanges = childRanges('forest', 4);
const campWindow = MODULE_TIMELINE.camp;
const alpineChildRanges = childRanges('alpine', 4);
const summitWindow = MODULE_TIMELINE.summit;

const forestNarrative = [
  {
    title: "I'm Sam.",
    body: 'I write code that you walk through. I build portfolio sites, immersive campaigns, and product experiences that use the browser like a stage instead of a brochure.',
    side: 'left' as const,
    range: forestChildRanges[0],
  },
  {
    title: 'Creative Engineer.',
    body: 'Three.js, shaders, motion systems, and CMS-backed front ends — all tuned to feel sharp without collapsing under their own ambition.',
    side: 'right' as const,
    range: forestChildRanges[1],
  },
  {
    title: 'Every Pixel Earned.',
    body: 'I care about the part where bold visuals still have to load fast, survive real devices, and actually help the work sell itself.',
    side: 'left' as const,
    range: forestChildRanges[2],
  },
  {
    title: 'See the View.',
    body: 'The work below is a mix of high-performance marketing builds, immersive front-end systems, and one absurdly overbuilt AI pipeline.',
    side: 'right' as const,
    range: forestChildRanges[3],
  },
];

function GlassPanel({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-foreground/12 bg-background/72 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_45%,rgba(0,0,0,0.12))] dark:bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_45%,rgba(0,0,0,0.24))]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StoryCard({
  title,
  body,
  side,
  range,
  scrollProgress,
}: {
  title: string;
  body: string;
  side: 'left' | 'right';
  range: readonly [number, number, number, number];
  scrollProgress: MotionValue<number>;
}) {
  const progressRange = [...range];
  const opacity = useTransform(scrollProgress, progressRange, [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, [progressRange[0], progressRange[1], progressRange[3]], [72, 0, -32]);

  return (
    <motion.div
      style={{ opacity, y }}
      className={`flex w-full ${side === 'left' ? 'justify-start' : 'justify-end'}`}
    >
      <GlassPanel className="w-full max-w-2xl px-6 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <p className="mb-3 text-[0.65rem] font-mono uppercase tracking-[0.35em] text-foreground/45">
          Trail Marker
        </p>
        <h3 className="max-w-[14ch] text-3xl font-semibold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {title}
        </h3>
        <p className="mt-4 max-w-[44ch] text-sm leading-7 text-foreground/75 md:text-base md:leading-8">
          {body}
        </p>
      </GlassPanel>
    </motion.div>
  );
}

export default function HomeClient({ caseStudies }: { caseStudies: Project[] }) {
  const { hasLoaded } = useAppStore();

  const refHero = useRef<HTMLDivElement>(null);
  const refForest = useRef<HTMLDivElement>(null);
  const refCamp = useRef<HTMLDivElement>(null);
  const refAlpine = useRef<HTMLDivElement>(null);
  const refSummit = useRef<HTMLElement>(null);

  // Global Scroll Tracker — single source for the unified module timeline [0.0 – 1.0]
  const { scrollYProgress } = useScroll();

  // Background Color Transition tied to the Night Camp module ownership window
  const backgroundColor = useTransform(
    scrollYProgress,
    [campWindow.ownStart, campWindow.enterEnd, campWindow.exitStart, campWindow.ownEnd],
    ['#f9fafb', '#09090b', '#09090b', '#f9fafb']
  );

  const color = useTransform(
    scrollYProgress,
    [campWindow.ownStart, campWindow.enterEnd, campWindow.exitStart, campWindow.ownEnd],
    ['#18181b', '#fafafa', '#fafafa', '#18181b']
  );

  // ── Hero content uses the global timeline, not a section-local tracker ──
  const scrollHintOpacity = useTransform(scrollYProgress, [0, heroRange[1]], [1, 0]);
  const heroOpacity = useTransform(
    scrollYProgress,
    [heroRange[0], heroRange[2], heroRange[3]],
    [1, 1, 0]
  );
  const heroY = useTransform(scrollYProgress, [heroRange[0], heroRange[3]], [0, -56]);

  // ── Summit child sequencing inside summit ownership window ──
  const summitRevealStart = summitWindow.enterStart + (summitWindow.ownEnd - summitWindow.ownStart) * 0.45;
  const summitRevealEnd = summitRevealStart + (summitWindow.ownEnd - summitWindow.ownStart) * 0.2;
  const summitCtaStart = summitRevealEnd;
  const summitCtaEnd = summitWindow.ownEnd;

  return (
    <motion.main
      style={{ backgroundColor, color }}
      className="relative min-h-screen w-full overflow-x-hidden transition-colors duration-100"
    >
      {/* Custom cursor — zone-aware, inertia-driven, touch-gated */}
      <CustomCursor scrollProgress={scrollYProgress} />

      {/* Preloader — overlays everything until assets are loaded */}
      <Preloader />

      {/* Scroll indicator — only shown after loading completes */}
      {hasLoaded && (
        <motion.div
          className="pointer-events-none fixed bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
          style={{ opacity: scrollHintOpacity }}
        >
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/40">Scroll</span>
          <motion.div className="flex h-8 w-5 items-start justify-center rounded-full border-2 border-foreground/30 p-1">
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-foreground/50"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Persistent 3D Background System — single Canvas, unified scene */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <UnifiedScene scrollProgress={scrollYProgress} />
      </div>

      {/* Elevation progress bar — fixed right rail */}
      <ElevationBar scrollProgress={scrollYProgress} />

      {/* The Content Overlay Container */}
      <div id="main-content" className="relative z-10 flex w-full flex-col items-center overflow-x-hidden">
        {/* Checkpoint 1: Basecamp - Hero Content */}
        <section
          ref={refHero}
          role="region"
          aria-label="Hero — Introduction"
          className="w-full min-h-screen pb-[120vh]"
        >
          <div className="sticky top-0 flex min-h-screen items-center px-4 pb-24 pt-28 md:px-8 lg:px-12">
            <motion.div style={{ opacity: heroOpacity, y: heroY }} className="w-full">
              <GlassPanel className="mx-auto max-w-3xl p-7 md:mx-0 md:ml-[8vw] md:p-10 lg:p-12">
                <p className="text-[0.65rem] font-mono uppercase tracking-[0.35em] text-foreground/45">
                  Denver · Front End / Creative Engineering
                </p>
                <h1 className="mt-4 max-w-[10ch] text-5xl font-semibold leading-[0.92] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.6rem]">
                  I build websites people can feel.
                </h1>
                <p className="mt-5 max-w-[34ch] text-base leading-8 text-foreground/78 md:text-lg">
                  Three.js worlds, high-performance marketing builds, and motion systems that still hold up on a real laptop instead of only in a dribbble fever dream.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href="#selected-work"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-6 py-3 text-sm font-mono uppercase tracking-[0.2em] text-background transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    See Selected Work
                  </a>
                  <a
                    href="mailto:sam@samherwig.dev"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/20 bg-background/40 px-6 py-3 text-sm font-mono uppercase tracking-[0.2em] text-foreground/80 transition-colors duration-300 hover:border-foreground/35 hover:text-foreground"
                  >
                    Start a Project
                  </a>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        </section>

        {/* The Forest Gauntlet — narrative cards driven by global timeline */}
        <section
          ref={refForest}
          role="region"
          aria-label="About Sam"
          className="w-full min-h-[360vh] px-4 py-[12vh] md:px-8 lg:px-12"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-[20vh] pt-[16vh]">
            {forestNarrative.map((entry) => (
              <StoryCard
                key={entry.title}
                title={entry.title}
                body={entry.body}
                side={entry.side}
                range={entry.range}
                scrollProgress={scrollYProgress}
              />
            ))}
          </div>
        </section>

        {/* Checkpoint 2.5: The Night Camp */}
        <section
          ref={refCamp}
          role="region"
          aria-label="Technical Skills"
          className="flex min-h-[200vh] w-full flex-col items-center justify-center py-[60vh]"
        >
          <h2 className="sr-only">Technical Skills</h2>
          <div className="relative my-[20vh] flex min-h-[50vh] w-full flex-col items-center justify-center px-4 text-center md:px-24">
            <GlassPanel className="mx-auto w-full max-w-5xl p-6 md:ml-[8vw] md:mr-auto md:max-w-[72rem] md:p-10 lg:p-12">
              <GearRack scrollProgress={scrollYProgress} />
            </GlassPanel>
          </div>
        </section>

        {/* Checkpoint 3: The High Alpine - Case Studies */}
        <section
          id="selected-work"
          ref={refAlpine}
          role="region"
          aria-label="Selected Work"
          className="mx-auto flex w-full max-w-7xl flex-col items-center py-[80vh]"
        >
          <h2 className="sr-only">Selected Work</h2>
          {caseStudies.map((cs, i) => (
            <CaseStudyCard
              key={cs.slug}
              title={cs.title}
              subtitle={cs.subtitle}
              slug={cs.slug}
              thumbnail={cs.thumbnail}
              tags={cs.tags}
              side={i % 2 === 0 ? 'right' : 'left'}
              linkable={true}
              scrollProgress={scrollYProgress}
              range={alpineChildRanges[i] ?? alpineChildRanges[alpineChildRanges.length - 1]}
            />
          ))}
        </section>

        {/* Between Alpine and Summit: Social Proof / Credential Strip */}
        <CredentialStrip />

        {/* Checkpoint 4: The Summit - Finale & Footer */}
        <section
          ref={refSummit}
          role="region"
          aria-label="Contact"
          className="relative flex min-h-[180vh] w-full flex-col justify-end pb-[18vh] pt-[72vh]"
        >
          <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-4 text-center">
            <motion.div
              style={{
                opacity: useTransform(scrollYProgress, [summitRevealStart, summitRevealEnd], [0, 1]),
                y: useTransform(scrollYProgress, [summitRevealStart, summitRevealEnd], [72, 0]),
              }}
              className="flex flex-col items-center"
            >
              <p className="mb-4 text-[0.7rem] font-mono uppercase tracking-[0.35em] text-foreground/45">
                Sam Herwig · Creative Engineer
              </p>
              <h2 className="text-4xl font-bold tracking-tighter uppercase md:text-6xl lg:text-8xl">
                The Summit.
              </h2>
              <p className="mt-6 max-w-[26ch] text-lg leading-8 text-foreground/78 md:text-2xl md:leading-10">
                Front-end systems, motion design, Three.js, and marketing builds that still know how to close.
              </p>
            </motion.div>

            <motion.div
              style={{
                opacity: useTransform(scrollYProgress, [summitCtaStart, summitCtaEnd], [0, 1]),
                y: useTransform(scrollYProgress, [summitCtaStart, summitCtaEnd], [48, 0]),
              }}
              className="mt-10"
            >
              <a
                href="mailto:sam@samherwig.dev"
                className="group relative overflow-hidden rounded-full border-2 border-foreground bg-transparent px-8 py-4 text-foreground transition-colors duration-500 hover:text-background md:px-12 md:py-6"
              >
                <span className="relative z-10 font-mono text-sm uppercase tracking-widest">Pitch Me Your Mountain →</span>
                <div className="absolute inset-0 h-full w-full origin-left scale-x-0 transform bg-foreground transition-transform duration-500 ease-out group-hover:scale-x-100" />
              </a>
            </motion.div>
          </div>
        </section>
      </div>
    </motion.main>
  );
}
