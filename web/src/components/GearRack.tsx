'use client';

import { MODULE_TIMELINE } from '@/lib/moduleTimeline';
import { motion, MotionValue, useTransform } from 'framer-motion';

const camp = MODULE_TIMELINE.camp;
const campSpan = camp.ownEnd - camp.ownStart;

// Sequential reveal bands for each paragraph + tech line
const bands = {
  shell: [camp.ownStart, camp.enterEnd, camp.exitStart, camp.ownEnd] as const,
  heading: [camp.ownStart + campSpan * 0.06, camp.enterEnd, camp.exitStart - campSpan * 0.04, camp.exitStart + campSpan * 0.1] as const,
  p1: [camp.enterEnd - campSpan * 0.04, camp.enterEnd + campSpan * 0.06, camp.exitStart - campSpan * 0.02, camp.exitStart + campSpan * 0.12] as const,
  p2: [camp.enterEnd + campSpan * 0.04, camp.enterEnd + campSpan * 0.14, camp.exitStart + campSpan * 0.02, camp.exitStart + campSpan * 0.16] as const,
  p3: [camp.enterEnd + campSpan * 0.10, camp.enterEnd + campSpan * 0.20, camp.exitStart + campSpan * 0.06, camp.ownEnd - campSpan * 0.08] as const,
  tech: [camp.enterEnd + campSpan * 0.16, camp.enterEnd + campSpan * 0.26, camp.exitStart + campSpan * 0.10, camp.ownEnd - campSpan * 0.04] as const,
};

const techLine = 'Three.js · GLSL · React · Next.js · TypeScript · Vue · GSAP · Tailwind';

function RevealBlock({
  band,
  scrollProgress,
  children,
  className = '',
}: {
  band: readonly [number, number, number, number];
  scrollProgress: MotionValue<number>;
  children: React.ReactNode;
  className?: string;
}) {
  const opacity = useTransform(scrollProgress, [...band], [0, 1, 1, 0]);
  const y = useTransform(scrollProgress, [band[0], band[1], band[3]], [28, 0, -16]);
  return (
    <motion.div style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
}

export default function GearRack({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const shellOpacity = useTransform(scrollProgress, [...bands.shell], [0, 1, 1, 0]);
  const shellY = useTransform(scrollProgress, [bands.shell[0], bands.shell[1], bands.shell[3]], [52, 0, -28]);

  return (
    <motion.section style={{ opacity: shellOpacity, y: shellY }} className="w-full max-w-3xl">
      <RevealBlock band={bands.heading} scrollProgress={scrollProgress}>
        <p className="mb-3 text-[0.68rem] font-mono uppercase tracking-[0.38em] text-foreground/50">
          Around the Fire
        </p>
      </RevealBlock>

      <RevealBlock band={bands.p1} scrollProgress={scrollProgress} className="mt-6">
        <p className="text-base leading-8 text-foreground/85 md:text-lg md:leading-9">
          Immersive web experiences are the main thing. Three.js, custom GLSL shaders, scroll-driven 3D&nbsp;— 46 production WebGL heroes shipped for CraftedKit. The kind of front-end work that makes people stop scrolling.
        </p>
      </RevealBlock>

      <RevealBlock band={bands.p2} scrollProgress={scrollProgress} className="mt-6">
        <p className="text-base leading-8 text-foreground/85 md:text-lg md:leading-9">
          The marketing builds ship fast without looking like they compromised. Next.js, Vue, GSAP&nbsp;— high-90s Lighthouse scores with the animation budget fully intact. CMS handoffs where the client never files a developer ticket.
        </p>
      </RevealBlock>

      <RevealBlock band={bands.p3} scrollProgress={scrollProgress} className="mt-6">
        <p className="text-base leading-8 text-foreground/85 md:text-lg md:leading-9">
          The force multiplier is the AI pipeline. Four agents running nightly build-review-gate cycles. Solo developer, team-scale output. I wake up to code that was written, tested, and staged while I slept.
        </p>
      </RevealBlock>

      <RevealBlock band={bands.tech} scrollProgress={scrollProgress} className="mt-10">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/35">
          {techLine}
        </p>
      </RevealBlock>
    </motion.section>
  );
}
