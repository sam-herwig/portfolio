'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

type Brand = {
  slug: string;
  name: string;
  tag: string;
  src: string;
};

const BRANDS: Brand[] = [
  { slug: 'fat-tire', name: 'Fat Tire', tag: 'Amber Ale', src: '/work/nb-spotlight-fat-tire.webp' },
  { slug: 'voodoo-ranger', name: 'Voodoo Ranger', tag: 'Imperial IPA', src: '/work/nb-spotlight-voodoo-ranger.webp' },
  { slug: 'lightstrike', name: 'Lightstrike', tag: 'Lemon Lime', src: '/work/nb-spotlight-lightstrike.webp' },
  { slug: 'kirin', name: 'Kirin Ichiban', tag: 'Partnership', src: '/work/nb-spotlight-kirin.webp' },
  { slug: 'nbb', name: 'New Belgium', tag: 'Flagship', src: '/work/nb-spotlight-nbb.webp' },
];

export default function NewBelgiumSpotlight({ caption }: { caption?: string }) {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeBrand = BRANDS[active];
  const figNumber = String(active + 1).padStart(2, '0');

  // Keyboard nav: ←/→ between tabs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!tabsRef.current?.contains(document.activeElement)) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActive((i) => (i + 1) % BRANDS.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActive((i) => (i - 1 + BRANDS.length) % BRANDS.length);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <figure className="relative mx-auto max-w-4xl">
      {/* Small-caps specimen label */}
      <p className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-foreground/40">
        Interactive Specimen — Brand Atlas
      </p>

      {/* Tab row */}
      <div
        ref={tabsRef}
        role="tablist"
        aria-label="New Belgium brand family"
        className="mb-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-b border-foreground/15 pb-4"
      >
        {BRANDS.map((b, i) => {
          const isActive = i === active;
          return (
            <button
              key={b.slug}
              role="tab"
              aria-selected={isActive}
              aria-controls={`nb-panel-${b.slug}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(i)}
              className={`relative font-instrument text-lg italic transition-colors md:text-xl ${
                isActive ? 'text-foreground' : 'text-foreground/45 hover:text-foreground/75'
              }`}
            >
              {b.name}
              {isActive && (
                <motion.span
                  layoutId="nb-active-underline"
                  className="absolute -bottom-[17px] left-0 right-0 h-px bg-foreground"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Slide frame — paper texture, subtle rotation for journal feel */}
      <div className="relative -rotate-[0.3deg] border border-foreground/20 bg-background/60 p-4 md:p-6 shadow-[0_8px_48px_-12px_rgba(0,0,0,0.15)]">
        <div
          id={`nb-panel-${activeBrand.slug}`}
          role="tabpanel"
          aria-label={`${activeBrand.name} — ${activeBrand.tag}`}
          className="relative aspect-[2/1] w-full overflow-hidden bg-foreground/[0.04]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeBrand.slug}
              initial={reduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduced ? {} : { opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.3, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <Image
                src={activeBrand.src}
                alt={`${activeBrand.name} — ${activeBrand.tag}`}
                fill
                sizes="(min-width: 768px) 800px, 100vw"
                className="object-contain"
                unoptimized
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Fig. caption */}
        <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-t border-foreground/10 pt-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/50">
            Fig. {figNumber} — {activeBrand.name} · {activeBrand.tag}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-foreground/35">
            {active + 1} / {BRANDS.length}
          </span>
        </figcaption>
      </div>

      {/* Editorial caption beneath frame */}
      {caption && <p className="mt-5 text-center font-instrument text-base italic text-foreground/55">{caption}</p>}
    </figure>
  );
}
