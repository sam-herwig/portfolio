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

function CinematicText({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  // Distance Fade: 0 (far away) -> 1 (readable) -> 0 (passed camera)
  // Widened the fully opaque window from [0.4, 0.6] to [0.3, 0.75]
  const opacity = useTransform(scrollYProgress, [0.1, 0.3, 0.75, 0.9], [0, 1, 1, 0]);
  // Distance Scale: 0.8 (far away) -> 1.0 (readable) -> 2.5 (passed camera)
  const scale = useTransform(scrollYProgress, [0.1, 0.3, 0.75, 0.9], [0.8, 1, 1, 2.5]);
  // Distance Blur: 20px (fog) -> 0px (readable) -> 20px (passed camera)
  const blur = useTransform(scrollYProgress, [0.1, 0.3, 0.75, 0.9], ["blur(15px)", "blur(0px)", "blur(0px)", "blur(15px)"]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, scale, filter: blur }}
      className="w-full min-h-[50vh] flex flex-col items-center justify-center text-center px-4 md:px-24 my-[20vh] transform-gpu relative"
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl rounded-3xl m-8 border border-foreground/10 -z-10 shadow-2xl max-w-4xl mx-auto" />
      <div className="relative z-10 p-12">
        {children}
      </div>
    </motion.div>
  );
}

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

  const refHero = useRef<HTMLElement>(null);
  const refForest = useRef<HTMLDivElement>(null);
  const refCamp = useRef<HTMLDivElement>(null);
  const refAlpine = useRef<HTMLDivElement>(null);
  const refSummit = useRef<HTMLElement>(null);

  // Localized Scroll Trackers for durable bounds regardless of CSS sizing!
  const { scrollYProgress: scrollHero } = useScroll({ target: refHero, offset: ["start start", "end start"] });
  const { scrollYProgress: scrollForest } = useScroll({ target: refForest, offset: ["start end", "end start"] });
  const { scrollYProgress: scrollCamp } = useScroll({ target: refCamp, offset: ["start end", "end start"] });
  const { scrollYProgress: scrollAlpine } = useScroll({ target: refAlpine, offset: ["start end", "end start"] });
  const { scrollYProgress: scrollSummit } = useScroll({ target: refSummit, offset: ["start end", "end start"] });

  // Background Color Transition tied exclusively to the Night Camp local scroll
  const backgroundColor = useTransform(
    scrollCamp,
    [0.1, 0.3, 0.7, 0.9],
    ["#f9fafb", "#09090b", "#09090b", "#f9fafb"]
  );

  const color = useTransform(
    scrollCamp,
    [0.1, 0.3, 0.7, 0.9],
    ["#18181b", "#fafafa", "#fafafa", "#18181b"]
  );

  return (
    <motion.main
      style={{ backgroundColor, color }}
      className="relative w-full overflow-x-hidden min-h-screen transition-colors duration-100"
    >

      {/* Persistent 3D Background System */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <InteractiveHero scrollProgress={scrollHero} />
        <ForestModule scrollProgress={scrollForest} />
        <CampModule scrollProgress={scrollCamp} />
        <AlpineModule scrollProgress={scrollAlpine} />
        <SummitModule scrollProgress={scrollSummit} />
      </div>

      {/* The Content Overlay Container */}
      <div className="relative z-10 w-full overflow-x-hidden flex flex-col items-center">

        {/* Checkpoint 1: Basecamp - Hero Content */}
        <section ref={refHero} className="w-full min-h-screen px-4 flex flex-col items-center justify-center pb-[150vh]">
          <div className="text-center max-w-4xl flex flex-col items-center relative p-8 md:p-16 rounded-[3rem] bg-background/60 backdrop-blur-xl border border-foreground/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)]">
            <motion.h1
              className="text-5xl md:text-8xl tracking-tighter leading-none font-bold text-balance"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              "Mountain Man."
            </motion.h1>

            <motion.p
              className="mt-6 text-lg md:text-xl text-foreground/70 max-w-[50ch]"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 1 }}
            >
              "Frontend engineering rooted in high-end design and natural aesthetics."
            </motion.p>


          </div>

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 1, duration: 1 }}
          >
            <span className="text-xs tracking-widest uppercase font-mono">Scroll</span>
            <div className="w-[1px] h-12 bg-foreground/20 overflow-hidden relative">
              <motion.div
                className="absolute top-0 left-0 w-full h-1/2 bg-foreground"
                animate={{ y: ["-100%", "200%"] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              />
            </div>
          </motion.div>
        </section>

        {/* The Forest Gauntlet Text Nodes */}
        <div ref={refForest} className="w-full flex flex-col items-center max-w-5xl mx-auto pt-[50vh] pb-[50vh]">
          <CinematicText>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Hello, I'm Sam.</h2>
            <p className="text-xl md:text-2xl text-foreground/70 max-w-[40ch]">
              I build digital realities rooted in analog aesthetics.
            </p>
          </CinematicText>

          <CinematicText>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Creative Technologist.</h2>
            <p className="text-xl md:text-2xl text-foreground/70 max-w-[40ch]">
              Bridging the gap between front-end engineering, immersive WebGL, and high-end design.
            </p>
          </CinematicText>

          <CinematicText>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Crafting The Future.</h2>
            <p className="text-xl md:text-2xl text-foreground/70 max-w-[40ch]">
              Using raw materials and massive architectures to tell stories in the browser.
            </p>
          </CinematicText>

          <CinematicText>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Keep Climbing.</h2>
            <p className="text-xl md:text-2xl text-foreground/70 max-w-[40ch]">
              Below is a collection of my favorite spatial experiments and digital expeditions.
            </p>
          </CinematicText>
        </div>

        {/* Checkpoint 2.5: The Night Camp */}
        <div ref={refCamp} className="w-full flex flex-col items-center justify-center min-h-[80vh] py-[30vh]">
          <CinematicText>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 mt-16 text-balance">Relevant Skills.</h2>
            <div className="flex flex-wrap text-center md:text-left justify-center md:justify-start gap-4 mt-8 max-w-2xl mx-auto opacity-80 text-foreground/80 font-mono tracking-widest uppercase text-xs md:text-sm">
              <span className="px-4 py-2 border border-foreground/20 rounded-full">React / Next.js</span>
              <span className="px-4 py-2 border border-foreground/20 rounded-full">Three.js / WebGL</span>
              <span className="px-4 py-2 border border-foreground/20 rounded-full">Framer Motion</span>
              <span className="px-4 py-2 border border-foreground/20 rounded-full">Tailwind CSS</span>
              <span className="px-4 py-2 border border-foreground/20 rounded-full">Sanity CMS</span>
              <span className="px-4 py-2 border border-foreground/20 rounded-full">UI / UX Design</span>
            </div>
          </CinematicText>
        </div>

        {/* Checkpoint 3: The High Alpine - Case Studies */}
        <div ref={refAlpine} className="w-full flex flex-col items-center max-w-7xl mx-auto py-[30vh]">
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
        <section ref={refSummit} className="w-full relative min-h-[350vh] flex flex-col justify-end pb-[20vh] pt-[130vh]">
          <motion.div
            style={{
              opacity: useTransform(scrollSummit, [0.65, 0.73], [0, 1]),
              y: useTransform(scrollSummit, [0.65, 0.73], [100, 0])
            }}
            className="w-full flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto mix-blend-multiply"
          >
            <h2 className="text-6xl md:text-9xl font-bold tracking-tighter uppercase mb-8">Reach Out.</h2>
            <p className="text-xl md:text-3xl text-foreground/80 mb-16 max-w-[20ch]">
              Let's build a reality together.
            </p>
            <a
              href="mailto:hello@example.com"
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
