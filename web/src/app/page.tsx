'use client';


import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRef } from 'react';

// Avoid SSR for the Three.js Canvas to prevent hydration matches
const InteractiveHero = dynamic(() => import('@/components/InteractiveHero'), { ssr: false });
const ForestModule = dynamic(() => import('@/components/ForestModule'), { ssr: false });
const CampModule = dynamic(() => import('@/components/CampModule'), { ssr: false });
const AlpineModule = dynamic(() => import('@/components/AlpineModule'), { ssr: false });
const SummitModule = dynamic(() => import('@/components/SummitModule'), { ssr: false });


function CinematicCaseStudy({ title, subtitle, side }: { title: string, subtitle: string, side: 'left' | 'right' | 'center' }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Vertical climb fade-in
  const opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7, 0.9], [0, 1, 1, 0]);
  // Slide up slightly to simulate pulling yourself up the ledge
  const y = useTransform(scrollYProgress, [0.3, 0.5, 0.7, 0.9], [100, 0, 0, -100]);

  let alignmentClass = "items-center text-center";
  if (side === 'left') alignmentClass = "items-start text-left";
  if (side === 'right') alignmentClass = "items-end text-right";

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className={`w-full min-h-[40vh] flex flex-col justify-center px-4 md:px-32 my-[10vh] transform-gpu ${alignmentClass}`}
    >
      <div className="w-full md:w-[60%] p-6 md:p-12 bg-[#f5f5f4]/80 backdrop-blur-md rounded-3xl border border-foreground/10 shadow-2xl group cursor-pointer hover:bg-foreground/5 transition-colors duration-500">
        <div className="aspect-[4/3] w-full bg-foreground/10 rounded-xl mb-6 overflow-hidden relative">
          {/* Placeholder image for case study */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-foreground/5" />
          <span className="absolute inset-0 flex items-center justify-center font-mono text-xs opacity-50 uppercase tracking-widest group-hover:scale-110 transition-transform duration-700">View Project</span>
        </div>
        <h3 className="text-3xl font-bold tracking-tight">{title}</h3>
        <p className="text-foreground/70 mt-2">{subtitle}</p>
      </div>
    </motion.div>
  );
}

export default function Home() {

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

  return (
    <motion.main
      style={{ backgroundColor, color }}
      className="relative w-full overflow-x-hidden min-h-screen transition-colors duration-100"
    >

      {/* Persistent 3D Background System */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <InteractiveHero scrollProgress={scrollYProgress} />
        <ForestModule scrollProgress={scrollYProgress} />
        <CampModule scrollProgress={scrollYProgress} />
        <AlpineModule scrollProgress={scrollYProgress} />
        <SummitModule scrollProgress={scrollYProgress} />
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
            <div className="absolute inset-0 bg-background/70 backdrop-blur-xl rounded-3xl m-8 border border-foreground/10 -z-10 shadow-2xl max-w-4xl mx-auto" />
            <div className="relative z-10 p-12">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 mt-16 text-balance">Relevant Skills.</h2>
              <div className="flex flex-wrap text-center md:text-left justify-center md:justify-start gap-4 mt-8 max-w-2xl mx-auto opacity-80 text-foreground/80 font-mono tracking-widest uppercase text-xs md:text-sm">
                <span>React / Next.js</span> • <span>Vue / Nuxt</span> • <span>Three.js / WebGL</span> • <span>GLSL</span> • <span>TypeScript</span> • <span>Framer Motion</span> • <span>Tailwind CSS</span> • <span>GSAP</span> • <span>Sanity CMS</span> • <span>AI Agent Systems</span>
              </div>
            </div>
          </div>
        </div>

        {/* Checkpoint 3: The High Alpine - Case Studies */}
        <div ref={refAlpine} className="w-full flex flex-col items-center max-w-7xl mx-auto py-[80vh]">
          <CinematicCaseStudy
            side="right"
            title="Google DeepMind"
            subtitle="Scaling interactive experiences for global AI research."
          />
          <CinematicCaseStudy
            side="left"
            title="Apple Vision Pro"
            subtitle="Spatial computing interfaces and WebXR container design."
          />
          <CinematicCaseStudy
            side="right"
            title="Taste & Skill"
            subtitle="Bridging the gap between front-end engineering and design logic."
          />
          <CinematicCaseStudy
            side="left"
            title="Oura Ring"
            subtitle="Interactive product explorations and real-time biometric visualization."
          />
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
            <h2 className="text-6xl md:text-9xl font-bold tracking-tighter uppercase mb-8">Reach Out.</h2>
            <p className="text-xl md:text-3xl text-foreground/80 mb-16 max-w-[20ch]">
              Let's build a reality together.
            </p>
            <a
              href="mailto:Sherwig123@gmail.com"
              className="group relative px-12 py-6 overflow-hidden rounded-full border-2 border-foreground bg-transparent text-foreground hover:text-background transition-colors duration-500"
            >
              <span className="relative z-10 font-mono text-sm uppercase tracking-widest">Say Hello</span>
              <div className="absolute inset-0 h-full w-full bg-foreground transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out" />
            </a>
          </motion.div>
        </section>

      </div >
    </motion.main >
  );
}
