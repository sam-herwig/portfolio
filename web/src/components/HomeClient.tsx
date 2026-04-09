'use client';

import { motion, useScroll, useTransform, useReducedMotion, MotionValue } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRef, useEffect } from 'react';
import CaseStudyCard from '@/components/CaseStudyCard';
import CredentialStrip from '@/components/CredentialStrip';
import ElevationBar from '@/components/ElevationBar';
import GearRack from '@/components/GearRack';
import Preloader from '@/components/Preloader';
import { useAppStore } from '@/store/useAppStore';
import { Project } from '@/data/projects';
import { MODULE_TIMELINE, moduleRange, sceneChildRanges } from '@/lib/moduleTimeline';
import { isTimelineDebugEnabled, tickTimelineDebug, dumpTimeline, destroyTimelineDebug } from '@/lib/timelineDebug';

// Single unified Canvas — avoids 5x WebGL context overhead
const UnifiedScene = dynamic(() => import('@/components/UnifiedScene'), { ssr: false });

/* ── Derive all content ranges from the shared contract ──────────────── */

const heroRange = moduleRange('hero');
const forestChildRanges = sceneChildRanges('forest', 4);
const campWindow = MODULE_TIMELINE.camp;
const alpineChildRanges = sceneChildRanges('alpine', 4);
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
    body: 'The work below covers marketing builds, WebGL front ends, and a solo-built 3D studio running on AI agent pipelines.',
    side: 'right' as const,
    range: forestChildRanges[3],
  },
];

function GlassPanel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-foreground/12 bg-background/93 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_45%,rgba(0,0,0,0.15))]" />
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
      data-story-card={title}
      style={{ opacity, y, pointerEvents: 'none' }}
      className={`absolute inset-0 flex w-full items-center ${side === 'left' ? 'justify-start' : 'justify-end'}`}
    >
      <GlassPanel className="w-full max-w-2xl px-6 py-6 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <p className="mb-3 text-[0.65rem] font-inter uppercase tracking-[0.35em] text-foreground/60 drop-shadow-sm">
          Trail Marker
        </p>
        <h3 className="max-w-[14ch] text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl font-instrument text-foreground">
          {title}
        </h3>
        <p className="mt-4 max-w-[44ch] text-sm leading-7 text-foreground/80 md:text-base md:leading-8 font-inter">
          {body}
        </p>
      </GlassPanel>
    </motion.div>
  );
}

export default function HomeClient({ caseStudies }: { caseStudies: Project[] }) {
  const { hasLoaded, savedScrollY, setSavedScrollY } = useAppStore();
  const reducedMotion = useReducedMotion();

  const refHero = useRef<HTMLDivElement>(null);
  const refForest = useRef<HTMLDivElement>(null);
  const refCamp = useRef<HTMLDivElement>(null);
  const refAlpine = useRef<HTMLDivElement>(null);
  const refSummit = useRef<HTMLElement>(null);

  // Global Scroll Tracker — single source for the unified module timeline [0.0 – 1.0]
  const { scrollYProgress } = useScroll();

  // Use raw scroll progress for all content transforms.
  // (useSpring was removed — its overdamped lag caused cards to be invisible
  // during real-time scrolling because CSS sticky exits before the spring settles.)

  // ── Timeline debug instrumentation (gated behind ?debugTimeline) ──
  useEffect(() => {
    if (!isTimelineDebugEnabled()) return;
    dumpTimeline();
    const unsub = scrollYProgress.on('change', (v: number) => tickTimelineDebug(v));
    return () => {
      unsub();
      destroyTimelineDebug();
    };
  }, [scrollYProgress]);

  // ── Restore scroll position when returning from case study ──
  useEffect(() => {
    if (savedScrollY > 0) {
      window.scrollTo(0, savedScrollY);
      setSavedScrollY(0);
    }
  }, [savedScrollY, setSavedScrollY]);

  // Background Color Transition tied to the Night Camp module ownership window
  const backgroundColor = useTransform(
    scrollYProgress,
    [campWindow.ownStart, campWindow.enterEnd, campWindow.exitStart, campWindow.ownEnd],
    ['#f9fafb', '#09090b', '#09090b', '#f9fafb'],
  );

  const color = useTransform(
    scrollYProgress,
    [campWindow.ownStart, campWindow.enterEnd, campWindow.exitStart, campWindow.ownEnd],
    ['#18181b', '#fafafa', '#fafafa', '#18181b'],
  );

  // ── Hero content ──
  const scrollHintOpacity = useTransform(scrollYProgress, [0, heroRange[1]], [1, 0]);
  // Text fades out early (0.06→0.14) so the 3D backdrop has solo screen time
  const heroOpacity = useTransform(scrollYProgress, [0, 0.06, 0.14], [1, 1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.14], [0, -56]);

  // ── Camp content opacity — starts at enterEnd (after scene fully visible) ──
  const campContentOpacity = useTransform(
    scrollYProgress,
    [campWindow.enterEnd, campWindow.enterEnd + 0.02, campWindow.exitStart, campWindow.exitEnd],
    [0, 1, 1, 0],
  );

  // ── Summit child sequencing inside summit ownership window ──
  // Content appears after 3D elements fade out (animP 0.70+)
  const summitSpan = summitWindow.ownEnd - summitWindow.ownStart;
  const summitRevealStart = summitWindow.ownStart + summitSpan * 0.7;
  const summitRevealEnd = summitWindow.ownStart + summitSpan * 0.85;

  return (
    <motion.main
      style={{ backgroundColor, color }}
      className="relative min-h-screen w-full overflow-x-clip transition-colors duration-100"
    >
      {/* Custom cursor removed — native cursor is cleaner */}

      {/* Preloader — overlays everything until assets are loaded */}
      <Preloader />

      {/* Scroll indicator — only shown after loading completes */}
      {hasLoaded && (
        <motion.div
          className="pointer-events-none fixed bottom-8 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
          style={{ opacity: scrollHintOpacity }}
        >
          <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/60">Scroll</span>
          <motion.div className="flex h-8 w-5 items-start justify-center rounded-full border-2 border-foreground/30 p-1">
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-foreground/50"
              animate={reducedMotion ? undefined : { y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      )}

      {/* Persistent 3D Background System — single Canvas, unified scene */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <UnifiedScene scrollProgress={scrollYProgress} />
      </div>

      {/* Elevation progress bar — fixed right rail */}
      <ElevationBar scrollProgress={scrollYProgress} />

      {/* The Content Overlay Container */}
      <div id="main-content" className="relative z-10 flex w-full flex-col items-center overflow-x-clip">
        {/* Checkpoint 1: Basecamp - Hero Content */}
        <section
          ref={refHero}
          role="region"
          aria-label="Hero — Introduction"
          className="relative w-full min-h-[260vh] md:min-h-[345vh]"
        >
          <div className="sticky top-0 flex min-h-screen items-center px-4 pb-24 pt-28 md:px-8 lg:px-12">
            <motion.div style={{ opacity: heroOpacity, y: heroY }} className="w-full">
              <GlassPanel className="mx-auto max-w-3xl p-7 md:mx-0 md:ml-[8vw] md:p-10 lg:p-12">
                <p className="text-[0.65rem] font-inter uppercase tracking-[0.35em] text-foreground/60 font-bold drop-shadow-sm">
                  Denver · Front End / Creative Engineering
                </p>
                <h1 className="mt-4 max-w-[14ch] md:max-w-[10ch] text-5xl font-bold leading-[0.92] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.6rem] font-instrument">
                  I build websites people can feel.
                </h1>
                <p className="mt-5 max-w-[34ch] text-base leading-8 text-foreground/80 font-medium md:text-lg font-inter">
                  Three.js worlds, high-performance marketing builds, and motion systems that still hold up on a real
                  laptop instead of only in a dribbble fever dream.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href="mailto:sam@samherwig.dev"
                    aria-label="Send email to start a project"
                    className="mr-3 inline-flex min-h-12 items-center justify-center rounded-3xl border border-foreground/20 bg-foreground/10 px-6 py-3 text-sm font-inter uppercase tracking-[0.2em] text-foreground transition-all duration-300 hover:bg-foreground/20"
                  >
                    Email
                  </a>
                  <a
                    href="https://linkedin.com/in/samherwig"
                    aria-label="Visit LinkedIn profile"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-3xl border border-foreground/10 bg-transparent px-6 py-3 text-sm font-inter uppercase tracking-[0.2em] text-foreground transition-colors duration-300 hover:bg-foreground/5"
                  >
                    LinkedIn
                  </a>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        </section>

        {/* The Forest Gauntlet — narrative cards driven by global timeline */}
        {/* Tall scroll region keeps the global timeline progressing; sticky inner
            container pins cards to the viewport so they're visible during their
            opacity windows. */}
        <section
          id="about"
          ref={refForest}
          role="region"
          aria-label="About Sam"
          className="relative w-full min-h-[420vh] md:min-h-[560vh]"
        >
          <div className="sticky top-0 flex min-h-screen items-center justify-center px-4 md:px-8 lg:px-12">
            <div className="relative mx-auto w-full max-w-6xl">
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
          </div>
        </section>

        {/* Checkpoint 2.5: The Night Camp */}
        <section
          id="skills"
          ref={refCamp}
          role="region"
          aria-label="Technical Skills"
          className="relative w-full min-h-[260vh] md:min-h-[345vh]"
        >
          <h2 className="sr-only">Technical Skills</h2>
          <div className="sticky top-0 flex min-h-screen items-center justify-center px-4 md:px-12">
            <motion.div
              data-camp-content
              style={{ opacity: campContentOpacity }}
              className="w-full max-w-5xl md:mx-auto"
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-foreground/12 bg-background/93 shadow-[0_30px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),transparent_45%,rgba(0,0,0,0.15))]" />
                <div className="relative z-10 p-6 md:p-10 lg:p-12">
                  <GearRack scrollProgress={scrollYProgress} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Checkpoint 3: The High Alpine - Case Studies */}
        <section
          id="selected-work"
          ref={refAlpine}
          role="region"
          aria-label="Selected Work"
          className="relative w-full min-h-[455vh] md:min-h-[600vh]"
        >
          <h2 className="sr-only">Selected Work</h2>
          <div className="sticky top-0 flex min-h-screen items-center justify-center px-4 md:px-12 lg:px-16">
            <div className="relative mx-auto w-full max-w-7xl min-h-[70vh]">
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
                  palette={cs.palette}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Checkpoint 4: The Summit - Finale & Footer */}
        <section
          id="contact"
          ref={refSummit}
          role="region"
          aria-label="Contact"
          className="relative min-h-[230vh] md:min-h-[300vh] w-full"
        >
          <div className="sticky top-0 flex min-h-screen flex-col items-center justify-center px-4 text-center z-20 pointer-events-auto">
            <motion.div
              style={{
                opacity: useTransform(scrollYProgress, [summitRevealStart, summitRevealEnd, 1], [0, 1, 1]),
                y: useTransform(scrollYProgress, [summitRevealStart, summitRevealEnd, 1], [72, 0, 0]),
              }}
              className="flex flex-col items-center w-full"
            >
              {/* Social Proof / Credential Strip */}
              <CredentialStrip />
              <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center relative text-foreground">
                <div className="flex flex-col items-center">
                  <p className="mb-4 text-[0.7rem] font-mono uppercase tracking-[0.35em] text-foreground/60">
                    Sam Herwig · Creative Engineer
                  </p>
                  <h2 className="text-4xl font-bold tracking-tighter uppercase md:text-6xl lg:text-8xl">The Summit.</h2>
                  <p className="mt-6 max-w-[26ch] text-lg leading-8 text-foreground/78 md:text-2xl md:leading-10">
                    Front-end systems, motion design, Three.js, and marketing builds that still know how to close.
                  </p>
                </div>

                <div className="mt-10">
                  <a
                    href="mailto:sam@samherwig.dev"
                    aria-label="Send email to start a project"
                    className="group relative overflow-hidden rounded-sm border-2 border-stone-100 bg-stone-900 px-8 py-4 text-stone-100 transition-colors duration-500 hover:text-stone-900 md:px-12 md:py-6 shadow-2xl"
                  >
                    <span className="relative z-10 font-space-mono text-sm uppercase tracking-widest font-bold">
                      Pitch Me Your Mountain →
                    </span>
                    <div className="absolute inset-0 h-full w-full origin-left scale-x-0 transform bg-stone-100 transition-transform duration-500 ease-out group-hover:scale-x-100" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </motion.main>
  );
}
