'use client';

import { motion, useScroll, useTransform, useReducedMotion, MotionValue } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
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
import { useAudioMix } from '@/lib/audio/useAudioMix';
import GroveMarker from '@/components/eggs/GroveMarker';

// Single unified Canvas — avoids 5x WebGL context overhead
const UnifiedScene = dynamic(() => import('@/components/UnifiedScene'), { ssr: false });

/* ── Derive all content ranges from the shared contract ──────────────── */

const heroRange = moduleRange('hero');
const forestChildRanges = sceneChildRanges('forest', 4);
const campWindow = MODULE_TIMELINE.camp;
const alpineChildRanges = sceneChildRanges('alpine', 4);
const summitWindow = MODULE_TIMELINE.summit;

// First Alpine card gets a custom range: shifted later so the sticky container
// is fully engaged before the y-translate animates. Squeezed to finish before
// card 1 starts, so there's no double-visible overlap. Without this, card 0's
// rise is "absorbed" by the still-scrolling sticky parent and reads as a pop-in.
const alpineFirstCardRange = (() => {
  const nextStart = alpineChildRanges[1]?.[0] ?? 0.65;
  const start = 0.61; // progress at which Alpine sticky container is fully engaged
  const span = nextStart - start;
  const fadeLen = span * 0.2;
  return [start, start + fadeLen, nextStart - fadeLen, nextStart] as const;
})();

const forestNarrative = [
  {
    title: "Hi, I'm Sam.",
    body: 'I make front ends where the hero is a real WebGL scene. Based in Denver, currently nursing a 40-tab Chrome window and one very confused GPU.',
    side: 'left' as const,
    range: forestChildRanges[0],
  },
  {
    title: 'The stack, roughly.',
    body: 'Next.js, R3F, a lot of custom GLSL, and whatever headless CMS the team already trusts. The fancy part has to survive a content edit at 4pm on a Friday.',
    side: 'right' as const,
    range: forestChildRanges[1],
  },
  {
    title: 'The workbench stays messy.',
    body: "I've got a half-finished thing that makes pixels behave like wet ink on paper, another that tries to catch the way fog hangs in a valley at dawn, and a third I can't talk about because I haven't figured out what it is.",
    side: 'left' as const,
    range: forestChildRanges[2],
  },
  {
    title: "What's out there.",
    body: "Some client sites, a couple of heavier campaign builds, and CraftedKit, which is me plus a pack of AI agents that do the research passes and asset cleanup I'd never finish alone.",
    side: 'right' as const,
    range: forestChildRanges[3],
  },
];

function GlassPanel({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border border-foreground/12 bg-background shadow-[0_30px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-[48px] ${className}`}
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
  reducedMotion,
}: {
  title: string;
  body: string;
  side: 'left' | 'right';
  range: readonly [number, number, number, number];
  scrollProgress: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const progressRange = [...range];
  const opacity = useTransform(scrollProgress, progressRange, [0, 1, 1, 0]);
  const y = useTransform(
    scrollProgress,
    [progressRange[0], progressRange[1], progressRange[3]],
    reducedMotion ? [0, 0, 0] : [72, 0, -32],
  );

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
  const hasLoaded = useAppStore((s) => s.hasLoaded);
  const reducedMotion = useReducedMotion() ?? false;

  const refHero = useRef<HTMLDivElement>(null);
  const refForest = useRef<HTMLDivElement>(null);
  const refCamp = useRef<HTMLDivElement>(null);
  const refAlpine = useRef<HTMLDivElement>(null);
  const refSummit = useRef<HTMLElement>(null);

  // Global Scroll Tracker — single source for the unified module timeline [0.0 – 1.0]
  const { scrollYProgress } = useScroll();

  // Section-tied ambient audio mix — gated by the global toggle (default off)
  useAudioMix(scrollYProgress);

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
  // Read savedScrollY via getState() so this fires only on mount — subscribing
  // would re-fire the effect when CaseStudyCard writes the value on card-click,
  // clearing it before navigation even happens.
  useEffect(() => {
    const y = useAppStore.getState().savedScrollY;
    if (y <= 0) return;
    // Double RAF so the long scroll container is laid out before we jump.
    // Without this, document height may still be 0 and the scroll silently clips.
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        window.scrollTo(0, y);
        useAppStore.getState().setSavedScrollY(0);
      });
      (window as unknown as { __rafRestore2?: number }).__rafRestore2 = raf2;
    });
    return () => {
      cancelAnimationFrame(raf1);
      const raf2 = (window as unknown as { __rafRestore2?: number }).__rafRestore2;
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, []);

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
  const heroY = useTransform(scrollYProgress, [0, 0.14], reducedMotion ? [0, 0] : [0, -56]);

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
  const summitOpacity = useTransform(scrollYProgress, [summitRevealStart, summitRevealEnd, 1], [0, 1, 1]);
  const summitY = useTransform(
    scrollYProgress,
    [summitRevealStart, summitRevealEnd, 1],
    reducedMotion ? [0, 0, 0] : [72, 0, 0],
  );

  return (
    <motion.main
      style={{ backgroundColor, color }}
      className="relative min-h-screen w-full overflow-x-clip transition-colors duration-100"
    >
      {/* Forest off-trail marker — hidden egg, click → /shhhh */}
      <GroveMarker scrollProgress={scrollYProgress} />

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
                <Image
                  src="/logo-mark.svg"
                  alt=""
                  width={44}
                  height={44}
                  className="mb-5 h-11 w-11"
                  aria-hidden="true"
                  unoptimized
                  priority
                />
                <p className="text-[0.65rem] font-inter uppercase tracking-[0.35em] text-foreground/60 font-bold drop-shadow-sm">
                  Denver · Front End / Creative Engineering
                </p>
                <h1 className="mt-4 max-w-[14ch] md:max-w-[10ch] text-5xl font-bold leading-[0.92] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[5.6rem] font-instrument">
                  Let&apos;s climb a mountain
                </h1>
                <p className="mt-5 max-w-[34ch] text-base leading-8 text-foreground/80 font-medium md:text-lg font-inter">
                  3D web, motion, marketing sites. Most of the good stuff lives a little above the treeline.
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
                  reducedMotion={reducedMotion}
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
              <div className="relative overflow-hidden rounded-[2rem] border border-foreground/20 bg-foreground text-background shadow-[0_30px_80px_-32px_rgba(0,0,0,0.45)] backdrop-blur-[48px]">
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
                  side={i % 2 === 0 ? 'right' : 'left'}
                  linkable={true}
                  scrollProgress={scrollYProgress}
                  range={
                    i === 0
                      ? alpineFirstCardRange
                      : (alpineChildRanges[i] ?? alpineChildRanges[alpineChildRanges.length - 1])
                  }
                />
              ))}
            </div>
          </div>
        </section>

        {/* Checkpoint 4: The Summit - Finale & Footer */}
        <footer
          id="contact"
          ref={refSummit}
          aria-label="Contact"
          className="relative min-h-[230vh] md:min-h-[300vh] w-full"
        >
          <div className="sticky top-0 flex min-h-screen flex-col items-center justify-center px-4 text-center z-20 pointer-events-auto">
            <motion.div
              style={{
                opacity: summitOpacity,
                y: summitY,
              }}
              className="flex flex-col items-center w-full"
            >
              {/* Social Proof / Credential Strip */}
              <CredentialStrip />
              <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-center relative text-foreground">
                <div className="flex flex-col items-center">
                  <Image
                    src="/logo-mark.svg"
                    alt=""
                    width={72}
                    height={72}
                    className="mb-6 h-16 w-16 md:h-20 md:w-20"
                    aria-hidden="true"
                    unoptimized
                  />
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
                    <div className="absolute -inset-px origin-left scale-x-0 transform bg-stone-100 transition-transform duration-500 ease-out group-hover:scale-x-[1.02]" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </footer>
      </div>
    </motion.main>
  );
}
