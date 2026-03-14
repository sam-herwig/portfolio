'use client';

import { motion } from 'framer-motion';

const techLogos = [
  'Three.js', 'WebGL', 'GLSL', 'React', 'Next.js', 'Vue', 'Nuxt',
  'TypeScript', 'GSAP', 'Framer Motion', 'Tailwind', 'Sanity',
  'Node.js', 'WebXR', 'D3.js',
];

export default function CredentialStrip() {
  return (
    <motion.section
      className="w-full py-16 text-center"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Credential line */}
      <p className="text-sm font-mono uppercase tracking-widest text-foreground/40 mb-8">
        Currently building at <span className="text-foreground/70">Consume &amp; Create</span>
        <span className="mx-2">·</span>
        <span className="text-foreground/70">CU Boulder MS &apos;21</span>
      </p>

      {/* Tech marquee */}
      <div className="relative overflow-hidden">
        <div className="flex animate-marquee gap-12 items-center">
          {[...techLogos, ...techLogos].map((logo, i) => (
            <span
              key={i}
              className="text-xs font-mono uppercase tracking-[0.2em] text-foreground/20 whitespace-nowrap shrink-0"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
