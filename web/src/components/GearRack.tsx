'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

function LeadCard({ name, tagline, icon, delay }: { name: string; tagline: string; icon: keyof typeof iconMap; delay: string }) {
  const [hovered, setHovered] = useState(false);
  const Icon = iconMap[icon];

  return (
    <motion.div
      variants={childVariants}
      style={{ animationDelay: delay }}
      className={`animate-[ember-pulse_3s_ease-in-out_infinite]`}
    >
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        className={[
          'relative p-6 rounded-2xl backdrop-blur-sm',
          'bg-white/5 border transition-all duration-300 cursor-default select-none',
          hovered
            ? 'border-amber-400/20 shadow-[0_0_30px_-5px_rgba(251,191,36,0.15)]'
            : 'border-white/10',
        ].join(' ')}
      >
        {/* Icon */}
        <div className="text-amber-400/70 mb-4">
          <Icon />
        </div>

        {/* Skill name */}
        <p className="text-lg font-bold tracking-tight text-foreground">{name}</p>

        {/* Tagline — always visible on mobile, hover-reveal on desktop */}
        <div className="mt-2">
          {/* Mobile: always visible */}
          <p className="text-sm text-foreground/60 md:hidden">{tagline}</p>

          {/* Desktop: animate in/out */}
          <AnimatePresence>
            {hovered && (
              <motion.p
                key="tagline"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="hidden md:block text-sm text-foreground/60 overflow-hidden"
              >
                {tagline}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
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

export default function GearRack() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
    >
      <motion.h2
        variants={childVariants}
        className="text-4xl md:text-6xl font-bold tracking-tight mb-10 text-balance"
      >
        The Gear.
      </motion.h2>

      {/* Lead cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        {leadGear.map((item) => (
          <LeadCard key={item.name} {...item} />
        ))}
      </div>

      {/* Essential pills */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {essentials.map((name) => (
          <EssentialPill key={name} name={name} />
        ))}
      </div>
    </motion.section>
  );
}
