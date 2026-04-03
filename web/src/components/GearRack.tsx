'use client';

import { MODULE_TIMELINE } from '@/lib/moduleTimeline';
import { motion, MotionValue, useTransform } from 'framer-motion';

const camp = MODULE_TIMELINE.camp;
const campSpan = camp.ownEnd - camp.ownStart;

const bands = {
  heading: [
    camp.ownStart + campSpan * 0.06,
    camp.enterEnd,
    camp.exitStart - campSpan * 0.04,
    camp.exitStart + campSpan * 0.1,
  ] as const,
  cat1: [
    camp.enterEnd - campSpan * 0.02,
    camp.enterEnd + campSpan * 0.08,
    camp.exitStart,
    camp.exitStart + campSpan * 0.14,
  ] as const,
  cat2: [
    camp.enterEnd + campSpan * 0.04,
    camp.enterEnd + campSpan * 0.14,
    camp.exitStart + campSpan * 0.04,
    camp.exitStart + campSpan * 0.18,
  ] as const,
  cat3: [
    camp.enterEnd + campSpan * 0.1,
    camp.enterEnd + campSpan * 0.2,
    camp.exitStart + campSpan * 0.08,
    camp.ownEnd - campSpan * 0.06,
  ] as const,
  cat4: [
    camp.enterEnd + campSpan * 0.16,
    camp.enterEnd + campSpan * 0.26,
    camp.exitStart + campSpan * 0.12,
    camp.ownEnd - campSpan * 0.02,
  ] as const,
};

const gearCategories = [
  {
    label: 'Creative Engineering',
    tools: ['Three.js / R3F', 'Custom GLSL Shaders', 'WebGL / WebGPU', 'Scroll-Driven 3D'],
    band: bands.cat1,
  },
  {
    label: 'Marketing & CMS',
    tools: ['Next.js / Nuxt', 'GSAP / Framer Motion', 'Sanity / Contentful', 'Optimizely / Episerver'],
    band: bands.cat2,
  },
  {
    label: 'Core Stack',
    tools: ['TypeScript', 'React / Vue', 'Tailwind CSS', 'Node.js'],
    band: bands.cat3,
  },
  {
    label: 'AI & Tooling',
    tools: ['Multi-Agent Pipelines', 'Automated QA Gates', 'Nightly Build Cycles', 'Puppeteer / Playwright'],
    band: bands.cat4,
  },
];

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

function GearCategory({ label, tools }: { label: string; tools: string[] }) {
  return (
    <div>
      <p className="text-[0.65rem] font-mono uppercase tracking-[0.3em] text-current opacity-50 mb-4">{label}</p>
      <ul className="space-y-2">
        {tools.map((tool) => (
          <li key={tool} className="text-sm md:text-base font-medium text-current opacity-90 font-inter">
            {tool}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function GearRack({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  return (
    <div className="w-full">
      <RevealBlock band={bands.heading} scrollProgress={scrollProgress}>
        <p className="text-[0.65rem] font-mono uppercase tracking-[0.35em] text-current opacity-50 mb-2">
          Around the Fire
        </p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter font-instrument text-current leading-[0.9]">
          The Gear
        </h2>
      </RevealBlock>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mt-10">
        {gearCategories.map((cat) => (
          <RevealBlock key={cat.label} band={cat.band} scrollProgress={scrollProgress}>
            <GearCategory label={cat.label} tools={cat.tools} />
          </RevealBlock>
        ))}
      </div>
    </div>
  );
}
