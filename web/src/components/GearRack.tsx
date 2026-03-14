'use client';

import { useState } from 'react';
import { motion, AnimatePresence, MotionValue, useTransform } from 'framer-motion';

// ─── Data ────────────────────────────────────────────────────────────────────

const leadGear = [
  {
    name: 'Three.js / WebGL',
    tagline: 'Real-time 3D experiences for the web.',
    icon: 'prism' as const,
    delay: '0s',
  },
  {
    name: 'GLSL Shaders',
    tagline: 'Custom vertex and fragment programs for visual effects.',
    icon: 'waveform' as const,
    delay: '1s',
  },
  {
    name: 'AI Agent Pipelines',
    tagline: 'Multi-agent systems that ship code autonomously.',
    icon: 'circuit' as const,
    delay: '2s',
  },
];

const essentials = [
  'React / Next.js',
  'TypeScript',
  'Vue / Nuxt',
  'GSAP',
  'Framer Motion',
  'Tailwind CSS',
  'Sanity CMS',
];

const campBands = {
  shell: [0.445, 0.49, 0.67, 0.71] as const,
  intro: [0.46, 0.5, 0.61, 0.66] as const,
  cards: [0.49, 0.54, 0.63, 0.685] as const,
  pills: [0.55, 0.59, 0.65, 0.7] as const,
};

// ─── Icons ───────────────────────────────────────────────────────────────────

function PrismIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M12 2L2 20h20L12 2z" />
      <path d="M12 2v18" opacity="0.4" />
      <path d="M7 11h10" opacity="0.4" />
    </svg>
  );
}

function WaveformIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <path d="M2 12c2-4 4-8 6-4s4 8 6 4 4-8 6-4" />
    </svg>
  );
}

function CircuitIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
      <circle cx="12" cy="12" r="3" />
      <circle cx="4" cy="6" r="2" />
      <circle cx="20" cy="6" r="2" />
      <circle cx="4" cy="18" r="2" />
      <circle cx="20" cy="18" r="2" />
      <path d="M9.5 10L5.5 7M14.5 10L18.5 7M9.5 14L5.5 17M14.5 14L18.5 17" />
    </svg>
  );
}

const iconMap = {
  prism: PrismIcon,
  waveform: WaveformIcon,
  circuit: CircuitIcon,
};

// ─── Child variants ───────────────────────────────────────────────────────────

const childVariants = {
  hidden: { opacity: 0, y: 30, rotate: -2 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
};

// ─── LeadCard ────────────────────────────────────────────────────────────────

function LeadCard({
  name,
  tagline,
  icon,
  delay,
  featured = false,
}: {
  name: string;
  tagline: string;
  icon: keyof typeof iconMap;
  delay: string;
  featured?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = iconMap[icon];

  return (
    <motion.div
      variants={childVariants}
      style={{ animationDelay: delay }}
      className={featured ? 'md:col-span-2' : ''}
    >
      <motion.div
        whileHover={{ y: -4, scale: 1.015 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className={[
          'relative h-full rounded-[1.75rem] border p-6 transition-all duration-300 cursor-default select-none',
          featured
            ? 'bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))] border-amber-300/18 shadow-[0_0_40px_-18px_rgba(251,191,36,0.18)] md:p-8'
            : 'bg-white/5 border-white/10',
          hovered ? 'border-amber-400/28 shadow-[0_0_34px_-12px_rgba(251,191,36,0.16)]' : '',
        ].join(' ')}
      >
        <div className="mb-4 text-amber-400/70">
          <Icon />
        </div>

        <div className="max-w-[34ch]">
          <p className={`tracking-tight text-foreground ${featured ? 'text-xl md:text-2xl font-semibold' : 'text-lg font-bold'}`}>
            {name}
          </p>
          <p className={`mt-3 text-foreground/72 ${featured ? 'text-sm leading-7 md:text-base md:leading-8' : 'text-sm leading-6'}`}>
            {tagline}
          </p>
        </div>

        <AnimatePresence>
          {hovered && !featured && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute inset-x-6 bottom-5 h-px bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ─── EssentialPill ───────────────────────────────────────────────────────────

function EssentialPill({ name }: { name: string }) {
  return (
    <motion.span
      variants={childVariants}
      className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-widest text-foreground/60 transition-all duration-200 hover:text-foreground/90 hover:border-white/20 cursor-default select-none"
    >
      {name}
    </motion.span>
  );
}

// ─── GearRack ────────────────────────────────────────────────────────────────

export default function GearRack({ scrollProgress }: { scrollProgress: MotionValue<number> }) {
  const shellOpacity = useTransform(scrollProgress, [...campBands.shell], [0, 1, 1, 0]);
  const shellY = useTransform(scrollProgress, [campBands.shell[0], campBands.shell[1], campBands.shell[3]], [52, 0, -28]);
  const introOpacity = useTransform(scrollProgress, [...campBands.intro], [0, 1, 1, 0]);
  const introY = useTransform(scrollProgress, [campBands.intro[0], campBands.intro[1], campBands.intro[3]], [28, 0, -18]);
  const cardsOpacity = useTransform(scrollProgress, [...campBands.cards], [0, 1, 1, 0]);
  const cardsY = useTransform(scrollProgress, [campBands.cards[0], campBands.cards[1], campBands.cards[3]], [36, 0, -20]);
  const pillsOpacity = useTransform(scrollProgress, [...campBands.pills], [0, 1, 1, 0]);
  const pillsY = useTransform(scrollProgress, [campBands.pills[0], campBands.pills[1], campBands.pills[3]], [24, 0, -16]);

  return (
    <motion.section style={{ opacity: shellOpacity, y: shellY }} className="w-full">
      <motion.div
        style={{ opacity: introOpacity, y: introY }}
        className="grid gap-8 md:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)] md:items-end md:gap-12"
      >
        <div className="max-w-xl text-left">
          <p className="mb-3 text-[0.68rem] font-mono uppercase tracking-[0.38em] text-foreground/45">
            Basecamp Briefing
          </p>
          <h2 className="text-4xl font-semibold tracking-tight text-balance md:text-6xl">
            The Gear.
          </h2>
        </div>

        <p className="max-w-2xl text-left text-sm leading-7 text-foreground/72 md:ml-auto md:text-base md:leading-8">
          This is the expedition kit: real-time 3D, custom shader work, and front-end systems built to hold up under real devices, real teams, and real launch pressure.
        </p>
      </motion.div>

      <motion.div
        style={{ opacity: cardsOpacity, y: cardsY }}
        className="mt-10 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-3 md:gap-6"
      >
        {leadGear.map((item, index) => (
          <LeadCard key={item.name} {...item} featured={index === 0} />
        ))}
      </motion.div>

      <motion.div style={{ opacity: pillsOpacity, y: pillsY }} className="mt-8 md:mt-10">
        <p className="mb-4 text-left text-[0.68rem] font-mono uppercase tracking-[0.32em] text-foreground/40">
          Supporting kit
        </p>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {essentials.map((name) => (
            <EssentialPill key={name} name={name} />
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
