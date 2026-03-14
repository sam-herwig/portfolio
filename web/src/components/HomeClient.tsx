'use client';


import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRef } from 'react';
import CaseStudyCard from '@/components/CaseStudyCard';

// Single unified Canvas — avoids 5x WebGL context overhead
const UnifiedScene = dynamic(() => import('@/components/UnifiedScene'), { ssr: false });

const fallbackCaseStudies = [
  { slug: 'deepmind', title: 'Google DeepMind', subtitle: 'Real-time 3D visualization for AI research data.', tags: [], thumbnail: undefined },
  { slug: 'vision-pro', title: 'Apple Vision Pro', subtitle: 'Prototyping spatial interfaces for visionOS in WebXR.', tags: [], thumbnail: undefined },
  { slug: 'taste-and-skill', title: 'Taste & Skill', subtitle: 'Where design intuition meets engineering precision.', tags: [], thumbnail: undefined },
  { slug: 'oura-ring', title: 'Oura Ring', subtitle: 'Interactive biometric data rendered in real-time WebGL.', tags: [], thumbnail: undefined },
];

export default function HomeClient({ caseStudies }: { caseStudies: any[] }) {

  const refHero = useRef<HTMLDivElement>(null);
  const refForest = useRef<HTMLDivElement>(null);
  const refCamp = useRef<HTMLDivElement>(null);
  const refAlpine = useRef<HTMLDivElement>(null);
  const refSummit = useRef<HTMLElement>(null);

  // Global Scroll Tracker for unified timeline across all 5 modules [0.0 - 1.0]
  const { scrollYProgress } = useScroll();

  // Background Color Transition tied exclusively to the Night Camp global bounds [0.45 - 0.70]
  const backgroundColor = useTransform(
    scrollYProgress,
    [0.45, 0.5, 0.65, 0.7],
    ["#f9fafb", "#09090b", "#09090b", "#f9fafb"]
  );

  const color = useTransform(
    scrollYProgress,
    [0.45, 0.5, 0.65, 0.7],
    ["#18181b", "#fafafa", "#fafafa", "#18181b"]
  );

  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);

  const displayCaseStudies = caseStudies.length > 0 ? caseStudies : fallbackCaseStudies;

  return (
    <motion.main
      style={{ backgroundColor, color }}
      className="relative w-full overflow-x-hidden min-h-screen transition-colors duration-100"
    >

      {/* Scroll indicator */}
      <motion.div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
        style={{ opacity: scrollHintOpacity }}
      >
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-foreground/40">Scroll</span>
        <motion.div
          className="w-5 h-8 rounded-full border-2 border-foreground/30 flex items-start justify-center p-1"
        >
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-foreground/50"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>

      {/* Persistent 3D Background System — single Canvas, unified scene */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <UnifiedScene scrollProgress={scrollYProgress} />
      </div>

      {/* The Content Overlay Container */}
      <div className="relative z-10 w-full overflow-x-hidden flex flex-col items-center">

        {/* Checkpoint 1: Basecamp - Hero Content (Migrated to 3D Canvas) */}
        <div ref={refHero} className="w-full min-h-screen pb-[300vh]" />

        {/* The Forest Gauntlet Text Nodes (Migrated to 3D Canvas) */}
        <div ref={refForest} className="w-full min-h-[400vh]" />

        {/* Checkpoint 2.5: The Night Camp */}
        <div ref={refCamp} className="w-full flex flex-col items-center justify-center min-h-[200vh] py-[60vh]">
          <div className="w-full min-h-[50vh] flex flex-col items-center justify-center text-center px-4 md:px-24 my-[20vh] transform-gpu relative">
            <div className="absolute inset-0 bg-foreground/5 backdrop-blur-xl rounded-3xl m-4 md:m-8 border border-foreground/10 -z-10 shadow-2xl max-w-4xl mx-auto" />
            <div className="relative z-10 p-12">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 mt-16 text-balance">The Toolkit.</h2>
              <div className="flex flex-wrap text-center md:text-left justify-center md:justify-start gap-2 md:gap-4 mt-8 max-w-2xl mx-auto opacity-80 text-foreground/80 font-mono tracking-widest uppercase text-xs md:text-sm">
                <span>Three.js / WebGL</span> • <span>GLSL Shaders</span> • <span>React / Next.js</span> • <span>TypeScript</span> • <span>Vue / Nuxt</span> • <span>GSAP</span> • <span>Framer Motion</span> • <span>Tailwind CSS</span> • <span>Sanity CMS</span> • <span>AI Agent Pipelines</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkpoint 3: The High Alpine - Case Studies */}
        <div ref={refAlpine} className="w-full flex flex-col items-center max-w-7xl mx-auto py-[80vh]">
          {displayCaseStudies.map((cs: any, i: number) => (
            <CaseStudyCard
              key={cs.slug}
              title={cs.title}
              subtitle={cs.subtitle}
              slug={cs.slug}
              thumbnail={cs.thumbnail}
              tags={cs.tags}
              side={i % 2 === 0 ? 'right' : 'left'}
              linkable={caseStudies.length > 0}
            />
          ))}
        </div>

        {/* Checkpoint 4: The Summit - Finale & Footer */}
        <section ref={refSummit} className="w-full relative min-h-[160vh] flex flex-col justify-end pb-[20vh] pt-[60vh]">
          <motion.div
            style={{
              opacity: useTransform(scrollYProgress, [0.85, 0.95], [0, 1]),
              y: useTransform(scrollYProgress, [0.85, 0.95], [100, 0])
            }}
            className="w-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto mix-blend-multiply"
          >
            <h2 className="text-4xl md:text-6xl lg:text-9xl font-bold tracking-tighter uppercase mb-8">The Summit.</h2>
            <p className="text-xl md:text-3xl text-foreground/80 mb-16 max-w-[20ch]">
              I'm looking for the next big build. Let's talk about yours.
            </p>
            <a
              href="mailto:sam@samherwig.dev"
              className="group relative px-8 py-4 md:px-12 md:py-6 overflow-hidden rounded-full border-2 border-foreground bg-transparent text-foreground hover:text-background transition-colors duration-500"
            >
              <span className="relative z-10 font-mono text-sm uppercase tracking-widest">Pitch Me Your Mountain →</span>
              <div className="absolute inset-0 h-full w-full bg-foreground transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out" />
            </a>
          </motion.div>
        </section>

      </div >
    </motion.main >
  );
}
